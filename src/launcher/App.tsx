import { createSignal, onMount, onCleanup, Show, type JSX } from 'solid-js';
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
} from '../lib/ipc';
import {
  emitPrompterAction,
  emitUpdateScript,
  onStateSync,
} from '../lib/eventBus';
import { ScriptEditor } from './ScriptEditor';
import { ScriptList } from './ScriptList';
import { SettingsPanel } from './SettingsPanel';
import { InvisibilityControl } from './InvisibilityControl';
import { Button } from '../components/Button';
import { PlayIcon, PauseIcon, RewindIcon, EyeIcon } from '../components/Icons';

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
  const [activeTab, setActiveTab] = createSignal<'editor' | 'settings'>('editor');

  let unlistenSync: (() => void) | null = null;

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
  });

  onCleanup(() => {
    if (unlistenSync) unlistenSync();
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
      title: 'New Script',
      content: 'Enter your teleprompter speech content here...',
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
    await saveSettings(updated);
    await emitPrompterAction({ type: 'speed_change', value: updated.scroll_speed });
  };

  const handleToggleInvisibility = async (enabled: boolean) => {
    setInvisibilityActive(enabled);
    await setCaptureExclusion('prompter', enabled);
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

  const handleSpeedChange = async (newSpeed: number) => {
    const clamped = Math.max(1, Math.min(10, newSpeed));
    setHudSpeed(clamped);
    const updatedSettings = { ...settings(), scroll_speed: clamped };
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
    await emitPrompterAction({ type: 'speed_change', value: clamped });
  };

  return (
    <div class="flex flex-col h-screen w-screen bg-obsidian text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <header
        data-tauri-drag-region
        class="h-14 border-b border-obsidian-border bg-obsidian-surface/80 backdrop-blur-glass flex items-center justify-between px-4 z-20 shrink-0"
      >
        <div data-tauri-drag-region class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-cyber-cyan/15 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan font-bold shadow-cyber text-sm">
            SP
          </div>
          <div data-tauri-drag-region class="flex flex-col">
            <span class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              StealthPrompter
              <span class="text-[10px] font-mono px-1 py-0.2 bg-cyber-cyan/10 text-cyber-cyan rounded border border-cyber-cyan/30">
                v0.1.0
              </span>
            </span>
            <span class="text-[11px] text-slate-400">Invisible Teleprompter Overlay</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div class="flex items-center gap-3">
          {/* Quick HUD Playback Controls */}
          <div class="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-obsidian-border">
            <button
              type="button"
              onClick={handleRewind}
              title="Rewind (Alt+R)"
              class="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RewindIcon class="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePlayPause}
              title={isPlaying() ? 'Pause (Alt+Space)' : 'Play (Alt+Space)'}
              class="p-1.5 rounded text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors"
            >
              {isPlaying() ? <PauseIcon class="w-4 h-4" /> : <PlayIcon class="w-4 h-4" />}
            </button>
            <div class="flex items-center gap-1 px-1.5 text-xs font-mono text-slate-300">
              <button
                type="button"
                onClick={() => handleSpeedChange(hudSpeed() - 1)}
                class="hover:text-white px-0.5"
                title="Slow Down (Alt+Down)"
              >
                -
              </button>
              <span class="text-cyber-cyan min-w-[20px] text-center">{hudSpeed()}x</span>
              <button
                type="button"
                onClick={() => handleSpeedChange(hudSpeed() + 1)}
                class="hover:text-white px-0.5"
                title="Speed Up (Alt+Up)"
              >
                +
              </button>
            </div>
          </div>

          <Button
            variant="emerald"
            size="md"
            onClick={handleTogglePrompter}
            title="Toggle Prompter HUD Window (Alt+H)"
          >
            <EyeIcon class="w-4 h-4" />
            <span>Toggle Prompter HUD</span>
          </Button>
        </div>
      </header>

      {/* Invisibility Banner */}
      <div class="p-3 bg-obsidian-surface/40 border-b border-obsidian-border shrink-0">
        <InvisibilityControl
          enabled={invisibilityActive()}
          onToggle={handleToggleInvisibility}
        />
      </div>

      {/* Main Workspace Layout */}
      <div class="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Left Sidebar */}
        <aside class="w-64 flex flex-col gap-3 shrink-0">
          <div class="flex items-center gap-1 bg-slate-900/40 p-1 rounded-lg border border-obsidian-border">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              class={`flex-1 py-1.5 text-xs font-medium rounded transition-all text-center ${
                activeTab() === 'editor'
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40 shadow-cyber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scripts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              class={`flex-1 py-1.5 text-xs font-medium rounded transition-all text-center ${
                activeTab() === 'settings'
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40 shadow-cyber'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          </div>

          <div class="flex-1 min-h-0">
            <Show when={activeTab() === 'editor'}>
              <ScriptList
                scripts={scripts()}
                selectedId={activeScript()?.id || null}
                onSelect={handleSelectScript}
                onCreate={handleCreateScript}
                onDelete={handleDeleteScript}
              />
            </Show>
            <Show when={activeTab() === 'settings'}>
              <SettingsPanel
                settings={settings()}
                onChange={handleSettingsChange}
              />
            </Show>
          </div>
        </aside>

        {/* Right Main Editor Area */}
        <main class="flex-1 min-w-0 h-full">
          <ScriptEditor
            script={activeScript()}
            onSave={handleSaveScript}
          />
        </main>
      </div>
    </div>
  );
}
