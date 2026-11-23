import { createSignal, onMount, onCleanup, type JSX } from 'solid-js';
import { ScrollEngine } from './ScrollEngine';
import { ReadingMarker } from './ReadingMarker';
import { HudOverlayControls } from './HudOverlayControls';
import { loadSettings, loadScript } from '../lib/ipc';
import { onPrompterAction, onUpdateScript, emitStateSync } from '../lib/eventBus';
import type { Script, Settings } from '../lib/types';

export default function HudApp(): JSX.Element {
  const [script, setScript] = createSignal<Script>({
    id: 'default',
    title: 'Welcome Script',
    content: 'Welcome to StealthPrompter.\nYour invisible prompter overlay is active.\nUse Alt+Space to Play/Pause, Alt+Up/Down for Speed, and Alt+H to hide.',
    last_position: 0,
    speed: 3.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cues: [],
  });

  const [settings, setSettings] = createSignal<Settings>({
    scroll_speed: 3.0,
    font_size: 28,
    line_height: 1.5,
    window_opacity: 0.9,
    mirror_mode: false,
    click_through: false,
    theme: 'dark-glass',
    last_script_id: null,
    offline_only: true,
    telemetry_enabled: false,
    geometry: null,
    hotkeys: {
      toggle_play: 'Alt+Space',
      speed_up: 'Alt+Up',
      speed_down: 'Alt+Down',
      toggle_window: 'Alt+H',
    },
  });

  const [cssTransform, setCssTransform] = createSignal<string>('translate3d(0px, 0px, 0px) scale(1, 1)');
  const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
  const [speed, setSpeed] = createSignal<number>(3.0);

  let unlistenAction: (() => void) | null = null;
  let unlistenUpdate: (() => void) | null = null;

  const engine = new ScrollEngine({
    speed: 3.0,
    basePixelsPerSec: 40.0,
    mirrorHorizontal: false,
  });

  const syncState = () => {
    setIsPlaying(engine.isPlaying);
    setSpeed(engine.speed);
    emitStateSync({
      playing: engine.isPlaying,
      speed: engine.speed,
      progress: engine.scrollY,
    });
  };

  onMount(async () => {
    try {
      const loaded = await loadSettings();
      setSettings(loaded);
      engine.setSpeed(loaded.scroll_speed);
      engine.setMirror(loaded.mirror_mode);
      setSpeed(loaded.scroll_speed);

      if (loaded.last_script_id) {
        try {
          const s = await loadScript(loaded.last_script_id);
          setScript(s);
          if (s.last_position > 0) {
            engine.scrollY = s.last_position;
            setCssTransform(engine.getCssTransform());
          }
        } catch {
          // Keep default
        }
      }
    } catch {
      // Fallback
    }

    engine.setUpdateCallback((_y, transform) => {
      setCssTransform(transform);
    });

    unlistenAction = await onPrompterAction((payload) => {
      switch (payload.type) {
        case 'play':
          engine.play();
          syncState();
          break;
        case 'pause':
          engine.pause();
          syncState();
          break;
        case 'toggle_play':
          engine.toggle();
          syncState();
          break;
        case 'speed_change':
          if (typeof payload.value === 'number') {
            engine.setSpeed(payload.value);
            syncState();
          }
          break;
        case 'speed_up':
          engine.setSpeed(Math.min(10, engine.speed + 1));
          syncState();
          break;
        case 'speed_down':
          engine.setSpeed(Math.max(1, engine.speed - 1));
          syncState();
          break;
        case 'rewind':
          engine.rewind(120);
          syncState();
          break;
        case 'reset':
          engine.reset();
          syncState();
          break;
      }
    });

    unlistenUpdate = await onUpdateScript((payload) => {
      if (payload.script) {
        setScript(payload.script);
        if (payload.script.last_position !== undefined) {
          engine.scrollY = payload.script.last_position;
          setCssTransform(engine.getCssTransform());
        }
      }
    });
  });

  onCleanup(() => {
    engine.pause();
    if (unlistenAction) unlistenAction();
    if (unlistenUpdate) unlistenUpdate();
  });

  return (
    <div
      class="w-screen h-screen bg-transparent overflow-hidden select-none pointer-events-none relative font-sans"
      style={{
        opacity: settings().window_opacity,
      }}
    >
      <HudOverlayControls
        isPlaying={isPlaying()}
        speed={speed()}
        clickThrough={settings().click_through}
        onTogglePlay={() => {
          engine.toggle();
          syncState();
        }}
        onRewind={() => {
          engine.rewind(120);
          syncState();
        }}
        onSpeedUp={() => {
          engine.setSpeed(Math.min(10, engine.speed + 1));
          syncState();
        }}
        onSpeedDown={() => {
          engine.setSpeed(Math.max(1, engine.speed - 1));
          syncState();
        }}
      />

      <ReadingMarker topPercent={35} heightPx={2} glow={true} />

      {/* Prompter Scrolling Canvas */}
      <main class="w-full h-full pt-[35vh] px-12 box-border">
        <div
          class="will-change-transform text-white font-medium whitespace-pre-wrap transition-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          style={{
            transform: cssTransform(),
            'font-size': `${settings().font_size}px`,
            'line-height': `${settings().line_height}`,
          }}
        >
          {script().content}
        </div>
      </main>
    </div>
  );
}
