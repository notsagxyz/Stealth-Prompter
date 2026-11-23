import type { JSX } from 'solid-js';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'cyber' | 'emerald';
  disabled?: boolean;
  class?: string;
}

export function Switch(props: SwitchProps): JSX.Element {
  const variant = props.variant || 'emerald';

  const activeColor =
    variant === 'emerald'
      ? 'bg-stealth-emerald border-stealth-emerald shadow-emerald'
      : 'bg-cyber-cyan border-cyber-cyan shadow-cyber';

  return (
    <label
      class={`flex items-center justify-between cursor-pointer select-none group ${
        props.disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${props.class || ''}`}
    >
      <div class="flex flex-col pr-3">
        <span class="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
          {props.label}
        </span>
        {props.description && (
          <span class="text-[11px] text-slate-400 mt-0.5">{props.description}</span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        disabled={props.disabled}
        onClick={() => !props.disabled && props.onChange(!props.checked)}
        class={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-obsidian-border transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-cyber-cyan ${
          props.checked ? activeColor : 'bg-slate-800'
        }`}
      >
        <span
          class={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[2px] ${
            props.checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
