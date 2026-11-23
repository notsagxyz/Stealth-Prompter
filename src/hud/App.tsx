import { createSignal, onMount, onCleanup, Show, type JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ScrollEngine } from './ScrollEngine';
import { ReadingMarker } from './ReadingMarker';
import { HudOverlayControls } from './HudOverlayControls';
import { loadSettings, saveSettings, loadScript, setClickThrough } from '../lib/ipc';
import { onPrompterAction, onUpdateScript, emitStateSync, onToggleLock } from '../lib/eventBus';
import type { Script, Settings } from '../lib/types';

const stepSpeed = (current: number, direction: 'up' | 'down'): number => {
  if (direction === 'up') {
    if (current < 1.0) return Math.round((current + 0.1) * 10) / 10;
    if (current < 3.0) return Math.round((current + 0.2) * 10) / 10;
    if (current < 6.0) return Math.round((current + 0.5) * 10) / 10;
    return Math.min(15.0, Math.round(current + 1.0));
  } else {
    if (current <= 1.0) return Math.max(0.2, Math.round((current - 0.1) * 10) / 10);
    if (current <= 3.0) return Math.round((current - 0.2) * 10) / 10;
    if (current <= 6.0) return Math.round((current - 0.5) * 10) / 10;
    return Math.round(current - 1.0);
  }
};

export default function HudApp(): JSX.Element {
  const [script, setScript] = createSignal<Script>({
    id: 'default',
    title: 'Welcome Speech',
    content: 'Welcome to StealthPrompter.\n\nYour prompter is running and completely hidden from screen recording and video calls.\n\nUse Alt+Space to Play/Pause, Alt+Up/Down for Speed, and Alt+H to show or hide this window.',
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
  let unlistenLock: (() => void) | null = null;

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
          engine.setSpeed(stepSpeed(engine.speed, 'up'));
          syncState();
          break;
        case 'speed_down':
          engine.setSpeed(stepSpeed(engine.speed, 'down'));
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

    unlistenLock = await onToggleLock(async () => {
      await handleToggleClickThrough();
    });
  });

  onCleanup(() => {
    engine.pause();
    if (unlistenAction) unlistenAction();
    if (unlistenUpdate) unlistenUpdate();
    if (unlistenLock) unlistenLock();
  });

  const handleToggleClickThrough = async () => {
    const nextVal = !settings().click_through;
    const updated = { ...settings(), click_through: nextVal };
    setSettings(updated);
    await setClickThrough(nextVal);
    await saveSettings(updated);
  };

  const handleClose = async () => {
    try {
      engine.pause();
      syncState();
      await getCurrentWindow().hide();
    } catch (err) {
      console.warn('Error hiding window:', err);
    }
  };

  const handleResize = (direction: 'East' | 'North' | 'NorthEast' | 'NorthWest' | 'South' | 'SouthEast' | 'SouthWest' | 'West') => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      getCurrentWindow().startResizeDragging(direction);
    } catch (err) {
      console.warn('startResizeDragging error:', err);
    }
  };

  return (
    <div
      class={`w-screen h-screen overflow-hidden select-none relative font-sans p-1 box-border ${
        settings().click_through ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Outer Frosted Glass Container */}
      <div
        class="w-full h-full rounded-2xl relative overflow-hidden transition-opacity duration-200 border border-white/10 shadow-hud"
        style={{
          background: `rgba(12, 14, 18, ${Math.max(0.2, settings().window_opacity)})`,
          'backdrop-filter': 'blur(28px)',
          '-webkit-backdrop-filter': 'blur(28px)',
        }}
      >
        {/* Top Control Bar with Drag Support */}
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
            engine.setSpeed(stepSpeed(engine.speed, 'up'));
            syncState();
          }}
          onSpeedDown={() => {
            engine.setSpeed(stepSpeed(engine.speed, 'down'));
            syncState();
          }}
          onToggleClickThrough={handleToggleClickThrough}
          onClose={handleClose}
        />

        {/* Subtle Horizontal Eye-line Reading Marker */}
        <ReadingMarker topPercent={35} heightPx={1} />

        {/* Prompter Scrolling Canvas */}
        <main class="w-full h-full pt-[35vh] px-10 box-border pointer-events-none">
          <div
            class="will-change-transform text-slate-100 font-normal whitespace-pre-wrap transition-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] max-w-4xl mx-auto"
            style={{
              transform: cssTransform(),
              'font-size': `${settings().font_size}px`,
              'line-height': `${settings().line_height}`,
            }}
          >
            {script().content}
          </div>
        </main>

        {/* Native Win32 Window Resize Dragging Zones (Active when click-through is false) */}
        <Show when={!settings().click_through}>
          {/* Edges */}
          <div
            onMouseDown={handleResize('North')}
            class="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-50 hover:bg-white/5"
            title="Resize Top"
          />
          <div
            onMouseDown={handleResize('South')}
            class="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-50 hover:bg-white/5"
            title="Resize Bottom"
          />
          <div
            onMouseDown={handleResize('West')}
            class="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-50 hover:bg-white/5"
            title="Resize Left"
          />
          <div
            onMouseDown={handleResize('East')}
            class="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize z-50 hover:bg-white/5"
            title="Resize Right"
          />

          {/* Corners */}
          <div
            onMouseDown={handleResize('NorthWest')}
            class="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50"
            title="Resize Top-Left"
          />
          <div
            onMouseDown={handleResize('NorthEast')}
            class="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50"
            title="Resize Top-Right"
          />
          <div
            onMouseDown={handleResize('SouthWest')}
            class="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
            title="Resize Bottom-Left"
          />

          {/* SouthEast (Bottom-Right) Corner with Visible Diagonal Resize Grip */}
          <div
            onMouseDown={handleResize('SouthEast')}
            class="absolute bottom-1 right-1 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end p-1 group"
            title="Drag to resize window"
          >
            <svg class="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 transition-colors" viewBox="0 0 16 16" fill="none">
              <path d="M14 14L8 14M14 10L10 14M14 6L6 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </div>
        </Show>
      </div>
    </div>
  );
}
