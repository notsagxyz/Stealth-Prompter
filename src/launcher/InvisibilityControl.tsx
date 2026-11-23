import type { JSX } from 'solid-js';
import { GlassCard } from '../components/GlassCard';
import { Switch } from '../components/Switch';

export interface InvisibilityControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function InvisibilityControl(props: InvisibilityControlProps): JSX.Element {
  return (
    <GlassCard class="p-3 bg-obsidian-surface/80 border-stealth-emerald/30 shadow-emerald">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div
            class={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              props.enabled
                ? 'bg-stealth-emerald shadow-emerald animate-pulse'
                : 'bg-slate-600'
            }`}
          />
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-100">
                Capture Invisibility Shield
              </span>
              <span
                class={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                  props.enabled
                    ? 'bg-stealth-emerald/20 text-stealth-emerald border border-stealth-emerald/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {props.enabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
            <span class="text-[11px] text-slate-400">
              {props.enabled
                ? 'Prompter HUD is 100% hidden from Zoom, Teams, OBS & Screen Capture (Win32 affinity 0x11)'
                : 'Prompter HUD will be visible in screen sharing'}
            </span>
          </div>
        </div>

        <Switch
          label=""
          checked={props.enabled}
          onChange={props.onToggle}
          variant="emerald"
          disabled={props.disabled}
        />
      </div>
    </GlassCard>
  );
}
