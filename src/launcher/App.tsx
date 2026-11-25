import { createSignal, onMount, onCleanup, Show, type JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Script, ScriptSummary, Settings } from '../lib/types';
import {
  loadSettings,
  saveSettings,
  listScripts,
  loadScript,
  saveScript,
  deleteScript,
  setCaptureExclusion,
  getCaptureExclusion,
  togglePrompterWindow,
  setClickThrough,
} from '../lib/ipc';
import {
  emitPrompterAction,
  emitUpdateScript,
  onStateSync,
  onSettingsSync,
  onVisibilityChanged,
} from '../lib/eventBus';
import { ScriptEditor } from './ScriptEditor';
import { ScriptList } from './ScriptList';
import { SettingsPanel } from './SettingsPanel';
import {
  EyeIcon,
  TeleprompterLogo,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  LockIcon,
} from '../components/Icons';

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

export default function LauncherApp(): JSX.Element {
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

  const [scripts, setScripts] = createSignal<ScriptSummary[]>([]);
  const [activeScript, setActiveScript] = createSignal<Script | null>(null);
  const [invisibilityActive, setInvisibilityActive] = createSignal<boolean>(true);
  const [hudVisible, setHudVisible] = createSignal<boolean>(false);
  const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
  const [hudSpeed, setHudSpeed] = createSignal<number>(3.0);
  const [sidebarOpen, setSidebarOpen] = createSignal<boolean>(true);

  let unlistenSync: (() => void) | null = null;
  let unlistenSettings: (() => void) | null = null;
  let unlistenVisibility: (() => void) | null = null;

  onMount(async () => {
    try {
      const s = await loadSettings();
      setSettings(s);
      setHudSpeed(s.scroll_speed);

      const scriptSummaries = await listScripts();
      setScripts(scriptSummaries);

      if (s.last_script_id) {
        try {
          const loaded = await loadScript(s.last_script_id);
          setActiveScript(loaded);
        } catch {
          if (scriptSummaries.length > 0) {
            const first = await loadScript(scriptSummaries[0].id);
            setActiveScript(first);
          }
        }
      } else if (scriptSummaries.length > 0) {
        const first = await loadScript(scriptSummaries[0].id);
        setActiveScript(first);
      }

      const exclusion = await getCaptureExclusion('prompter');
      setInvisibilityActive(exclusion);
    } catch (e) {
      console.warn('Initialization error:', e);
    }

    unlistenSync = await onStateSync((state) => {
      setIsPlaying(state.playing);
      setHudSpeed(state.speed);
    });

    unlistenSettings = await onSettingsSync((synced) => {
      setSettings(synced);
      setHudSpeed(synced.scroll_speed);
    });

    unlistenVisibility = await onVisibilityChanged((visible) => {
      setHudVisible(visible);
    });
  });

  onCleanup(() => {
    if (unlistenSync) unlistenSync();
    if (unlistenSettings) unlistenSettings();
    if (unlistenVisibility) unlistenVisibility();
  });

  const handleSelectScript = async (id: string) => {
    try {
      const s = await loadScript(id);
      setActiveScript(s);
      const updatedSettings = { ...settings(), last_script_id: id };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      await emitUpdateScript(s);
    } catch (e) {
      console.error('Failed to select script:', e);
    }
  };

  const handleCreateScript = async () => {
    const newScript: Script = {
      id: `script_${Date.now()}`,
      title: 'New Speech',
      content: 'Write your speech script here...',
      last_position: 0,
      speed: settings().scroll_speed,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cues: [],
    };
    await saveScript(newScript);
    const updated = await listScripts();
    setScripts(updated);
    setActiveScript(newScript);
    await emitUpdateScript(newScript);
  };

  const handleDeleteScript = async (id: string) => {
    await deleteScript(id);
    const updated = await listScripts();
    setScripts(updated);
    if (activeScript()?.id === id) {
      if (updated.length > 0) {
        handleSelectScript(updated[0].id);
      } else {
        setActiveScript(null);
      }
    }
  };

  const handleSaveScript = async (script: Script) => {
    await saveScript(script);
    setActiveScript(script);
    const updated = await listScripts();
    setScripts(updated);
    await emitUpdateScript(script);
  };

  const handleSettingsChange = async (updated: Settings) => {
    setSettings(updated);
    setHudSpeed(updated.scroll_speed);
    await saveSettings(updated);
  };

  const handleTogglePrompter = async () => {
    await togglePrompterWindow();
  };

  const handlePlayPause = async () => {
    await emitPrompterAction({ type: isPlaying() ? 'pause' : 'play' });
    setIsPlaying(!isPlaying());
  };

  const handleRewind = async () => {
    await emitPrompterAction({ type: 'rewind' });
  };

  const handleSpeedStep = async (direction: 'up' | 'down') => {
    const next = stepSpeed(hudSpeed(), direction);
    setHudSpeed(next);
    const updatedSettings = { ...settings(), scroll_speed: next };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleToggleClickThrough = async () => {
    const nextVal = !settings().click_through;
    setSettings({ ...settings(), click_through: nextVal });
    await setClickThrough(nextVal);
  };

  const handleToggleInvisibility = async (enabled: boolean) => {
    try {
      await setCaptureExclusion('prompter', enabled);
      setInvisibilityActive(enabled);
    } catch (e) {
      console.error('Failed to toggle invisibility:', e);
    }
  };

  const handleWindowClose = () => {
    try {
      getCurrentWindow().close();
    } catch (err) {
      console.warn('close error:', err);
    }
  };

  const handleWindowMinimize = () => {
    try {
      getCurrentWindow().minimize();
    } catch (err) {
      console.warn('minimize error:', err);
    }
  };

  const handleWindowMaximize = () => {
    try {
      getCurrentWindow().toggleMaximize();
    } catch (err) {
      console.warn('maximize error:', err);
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
    <div class="w-screen h-screen overflow-hidden select-none relative font-sans bg-transparent p-[1px] box-border">
      {/* Main Frameless Matte Studio Shell */}
      <div class="w-full h-full rounded-xl bg-[#09090B] border border-white/[0.08] overflow-hidden flex flex-col relative shadow-2xl">
        {/* Custom Frameless Titlebar */}
        <header
          data-tauri-drag-region
          class="h-10 bg-[#0D0D10] border-b border-white/[0.07] flex items-center justify-between px-3 shrink-0 select-none"
        >
          {/* Left: App Brand + Sidebar Toggle */}
          <div data-tauri-drag-region class="flex items-center gap-2.5">
            <div data-tauri-drag-region class="flex items-center gap-2 pl-1">
              <TeleprompterLogo class="w-4 h-4 text-white" />
              <span class="text-xs font-semibold text-zinc-100 tracking-tight">
                Stealth
              </span>
            </div>

            <div class="h-3.5 w-[1px] bg-white/[0.08]" />

            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen())}
              title={sidebarOpen() ? 'Hide Scripts Sidebar' : 'Show Scripts Sidebar'}
              class={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                sidebarOpen()
                  ? 'bg-white/[0.07] text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              Scripts
            </button>
          </div>

          {/* Right: Lock Badge (when locked) + Show/Hide HUD + Monochrome Window Controls */}
          <div class="flex items-center gap-2">
            <Show when={settings().click_through}>
              <button
                type="button"
                onClick={handleToggleClickThrough}
                title="Click-Through is active. Click to unlock or press Alt+L."
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-colors"
              >
                <LockIcon class="w-3 h-3" />
                <span>HUD Locked · Unlock</span>
              </button>
            </Show>

            <button
              type="button"
              onClick={handleTogglePrompter}
              title="Toggle Prompter HUD (Alt+H)"
              class={`h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                hudVisible()
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-white text-zinc-950 hover:bg-zinc-200'
              }`}
            >
              <EyeIcon class="w-3.5 h-3.5" />
              <span>{hudVisible() ? 'Hide HUD' : 'Show HUD'}</span>
            </button>

            <div class="h-3.5 w-[1px] bg-white/[0.08] mx-0.5" />

            {/* Clean Monochrome Window Controls (Minimize, Maximize, Close) */}
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleWindowMinimize}
                title="Minimize"
                class="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
              >
                <MinimizeIcon class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleWindowMaximize}
                title="Maximize"
                class="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
              >
                <MaximizeIcon class="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleWindowClose}
                title="Close"
                class="w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-red-500/15 transition-colors"
              >
                <CloseIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* 3-Column Studio Body */}
        <div class="flex-1 flex min-h-0 overflow-hidden">
          {/* Left Rail: Script Library */}
          <Show when={sidebarOpen()}>
            <div class="w-[228px] shrink-0 h-full border-r border-white/[0.07]">
              <ScriptList
                scripts={scripts()}
                selectedId={activeScript()?.id || null}
                onSelect={handleSelectScript}
                onCreate={handleCreateScript}
                onDelete={handleDeleteScript}
              />
            </div>
          </Show>

          {/* Center Canvas: Script Editor */}
          <main class="flex-1 min-w-0 h-full">
            <ScriptEditor
              script={activeScript()}
              onSave={handleSaveScript}
            />
          </main>

          {/* Right Inspector: Controls & Settings */}
          <SettingsPanel
            settings={settings()}
            isPlaying={isPlaying()}
            speed={hudSpeed()}
            invisibilityActive={invisibilityActive()}
            onChange={handleSettingsChange}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
            onSpeedStep={handleSpeedStep}
            onToggleClickThrough={handleToggleClickThrough}
            onToggleInvisibility={handleToggleInvisibility}
          />
        </div>

        {/* Native Frameless Edge & Corner Resize Handles */}
        <div onMouseDown={handleResize('North')} class="absolute top-0 left-2 right-2 h-1 cursor-n-resize z-50" />
        <div onMouseDown={handleResize('South')} class="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize z-50" />
        <div onMouseDown={handleResize('West')} class="absolute top-2 bottom-2 left-0 w-1 cursor-w-resize z-50" />
        <div onMouseDown={handleResize('East')} class="absolute top-2 bottom-2 right-0 w-1 cursor-e-resize z-50" />
        <div onMouseDown={handleResize('NorthWest')} class="absolute top-0 left-0 w-2 h-2 cursor-nw-resize z-50" />
        <div onMouseDown={handleResize('NorthEast')} class="absolute top-0 right-0 w-2 h-2 cursor-ne-resize z-50" />
        <div onMouseDown={handleResize('SouthWest')} class="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize z-50" />
        <div onMouseDown={handleResize('SouthEast')} class="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize z-50" />
      </div>
    </div>
  );
}
