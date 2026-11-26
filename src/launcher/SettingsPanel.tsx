import { For, type JSX } from 'solid-js';
import type { Settings } from '../lib/types';
import { getCopy, type Locale } from '../lib/i18n';
import { LockIcon, UnlockIcon, HeartIcon, ExternalLinkIcon } from '../components/Icons';

export const ACCENT_PRESETS = [
  { id: 'violet', name: 'Violet', hex: '#7c6cff' },
  { id: 'indigo', name: 'Indigo', hex: '#6366f1' },
  { id: 'crimson', name: 'Crimson', hex: '#f43f5e' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b' },
  { id: 'cyan', name: 'Cyan', hex: '#06b6d4' },
];

export interface SettingsPanelProps {
  settings: Settings;
  speed: number;
  invisibilityActive: boolean;
  onChange: (updated: Settings) => void;
  onSpeedStep: (direction: 'up' | 'down') => void;
  onToggleClickThrough: () => void;
  onToggleInvisibility: (enabled: boolean) => void;
  onOpenSupportUrl: (url: string) => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const t = () => getCopy(props.settings.language);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    props.onChange({
      ...props.settings,
      [key]: value,
    });
  };

  const formattedSpeed = () =>
    props.speed < 10 ? `${props.speed.toFixed(1)}x` : `${props.speed.toFixed(0)}x`;

  const opacityPct = () => Math.round(props.settings.window_opacity * 100);

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 h-full overflow-y-auto custom-scrollbar pr-1 pb-2 select-none content-start">
      {/* Card 1: Prompter */}
      <section class="rounded-[14px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-3.5">
        <div class="flex items-center gap-2">
          <span class="section-accent-bar" />
          <span class="micro-label">{t().sectionPrompter}</span>
        </div>

        {/* Speed */}
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[var(--text)]">{t().speed}</span>
            <div class="flex items-center gap-1 bg-white/[0.04] border border-[var(--border)] rounded-full px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => props.onSpeedStep('down')}
                class="w-5 h-5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.08] text-xs flex items-center justify-center"
              >
                −
              </button>
              <span class="min-w-[38px] text-center font-mono text-xs text-[var(--text)] tabular-nums">
                {formattedSpeed()}
              </span>
              <button
                type="button"
                onClick={() => props.onSpeedStep('up')}
                class="w-5 h-5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.08] text-xs flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>
          <input
            type="range"
            min={0.2}
            max={15.0}
            step={0.1}
            value={props.speed}
            onInput={(e) => {
              const v = Math.max(0.2, Math.min(15.0, Math.round(parseFloat(e.currentTarget.value) * 10) / 10));
              update('scroll_speed', v);
            }}
            class="w-full studio-slider"
          />
        </div>

        {/* Background Opacity (10% - 100%) */}
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[var(--text)]">{t().opacity}</span>
            <span class="font-mono text-xs text-[var(--text)] tabular-nums">
              {opacityPct()}%
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={Math.round(props.settings.window_opacity * 100) / 100}
            aria-label={t().opacity}
            onInput={(e) => update('window_opacity', Math.max(0.1, Math.min(1.0, parseFloat(e.currentTarget.value))))}
            class="w-full studio-slider"
          />
        </div>

        {/* Font Size */}
        <div class="flex items-center justify-between">
          <span class="text-xs text-[var(--text)]">{t().fontSize}</span>
          <div class="flex items-center gap-1 bg-white/[0.04] border border-[var(--border)] rounded-full px-1.5 py-0.5">
            <button
              type="button"
              onClick={() => update('font_size', Math.max(14, props.settings.font_size - 2))}
              class="w-5 h-5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.08] text-xs flex items-center justify-center"
            >
              −
            </button>
            <span class="min-w-[38px] text-center font-mono text-xs text-[var(--text)] tabular-nums">
              {props.settings.font_size}px
            </span>
            <button
              type="button"
              onClick={() => update('font_size', Math.min(72, props.settings.font_size + 2))}
              class="w-5 h-5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/[0.08] text-xs flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Mirror & Capture Stealth */}
        <div class="flex items-center justify-between pt-1 border-t border-white/[0.05]">
          <span class="text-xs text-[var(--text)]">{t().mirrorMode}</span>
          <div class="grid grid-cols-2 bg-white/[0.04] border border-[var(--border)] rounded-full p-0.5 w-[104px]">
            <button
              type="button"
              onClick={() => update('mirror_mode', false)}
              class={`py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                !props.settings.mirror_mode ? 'bg-white/[0.14] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              Off
            </button>
            <button
              type="button"
              onClick={() => update('mirror_mode', true)}
              class={`py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                props.settings.mirror_mode ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              On
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class={`w-2 h-2 rounded-full ${props.invisibilityActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            <span class="text-xs text-[var(--text)]">{t().captureStealth}</span>
          </div>
          <div class="grid grid-cols-2 bg-white/[0.04] border border-[var(--border)] rounded-full p-0.5 w-[128px]">
            <button
              type="button"
              onClick={() => props.onToggleInvisibility(true)}
              class={`py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                props.invisibilityActive ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              {t().captureHidden}
            </button>
            <button
              type="button"
              onClick={() => props.onToggleInvisibility(false)}
              class={`py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                !props.invisibilityActive ? 'bg-white/[0.14] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              {t().captureVisible}
            </button>
          </div>
        </div>

        {/* Click-Through Toggle + Help Tooltip */}
        <div class="flex flex-col gap-1.5 pt-1 border-t border-white/[0.05]">
          <div class="flex items-center justify-between">
            <span class="text-xs text-[var(--text)]">{t().clickThrough}</span>
            <button
              type="button"
              onClick={props.onToggleClickThrough}
              class={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                props.settings.click_through
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/[0.05] text-[var(--text)] border-[var(--border)] hover:bg-white/[0.09]'
              }`}
            >
              {props.settings.click_through ? <LockIcon class="w-3 h-3" /> : <UnlockIcon class="w-3 h-3" />}
              <span>{props.settings.click_through ? 'Locked' : 'Unlocked'}</span>
            </button>
          </div>
          <p class="text-[11px] text-[var(--text-muted)] leading-relaxed">
            {t().clickThroughDesc}
          </p>
        </div>
      </section>

      {/* Card 2: Appearance (6 Accent Colors + Language EN/ES) */}
      <section class="rounded-[14px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <span class="section-accent-bar" />
          <span class="micro-label">{t().sectionAppearance}</span>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-xs text-[var(--text)]">{t().accentColor}</span>
          <div class="flex items-center gap-2.5 flex-wrap">
            <For each={ACCENT_PRESETS}>
              {(preset) => {
                const active = () => (props.settings.accent_color || '#7c6cff').toLowerCase() === preset.hex;
                return (
                  <button
                    type="button"
                    data-accent={preset.id}
                    title={preset.name}
                    aria-label={`Accent ${preset.name}`}
                    onClick={() => update('accent_color', preset.hex)}
                    class={`w-7 h-7 rounded-full transition-transform duration-150 flex items-center justify-center ${
                      active() ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#0b0b12]' : 'hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    style={{ background: preset.hex }}
                  />
                );
              }}
            </For>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <span class="text-xs text-[var(--text)]">{t().languageLabel}</span>
          <div class="grid grid-cols-2 bg-white/[0.04] border border-[var(--border)] rounded-full p-0.5 w-[132px]">
            <button
              type="button"
              onClick={() => update('language', 'en' as Locale)}
              class={`py-1 rounded-full text-[11px] font-medium transition-colors ${
                (props.settings.language || 'en') === 'en' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => update('language', 'es' as Locale)}
              class={`py-1 rounded-full text-[11px] font-medium transition-colors ${
                props.settings.language === 'es' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'
              }`}
            >
              Español
            </button>
          </div>
        </div>
      </section>

      {/* Card 3: Shortcuts */}
      <section class="rounded-[14px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="section-accent-bar" />
          <span class="micro-label">{t().sectionShortcuts}</span>
        </div>

        <div class="flex flex-col gap-2 text-xs">
          {[
            [t().shortcutPlay, 'Alt+Space'],
            [t().shortcutToggle, 'Alt+H'],
            [t().shortcutSpeed, 'Alt+↑ / ↓'],
            [t().shortcutScroll, 'Alt+PgUp / PgDn'],
            [t().shortcutOpacity, 'Alt+Shift+↑ / ↓'],
            [t().shortcutLock, 'Alt+L'],
            [t().shortcutRestart, 'Alt+R'],
          ].map(([label, keys]) => (
            <div class="flex items-center justify-between py-0.5">
              <span class="text-[var(--text-muted)]">{label}</span>
              <kbd class="font-mono text-[11px] text-[var(--text)] bg-white/[0.06] px-2 py-0.5 rounded-full border border-[var(--border)]">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* Card 4: About & Support */}
      <section class="rounded-[14px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col justify-between gap-3">
        <div class="flex flex-col gap-2.5">
          <div class="flex items-center gap-2">
            <span class="section-accent-bar" />
            <span class="micro-label">{t().sectionAbout}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-[var(--text)]">{t().productName}</span>
            <span class="font-mono text-[11px] text-[var(--text-muted)] px-2 py-0.5 rounded-full bg-white/[0.05] border border-[var(--border)]">
              v0.1.0
            </span>
          </div>
          <p class="text-xs text-[var(--text-muted)] leading-relaxed">
            {t().aboutDesc}
          </p>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => props.onOpenSupportUrl('https://ko-fi.com/stealthprompter')}
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[#ff4d8d]/40 text-xs font-medium text-[var(--text)] transition-colors"
          >
            <HeartIcon class="w-3.5 h-3.5 text-[#ff4d8d]" />
            <span>Ko-fi</span>
            <ExternalLinkIcon class="w-3 h-3 text-[var(--text-muted)]" />
          </button>
          <button
            type="button"
            onClick={() => props.onOpenSupportUrl('https://cafecito.app/stealthprompter')}
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-[#ff4d8d]/40 text-xs font-medium text-[var(--text)] transition-colors"
          >
            <HeartIcon class="w-3.5 h-3.5 text-[#ff4d8d]" />
            <span>Cafecito</span>
            <ExternalLinkIcon class="w-3 h-3 text-[var(--text-muted)]" />
          </button>
        </div>
      </section>
    </div>
  );
}
