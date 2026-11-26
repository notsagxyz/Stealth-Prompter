import { createSignal, onMount, onCleanup, type JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ScrollEngine } from './ScrollEngine';
import { ReadingMarker } from './ReadingMarker';
import { HudOverlayControls } from './HudOverlayControls';
import { loadSettings, saveSettings, loadScript, setClickThrough, togglePrompterWindow } from '../lib/ipc';
import { onPrompterAction, onUpdateScript, emitStateSync, onSettingsSync } from '../lib/eventBus';
import { ScriptSanitizer } from '../lib/sanitizer';
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

const ACCENT_MAP: Record<string, string> = {
  violet: '#7c6cff',
  indigo: '#6366f1',
  crimson: '#f43f5e',
  emerald: '#10b981',
  amber: '#f59e0b',
  cyan: '#06b6d4',
};

function applyAccentToken(accent?: string) {
  const key = (accent || '#7c6cff').toLowerCase().trim();
  const color = ACCENT_MAP[key] || (key.startsWith('#') ? key : '#7c6cff');
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--accent', color);
    // Compute 35% alpha glow
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    }
  }
}

export default function HudApp(): JSX.Element {
  const [script, setScript] = createSignal<Script>({
    id: 'default',
    title: 'Welcome Speech',
    content:
      'Welcome to Stealth.\n\nYour prompter is completely hidden from screen sharing and video recordings.\n\nScroll manually anytime with your mouse wheel, touchpad, or by dragging text.\n\nGlobal shortcuts: Alt+Space to Play/Pause, Alt+Up/Down for Speed, Alt+PageUp/PageDown to Scroll, Alt+Shift+Up/Down for Opacity, Alt+L for Click-Through, and Alt+H to Hide.',
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
    window_opacity: 0.85,
    mirror_mode: false,
    click_through: false,
    theme: 'dark-glass',
    accent_color: '#7c6cff',
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
  const [barCollapsed, setBarCollapsed] = createSignal<boolean>(false);

  let isDraggingText = false;
  let dragLastY = 0;
  let textContentRef: HTMLDivElement | undefined;

  const updateMaxScrollBounds = () => {
    if (textContentRef) {
      const max = Math.max(240, textContentRef.scrollHeight + 120);
      engine.setMaxScrollY(max);
    }
  };

  let unlistenAction: (() => void) | null = null;
  let unlistenUpdate: (() => void) | null = null;
  let unlistenSettings: (() => void) | null = null;

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
      applyAccentToken(loaded.accent_color);
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
    setTimeout(updateMaxScrollBounds, 50);

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
        case 'scroll_up':
          engine.manualScroll(-(payload.value ?? 90), true);
          syncState();
          break;
        case 'scroll_down':
          engine.manualScroll(payload.value ?? 90, true);
          syncState();
          break;
        case 'opacity_up': {
          const nextOp = Math.min(1.0, Math.round((settings().window_opacity + 0.1) * 100) / 100);
          void persistSettingPatch({ window_opacity: nextOp });
          break;
        }
        case 'opacity_down': {
          const nextOp = Math.max(0.1, Math.round((settings().window_opacity - 0.1) * 100) / 100);
          void persistSettingPatch({ window_opacity: nextOp });
          break;
        }
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
        setTimeout(updateMaxScrollBounds, 30);
        if (payload.script.last_position !== undefined) {
          engine.scrollY = payload.script.last_position;
          setCssTransform(engine.getCssTransform());
        }
      }
    });

    unlistenSettings = await onSettingsSync((s) => {
      setSettings(s);
      applyAccentToken(s.accent_color);
      engine.setSpeed(s.scroll_speed);
      engine.setMirror(s.mirror_mode);
      setSpeed(s.scroll_speed);
      setCssTransform(engine.getCssTransform());
    });
  });

  onCleanup(() => {
    engine.pause();
    if (unlistenAction) unlistenAction();
    if (unlistenUpdate) unlistenUpdate();
    if (unlistenSettings) unlistenSettings();
  });

  const persistSettingPatch = async (patch: Partial<Settings>) => {
    const updated = { ...settings(), ...patch };
    setSettings(updated);
    if (patch.mirror_mode !== undefined) {
      engine.setMirror(patch.mirror_mode);
    }
    if (patch.scroll_speed !== undefined) {
      engine.setSpeed(patch.scroll_speed);
      setSpeed(patch.scroll_speed);
    }
    await saveSettings(updated);
  };

  const handleToggleClickThrough = async () => {
    const nextVal = !settings().click_through;
    setSettings({ ...settings(), click_through: nextVal });
    await setClickThrough(nextVal);
  };

  const handleClose = async () => {
    try {
      engine.pause();
      syncState();
      await togglePrompterWindow();
    } catch (err) {
      console.warn('Error hiding window:', err);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (settings().click_through) return;
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 240 : 1;
    const deltaPx = e.deltaY * scale;
    // Use smooth easing for wheel steps while keeping direct touchpad precision
    const isFineTouchpad = Math.abs(deltaPx) < 18;
    engine.manualScroll(deltaPx, !isFineTouchpad);
    syncState();
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (settings().click_through || e.button !== 0) return;
    isDraggingText = true;
    dragLastY = e.clientY;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore if unsupported
    }
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingText || settings().click_through) return;
    const dy = dragLastY - e.clientY;
    dragLastY = e.clientY;
    if (Math.abs(dy) > 0.5) {
      engine.manualScroll(dy, false);
      syncState();
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDraggingText) return;
    isDraggingText = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleResize =
    (
      direction:
        | 'East'
        | 'North'
        | 'NorthEast'
        | 'NorthWest'
        | 'South'
        | 'SouthEast'
        | 'SouthWest'
        | 'West'
    ) =>
    (e: MouseEvent) => {
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
      onWheel={handleWheel}
      class={`w-screen h-screen overflow-hidden select-none relative font-sans p-1 box-border ${
        settings().click_through ? 'hud-click-through pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Ultra-discreet Dark Glass Container (background opacity 10%-100%, text stays 100% readable) */}
      <div
        class="w-full h-full rounded-[22px] relative overflow-hidden transition-colors duration-200 border border-white/[0.08] shadow-hud"
        style={{
          background: `rgba(11, 11, 18, ${Math.max(0.1, Math.min(1.0, settings().window_opacity))})`,
          'backdrop-filter': 'blur(24px)',
          '-webkit-backdrop-filter': 'blur(24px)',
        }}
      >
        {/* Subtle Horizontal Eye-line Reading Marker */}
        <ReadingMarker topPercent={32} heightPx={1} />

        {/* Prompter Scrolling Canvas (supports wheel, touchpad & vertical drag) */}
        <main
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          class={`w-full h-full pt-[28vh] pb-20 px-10 box-border ${
            settings().click_through ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'
          }`}
        >
          <div
            ref={textContentRef}
            dir={ScriptSanitizer.detectRtl(script().content) ? 'rtl' : 'ltr'}
            class="will-change-transform text-[#f4f4f8] font-normal whitespace-pre-wrap transition-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] max-w-4xl mx-auto"
            style={{
              transform: cssTransform(),
              'font-size': `${settings().font_size}px`,
              'line-height': `${settings().line_height}`,
            }}
          >
            {script().content}
          </div>
        </main>

        {/* Bottom Floating Pill Control Bar */}
        <HudOverlayControls
          isPlaying={isPlaying()}
          speed={speed()}
          fontSize={settings().font_size}
          opacity={settings().window_opacity}
          mirrorMode={settings().mirror_mode}
          clickThrough={settings().click_through}
          barCollapsed={barCollapsed()}
          onToggleCollapse={() => setBarCollapsed(!barCollapsed())}
          onTogglePlay={() => {
            engine.toggle();
            syncState();
          }}
          onRewind={() => {
            engine.reset();
            syncState();
          }}
          onSpeedUp={() => {
            const next = stepSpeed(engine.speed, 'up');
            engine.setSpeed(next);
            syncState();
            persistSettingPatch({ scroll_speed: next });
          }}
          onSpeedDown={() => {
            const next = stepSpeed(engine.speed, 'down');
            engine.setSpeed(next);
            syncState();
            persistSettingPatch({ scroll_speed: next });
          }}
          onFontUp={() => {
            persistSettingPatch({ font_size: Math.min(72, settings().font_size + 2) });
          }}
          onFontDown={() => {
            persistSettingPatch({ font_size: Math.max(14, settings().font_size - 2) });
          }}
          onOpacityChange={(val) => {
            persistSettingPatch({ window_opacity: Math.max(0.1, Math.min(1.0, val)) });
          }}
          onToggleMirror={() => {
            persistSettingPatch({ mirror_mode: !settings().mirror_mode });
          }}
          onToggleClickThrough={handleToggleClickThrough}
          onClose={handleClose}
        />

        {/* Edge Resize Handles (when interactive) */}
        {!settings().click_through && (
          <>
            <div onMouseDown={handleResize('North')} class="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize z-50" />
            <div onMouseDown={handleResize('South')} class="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize z-50" />
            <div onMouseDown={handleResize('West')} class="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize z-50" />
            <div onMouseDown={handleResize('East')} class="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize z-50" />
            <div onMouseDown={handleResize('NorthWest')} class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" />
            <div onMouseDown={handleResize('NorthEast')} class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" />
            <div onMouseDown={handleResize('SouthWest')} class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" />
            <div onMouseDown={handleResize('SouthEast')} class="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" />
          </>
        )}
      </div>
    </div>
  );
}
