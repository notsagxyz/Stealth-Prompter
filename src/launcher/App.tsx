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
  onToggleLock,
} from '../lib/eventBus';
import { ScriptEditor } from './ScriptEditor';
import { ScriptList } from './ScriptList';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '../components/Button';
import {
  PlayIcon,
  PauseIcon,
  RewindIcon,
  EyeIcon,
  SettingsIcon,
  TeleprompterLogo,
  ShieldCheckIcon,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  FolderIcon,
  ChevronDownIcon,
  LockIcon,
  UnlockIcon,
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
  const [isPlaying, setIsPlaying] = createSignal<boolean>(false);
  const [hudSpeed, setHudSpeed] = createSignal<number>(3.0);
  const [isLibraryOpen, setIsLibraryOpen] = createSignal<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = createSignal<boolean>(false);

  let unlistenSync: (() => void) | null = null;
  let unlistenLock: (() => void) | null = null;

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

    unlistenLock = await onToggleLock(async () => {
      await handleToggleClickThrough();
    });
  });

  onCleanup(() => {
    if (unlistenSync) unlistenSync();
    if (unlistenLock) unlistenLock();
  });

  const handleSelectScript = async (id: string) => {
    try {
      const s = await loadScript(id);
      setActiveScript(s);
      const updatedSettings = { ...settings(), last_script_id: id };
      setSettings(updatedSettings);
      await saveSettings(updatedSettings);
      await emitUpdateScript(s);
      setIsLibraryOpen(false);
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
    setIsLibraryOpen(false);
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
    await saveSettings(updated);
    await emitPrompterAction({ type: 'speed_change', value: updated.scroll_speed });
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
    await emitPrompterAction({ type: 'speed_change', value: next });
  };

  const handleToggleClickThrough = async () => {
    const nextVal = !settings().click_through;
    const updated = { ...settings(), click_through: nextVal };
    setSettings(updated);
    await setClickThrough(nextVal);
    await saveSettings(updated);
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

  return (
    <div
      class="w-screen h-screen overflow-hidden select-none relative font-sans flex flex-col p-1.5 box-border"
      style={{
        background: 'transparent',
      }}
    >
      {/* Outer Rounded Glass Window Container */}
      <div
        class="w-full h-full rounded-2xl relative overflow-hidden flex flex-col border border-white/10 shadow-hud"
        style={{
          background: 'radial-gradient(130% 100% at 50% 0%, #151824 0%, #0C0D12 60%, #07080A 100%)',
        }}
      >
        {/* Custom Frameless Titlebar (No default Windows buttons) */}
        <header
          data-tauri-drag-region
          class="h-12 border-b border-white/[0.07] bg-black/40 backdrop-blur-md flex items-center justify-between px-4 z-30 shrink-0 select-none"
        >
          {/* Left: Custom Window Control Dots (Close, Minimize, Maximize) + App Mark */}
          <div data-tauri-drag-region class="flex items-center gap-3">
            <div class="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleWindowClose}
                title="Close Window"
                class="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-black/70 hover:text-black transition-all group"
              >
                <CloseIcon class="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={handleWindowMinimize}
                title="Minimize Window"
                class="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 flex items-center justify-center text-black/70 hover:text-black transition-all group"
              >
                <MinimizeIcon class="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                type="button"
                onClick={handleWindowMaximize}
                title="Maximize Window"
                class="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 flex items-center justify-center text-black/70 hover:text-black transition-all group"
              >
                <MaximizeIcon class="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            <div class="h-3 w-[1px] bg-white/10 mx-1" />

            <div data-tauri-drag-region class="flex items-center gap-2">
              <TeleprompterLogo class="w-4 h-4 text-white/90" />
              <span class="text-xs font-semibold text-white tracking-tight">StealthPrompter</span>
            </div>
          </div>

          {/* Center: Speech Selector Pill & Screen Invisibility Status */}
          <div data-tauri-drag-region class="flex items-center gap-2.5">
            {/* Speech Selector Dropdown Button (Opens Library Drawer) */}
            <button
              type="button"
              onClick={() => setIsLibraryOpen(!isLibraryOpen())}
              class="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-white transition-all shadow-sm"
              title="Click to browse or switch speeches"
            >
              <FolderIcon class="w-3.5 h-3.5 text-white/70" />
              <span class="max-w-[200px] truncate">{activeScript()?.title || 'Select Speech'}</span>
              <ChevronDownIcon class="w-3 h-3 text-white/50" />
            </button>

            {/* Invisibility Pill */}
            <div class="hidden sm:flex items-center gap-1.5 text-[11px] text-white/70 bg-white/[0.03] border border-white/[0.07] px-2.5 py-0.5 rounded-full font-normal">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Hidden in OBS & Calls</span>
            </div>
          </div>

          {/* Right: Lock Indicator & Primary Hero CTA */}
          <div class="flex items-center gap-2">
            {/* Prominent Click-Through Locked Warning (if locked) */}
            <Show when={settings().click_through}>
              <button
                type="button"
                onClick={handleToggleClickThrough}
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition-all animate-pulse"
                title="Click-Through is locked (clicks pass through). Click to unlock or press Alt+L."
              >
                <LockIcon class="w-3.5 h-3.5" />
                <span>Locked (Unlock)</span>
              </button>
            </Show>

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen())}
              title="Settings & Global Shortcuts"
              class={`p-1.5 rounded-full border transition-all ${
                isSettingsOpen()
                  ? 'bg-white text-black border-white'
                  : 'text-white/70 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/10'
              }`}
            >
              <SettingsIcon class="w-4 h-4" />
            </button>

            {/* Hero Launch Prompter Button (White Pill with Black Text) */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleTogglePrompter}
              title="Toggle Prompter HUD Window (Alt+H)"
              class="!px-3.5 !py-1.5 !rounded-full shadow-sm"
            >
              <EyeIcon class="w-3.5 h-3.5 mr-1" />
              <span>Toggle Prompter HUD</span>
            </Button>
          </div>
        </header>

        {/* Workspace Body: Expansive Speech Writing Canvas */}
        <main class="flex-1 overflow-hidden relative flex flex-col p-6">
          <div class="w-full h-full max-w-4xl mx-auto flex flex-col">
            <ScriptEditor
              script={activeScript()}
              onSave={handleSaveScript}
            />
          </div>
        </main>

        {/* Floating Studio Control Dock (Bottom Anchor) */}
        <div class="absolute bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none px-4">
          <div class="pointer-events-auto bg-[#10121A]/85 backdrop-blur-2xl border border-white/[0.12] rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl">
            {/* Play/Pause & Rewind Cluster */}
            <div class="flex items-center gap-1 pr-2 border-r border-white/10">
              <button
                type="button"
                onClick={handleRewind}
                title="Rewind (Alt+R)"
                class="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RewindIcon class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handlePlayPause}
                title={isPlaying() ? 'Pause (Alt+Space)' : 'Play (Alt+Space)'}
                class="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors shadow-sm"
              >
                {isPlaying() ? <PauseIcon class="w-3.5 h-3.5" /> : <PlayIcon class="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Stepped Fine Speed Controls (<1x like 0.5x, 0.8x up to 15x) */}
            <div class="flex items-center gap-1 text-xs font-mono pr-2 border-r border-white/10">
              <span class="text-white/40 text-[11px] uppercase mr-1">Speed</span>
              <button
                type="button"
                onClick={() => handleSpeedStep('down')}
                title="Decrease Speed (Alt+Down)"
                class="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                -
              </button>
              <span class="min-w-[32px] text-center font-semibold text-white">
                {hudSpeed() < 10 ? hudSpeed().toFixed(1) : hudSpeed().toFixed(0)}x
              </span>
              <button
                type="button"
                onClick={() => handleSpeedStep('up')}
                title="Increase Speed (Alt+Up)"
                class="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                +
              </button>
            </div>

            {/* Font Size Quick Stepper */}
            <div class="flex items-center gap-1 text-xs font-mono pr-2 border-r border-white/10">
              <span class="text-white/40 text-[11px] uppercase mr-1">Size</span>
              <button
                type="button"
                onClick={() => handleSettingsChange({ ...settings(), font_size: Math.max(16, settings().font_size - 2) })}
                title="Decrease Font Size"
                class="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                -
              </button>
              <span class="min-w-[28px] text-center font-semibold text-white">
                {settings().font_size}px
              </span>
              <button
                type="button"
                onClick={() => handleSettingsChange({ ...settings(), font_size: Math.min(64, settings().font_size + 2) })}
                title="Increase Font Size"
                class="w-6 h-6 rounded-full bg-white/[0.06] hover:bg-white/[0.15] text-white flex items-center justify-center font-bold text-sm transition-colors"
              >
                +
              </button>
            </div>

            {/* Click-Through Lock Switch */}
            <button
              type="button"
              onClick={handleToggleClickThrough}
              title={settings().click_through ? 'Unlock click-through (Alt+L)' : 'Lock click-through (clicks pass through - Alt+L)'}
              class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                settings().click_through
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-white/[0.06] text-white/70 hover:text-white border border-white/10'
              }`}
            >
              {settings().click_through ? <LockIcon class="w-3 h-3" /> : <UnlockIcon class="w-3 h-3" />}
              <span>{settings().click_through ? 'Click-Through ON' : 'Click-Through'}</span>
            </button>
          </div>
        </div>

        {/* Speech Library Drawer (Slide-in Panel from Left) */}
        <Show when={isLibraryOpen()}>
          <div
            onClick={() => setIsLibraryOpen(false)}
            class="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity flex"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              class="w-80 h-full bg-[#11131A] border-r border-white/10 p-4 flex flex-col shadow-2xl"
            >
              <div class="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.08]">
                <span class="text-sm font-semibold text-white">Speech Library</span>
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(false)}
                  class="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                >
                  <CloseIcon class="w-4 h-4" />
                </button>
              </div>

              <div class="flex-1 overflow-hidden">
                <ScriptList
                  scripts={scripts()}
                  selectedId={activeScript()?.id || null}
                  onSelect={handleSelectScript}
                  onCreate={handleCreateScript}
                  onDelete={handleDeleteScript}
                />
              </div>
            </div>
          </div>
        </Show>

        {/* Settings Modal (Dialog) */}
        <Show when={isSettingsOpen()}>
          <div
            onClick={() => setIsSettingsOpen(false)}
            class="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-6"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              class="w-full max-w-lg max-h-[85vh] bg-[#11131A] border border-white/15 rounded-2xl p-6 flex flex-col shadow-2xl"
            >
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                <div class="flex items-center gap-2">
                  <SettingsIcon class="w-4 h-4 text-white/80" />
                  <span class="text-sm font-semibold text-white">Settings & Shortcuts</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  class="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                >
                  <CloseIcon class="w-4 h-4" />
                </button>
              </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar">
                <SettingsPanel
                  settings={settings()}
                  onChange={handleSettingsChange}
                />
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
