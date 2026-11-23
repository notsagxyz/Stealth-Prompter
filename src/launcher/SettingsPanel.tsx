import type { JSX } from 'solid-js';
import type { Settings } from '../lib/types';
import { GlassCard } from '../components/GlassCard';
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
    <GlassCard title="HUD & Kinematics" subtitle="Display and hotkey preferences" class="p-4 flex flex-col gap-4">
      {/* Speed Slider */}
      <Slider
        label="Scroll Speed"
        min={1}
        max={10}
        step={1}
        value={props.settings.scroll_speed}
        unit="x"
        onChange={(v) => update('scroll_speed', Math.max(1, Math.min(10, v)))}
      />

      {/* Font Size Slider */}
      <Slider
        label="HUD Font Size"
        min={16}
        max={64}
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

      {/* Toggles */}
      <div class="flex flex-col gap-3 pt-2 border-t border-obsidian-border">
        <Switch
          label="Mirror Mode"
          description="Horizontal flip for beam-splitter teleprompter glass"
          checked={props.settings.mirror_mode}
          onChange={(v) => update('mirror_mode', v)}
          variant="cyber"
        />

        <Switch
          label="Click-Through"
          description="Make HUD transparent to all mouse clicks"
          checked={props.settings.click_through}
          onChange={(v) => update('click_through', v)}
          variant="emerald"
        />
      </div>

      {/* Hotkey Shortcuts Info */}
      <div class="pt-3 border-t border-obsidian-border flex flex-col gap-1.5 text-[11px] text-slate-400">
        <span class="font-semibold text-slate-300">Global Shortcuts (Non-focus stealing)</span>
        <div class="grid grid-cols-2 gap-1 font-mono text-[10px]">
          <div><kbd class="bg-black/50 px-1 py-0.5 rounded text-cyber-cyan border border-obsidian-border">Alt+Space</kbd> Play/Pause</div>
          <div><kbd class="bg-black/50 px-1 py-0.5 rounded text-cyber-cyan border border-obsidian-border">Alt+H</kbd> Toggle HUD</div>
          <div><kbd class="bg-black/50 px-1 py-0.5 rounded text-cyber-cyan border border-obsidian-border">Alt+Up/Dn</kbd> Speed +/-</div>
          <div><kbd class="bg-black/50 px-1 py-0.5 rounded text-cyber-cyan border border-obsidian-border">Alt+R</kbd> Rewind</div>
        </div>
      </div>
    </GlassCard>
  );
}
