import type { JSX } from 'solid-js';
import type { Settings } from '../lib/types';
import { Slider } from '../components/Slider';
import { Switch } from '../components/Switch';

export interface SettingsPanelProps {
  settings: Settings;
  onChange: (updated: Settings) => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    props.onChange({
      ...props.settings,
      [key]: value,
    });
  };

  return (
    <div class="flex flex-col h-full bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 select-none overflow-y-auto custom-scrollbar gap-5">
      {/* HUD Appearance & Kinematics */}
      <div class="flex flex-col gap-4">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Prompter Preferences
        </span>

        {/* Speed Slider */}
        <Slider
          label="Default Scroll Speed"
          min={0.2}
          max={10.0}
          step={0.1}
          value={props.settings.scroll_speed}
          unit="x"
          onChange={(v) => update('scroll_speed', Math.max(0.2, Math.min(15.0, Math.round(v * 10) / 10)))}
        />

        {/* Font Size Slider */}
        <Slider
          label="Prompter Font Size"
          min={18}
          max={60}
          step={2}
          value={props.settings.font_size}
          unit="px"
          onChange={(v) => update('font_size', v)}
        />

        {/* Opacity Slider */}
        <Slider
          label="Window Opacity"
          min={0.2}
          max={1.0}
          step={0.05}
          value={Math.round(props.settings.window_opacity * 100) / 100}
          unit=""
          onChange={(v) => update('window_opacity', v)}
        />
      </div>

      {/* Feature Switches */}
      <div class="flex flex-col gap-3 pt-3 border-t border-white/[0.06]">
        <Switch
          label="Mirror Mode"
          description="Flips text horizontally for physical beam-splitter teleprompter glass"
          checked={props.settings.mirror_mode}
          onChange={(v) => update('mirror_mode', v)}
        />

        <Switch
          label="Click-Through Mode"
          description="Allows all mouse clicks to pass through the teleprompter directly to background windows"
          checked={props.settings.click_through}
          onChange={(v) => update('click_through', v)}
        />
      </div>

      {/* Hotkey Shortcuts Reference */}
      <div class="flex flex-col gap-2 pt-3 border-t border-white/[0.06]">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Global Shortcuts
        </span>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Play / Pause</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white border border-white/10">Alt+Space</kbd>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Show / Hide</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white border border-white/10">Alt+H</kbd>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Speed Up</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white border border-white/10">Alt+Up</kbd>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Speed Down</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white border border-white/10">Alt+Down</kbd>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Rewind</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-white border border-white/10">Alt+R</kbd>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <span class="text-slate-400">Lock / Unlock</span>
            <kbd class="font-mono text-[11px] bg-white/[0.08] px-1.5 py-0.5 rounded text-amber-300 border border-white/10">Alt+L</kbd>
          </div>
        </div>
      </div>

      {/* Privacy & Clean Architecture Notice */}
      <div class="pt-3 border-t border-white/[0.06] text-[11px] text-slate-500 leading-relaxed">
        100% Offline & Local-First. Zero analytics, zero telemetries, zero cloud dependencies. Your speeches and notes stay strictly on this device.
      </div>
    </div>
  );
}
