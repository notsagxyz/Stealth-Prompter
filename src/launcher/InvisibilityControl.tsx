import type { JSX } from 'solid-js';
import { ShieldCheckIcon, EyeOffIcon } from '../components/Icons';
import { Switch } from '../components/Switch';

export interface InvisibilityControlProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function InvisibilityControl(props: InvisibilityControlProps): JSX.Element {
  return (
    <div class="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs">
      <div class="flex items-center gap-2.5">
        <div class="p-1 rounded-md bg-white/[0.06] text-white/80">
          {props.enabled ? <ShieldCheckIcon class="w-4 h-4" /> : <EyeOffIcon class="w-4 h-4" />}
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-2">
            <span class="font-medium text-slate-200">
              Screen Capture Exclusion
            </span>
            <span
              class={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                props.enabled
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-slate-400 border border-white/10'
              }`}
            >
              {props.enabled ? 'Protected' : 'Visible'}
            </span>
          </div>
          <span class="text-[11px] text-slate-400">
            {props.enabled
              ? 'Prompter is hidden from Zoom, Teams, Meet, OBS & screen recording'
              : 'Prompter will be visible on shared screens'}
          </span>
        </div>
      </div>

      <Switch
        label=""
        checked={props.enabled}
        onChange={props.onToggle}
        disabled={props.disabled}
      />
    </div>
  );
}
