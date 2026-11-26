import { createSignal, onMount, onCleanup, Show, type JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { Script, ScriptSummary, Settings } from '../lib/types';
import { getCopy } from '../lib/i18n';
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
  openExternalUrl,
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
  StealthLogo,
  MinimizeIcon,
  MaximizeIcon,
  CloseIcon,
  LockIcon,
  PlayIcon,
  SettingsIcon,
  HeartIcon,
  ExternalLinkIcon,
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
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`);
    }
  }
}

export default function LauncherApp(): JSX.Element {
  const [settings, setSettings] = createSignal<Settings>({
    scroll_speed: 3.0,
    font_size: 28,
    line_height: 1.5,
    window_opacity: 0.85,
    mirror_mode: false,
    click_through: false,
    theme: 'dark-glass',
    accent_color: '#7c6cff',
    language: 'en',
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
  const [hudSpeed, setHudSpeed] = createSignal<number>(3.0);
  const [view, setView] = createSignal<'workspace' | 'settings'>('workspace');
  const [supportMenuOpen, setSupportMenuOpen] = createSignal<boolean>(false);

  const t = () => getCopy(settings().language);

  let unlistenSync: (() => void) | null = null;
  let unlistenSettings: (() => void) | null = null;
  let unlistenVisibility: (() => void) | null = null;

  onMount(async () => {
    try {
      const s = await loadSettings();
      setSettings(s);
      applyAccentToken(s.accent_color);
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
      setHudSpeed(state.speed);
    });

    unlistenSettings = await onSettingsSync((synced) => {
      setSettings(synced);
      applyAccentToken(synced.accent_color);
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
      title: 'Untitled Speech',
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
    setView('workspace');
  };

  const handleDeleteScript = async (id: string) => {
    await deleteScript(id);
    const updated = await listScripts();
    setScripts(updated);
    if (activeScript()?.id === id) {
      if (updated.length > 0) {
        const next = await loadScript(updated[0].id);
        setActiveScript(next);
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
    applyAccentToken(updated.accent_color);
    setHudSpeed(updated.scroll_speed);
    await saveSettings(updated);
  };

  const handleTogglePrompter = async () => {
    await togglePrompterWindow();
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

  const handleOpenSupportUrl = async (url: string) => {
    setSupportMenuOpen(false);
    try {
      await openExternalUrl(url);
    } catch (err) {
      console.warn('openExternalUrl error:', err);
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
    <div
      class="w-screen h-screen overflow-hidden select-none relative font-sans bg-transparent box-border"
      onClick={() => {
        if (supportMenuOpen()) setSupportMenuOpen(false);
      }}
    >
      {/* Full-bleed Rounded Window (no outer padding gap, zero Windows DWM border) */}
      <div class="w-full h-full rounded-[22px] bg-[#0b0b12] border border-[var(--border)] overflow-hidden flex flex-col relative">
        {/* Subtle Corner Ambient Glow */}
        <div
          class="pointer-events-none absolute -top-28 -right-28 w-[380px] h-[380px] rounded-full blur-3xl opacity-40 transition-colors duration-300"
          style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 72%)' }}
        />

        {/* Custom Frameless Draggable Titlebar */}
        <header
          data-tauri-drag-region
          class="h-12 px-4 flex items-center justify-between border-b border-[var(--border)] bg-white/[0.015] z-30 shrink-0 select-none"
        >
          {/* Left: Brand & View Pills */}
          <div data-tauri-drag-region class="flex items-center gap-3">
            <div data-tauri-drag-region class="flex items-center gap-2">
              <StealthLogo class="w-5 h-5 text-[var(--text)]" />
              <span class="text-xs font-semibold text-[var(--text)] tracking-tight">
                {t().appName}
              </span>
            </div>

            <div class="h-3.5 w-[1px] bg-white/[0.08]" />

            <nav class="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setView('workspace')}
                class={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                  view() === 'workspace'
                    ? 'bg-white/[0.08] text-[var(--text)] border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t().navScripts}
              </button>
              <button
                type="button"
                onClick={() => setView(view() === 'settings' ? 'workspace' : 'settings')}
                class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150 ${
                  view() === 'settings'
                    ? 'bg-white/[0.08] text-[var(--text)] border border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <SettingsIcon class="w-3.5 h-3.5" />
                <span>{t().navSettings}</span>
              </button>
            </nav>
          </div>

          {/* Right: Support (Pink Heart Pill), Lock Pill, Start Prompter, Window Controls */}
          <div class="flex items-center gap-2 relative">
            <Show when={settings().click_through}>
              <button
                type="button"
                onClick={handleToggleClickThrough}
                title="Click-Through locked. Click to unlock or press Alt+L."
                class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[11px] font-medium transition-colors"
              >
                <LockIcon class="w-3 h-3" />
                <span>{t().hudLockedBanner}</span>
              </button>
            </Show>

            {/* Support Pill Button (Only the heart is pink) */}
            <div class="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                data-testid="support-button"
                onClick={() => setSupportMenuOpen(!supportMenuOpen())}
                title={t().supportTitle}
                class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[#ff4d8d]/45 text-xs font-medium text-[var(--text)] transition-colors duration-150"
              >
                <HeartIcon class="w-3.5 h-3.5 text-[#ff4d8d]" />
                <span>{t().support}</span>
              </button>

              <Show when={supportMenuOpen()}>
                <div class="absolute right-0 mt-2 w-56 rounded-[14px] bg-[#12121c]/95 backdrop-blur-xl border border-[var(--border)] shadow-2xl p-2 z-50 flex flex-col gap-1">
                  <div class="px-2.5 py-1.5 border-b border-white/[0.06]">
                    <p class="text-xs font-semibold text-[var(--text)]">{t().supportTitle}</p>
                    <p class="text-[11px] text-[var(--text-muted)]">{t().supportSubtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenSupportUrl('https://cafecito.app/stealthprompter')}
                    class="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-[var(--text)] hover:bg-white/[0.07] transition-colors"
                  >
                    <span class="flex items-center gap-2">
                      <HeartIcon class="w-3.5 h-3.5 text-[#ff4d8d]" />
                      <span>{t().supportCafecito}</span>
                    </span>
                    <ExternalLinkIcon class="w-3 h-3 text-[var(--text-muted)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenSupportUrl('https://ko-fi.com/stealthprompter')}
                    class="flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-[var(--text)] hover:bg-white/[0.07] transition-colors"
                  >
                    <span class="flex items-center gap-2">
                      <HeartIcon class="w-3.5 h-3.5 text-[#ff4d8d]" />
                      <span>{t().supportKofi}</span>
                    </span>
                    <ExternalLinkIcon class="w-3 h-3 text-[var(--text-muted)]" />
                  </button>
                </div>
              </Show>
            </div>

            {/* Start / Prompter Toggle Pill */}
            <button
              type="button"
              onClick={handleTogglePrompter}
              title="Open / Close Prompter (Alt+H)"
              class={`h-7 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                hudVisible()
                  ? 'bg-[var(--accent)] text-white shadow-[0_0_14px_var(--accent-glow)]'
                  : 'bg-[var(--text)] text-[#0b0b12] hover:opacity-90'
              }`}
            >
              <PlayIcon class="w-3 h-3" />
              <span>{hudVisible() ? t().prompterRunning : t().startPrompter}</span>
            </button>

            <div class="h-3.5 w-[1px] bg-white/[0.08]" />

            {/* Frameless Window Controls */}
            <div class="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleWindowMinimize}
                title="Minimize"
                aria-label="Minimize"
                class="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.07] transition-colors"
              >
                <MinimizeIcon class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleWindowMaximize}
                title="Maximize"
                aria-label="Maximize"
                class="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.07] transition-colors"
              >
                <MaximizeIcon class="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleWindowClose}
                title="Close"
                aria-label="Close"
                class="w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
              >
                <CloseIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Body: Calm Desktop Split Workspace or Settings */}
        <main class="flex-1 min-h-0 p-4 flex flex-col relative z-10 overflow-hidden">
          <Show when={view() === 'workspace'}>
            <div class="flex-1 min-h-0 flex gap-4">
              {/* Left Column: Compact Script Library */}
              <div class="w-[248px] shrink-0 h-full">
                <ScriptList
                  scripts={scripts()}
                  selectedId={activeScript()?.id || null}
                  language={settings().language}
                  onSelect={handleSelectScript}
                  onCreate={handleCreateScript}
                  onDelete={handleDeleteScript}
                />
              </div>

              {/* Right Column: Clean Distraction-Free Script Editor */}
              <div class="flex-1 min-w-0 h-full flex flex-col gap-2.5">
                <div class="flex items-center justify-between px-1 shrink-0">
                  <h1 class="text-sm font-semibold text-[var(--text)] tracking-tight">
                    {t().heroPrefix}{' '}
                    <em class="italic font-semibold text-[var(--accent)]">{t().heroAccent}</em>
                    {t().heroSuffix}
                  </h1>
                  <span class="text-[11px] text-[var(--text-muted)] hidden md:inline">
                    {t().heroSubtitle}
                  </span>
                </div>
                <div class="flex-1 min-h-0">
                  <ScriptEditor
                    script={activeScript()}
                    language={settings().language}
                    onSave={handleSaveScript}
                  />
                </div>
              </div>
            </div>
          </Show>

          <Show when={view() === 'settings'}>
            <div class="h-full max-w-4xl w-full mx-auto flex flex-col gap-3">
              <div class="flex items-center justify-between shrink-0">
                <h2 class="text-base font-semibold text-[var(--text)] tracking-tight">
                  {t().settingsTitle}
                </h2>
              </div>
              <div class="flex-1 min-h-0">
                <SettingsPanel
                  settings={settings()}
                  speed={hudSpeed()}
                  invisibilityActive={invisibilityActive()}
                  onChange={handleSettingsChange}
                  onSpeedStep={handleSpeedStep}
                  onToggleClickThrough={handleToggleClickThrough}
                  onToggleInvisibility={handleToggleInvisibility}
                  onOpenSupportUrl={handleOpenSupportUrl}
                />
              </div>
            </div>
          </Show>
        </main>

        {/* Native Frameless Edge & Corner Resize Handles */}
        <div onMouseDown={handleResize('North')} class="absolute top-0 left-3 right-3 h-1.5 cursor-n-resize z-50" />
        <div onMouseDown={handleResize('South')} class="absolute bottom-0 left-3 right-3 h-1.5 cursor-s-resize z-50" />
        <div onMouseDown={handleResize('West')} class="absolute top-3 bottom-3 left-0 w-1.5 cursor-w-resize z-50" />
        <div onMouseDown={handleResize('East')} class="absolute top-3 bottom-3 right-0 w-1.5 cursor-e-resize z-50" />
        <div onMouseDown={handleResize('NorthWest')} class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-50" />
        <div onMouseDown={handleResize('NorthEast')} class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-50" />
        <div onMouseDown={handleResize('SouthWest')} class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-50" />
        <div onMouseDown={handleResize('SouthEast')} class="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-50" />
      </div>
    </div>
  );
}
