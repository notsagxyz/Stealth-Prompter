import type { JSX } from 'solid-js';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: 'cyber' | 'emerald' | 'default';
  disabled?: boolean;
  class?: string;
}

export function Switch(props: SwitchProps): JSX.Element {
  return (
    <label
      class={`flex items-center justify-between cursor-pointer select-none group ${
        props.disabled ? 'opacity-30 cursor-not-allowed' : ''
      } ${props.class || ''}`}
    >
      <div class="flex flex-col pr-3">
        <span class="text-xs font-medium text-slate-200 group-hover:text-white transition-colors">
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
        class={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none ${
          props.checked
            ? 'bg-white border-white'
            : 'bg-white/10 border-white/10 hover:bg-white/15'
        }`}
      >
        <span
          class={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-sm transition duration-200 ease-in-out mt-[2px] ${
            props.checked
              ? 'translate-x-4 bg-black'
              : 'translate-x-0.5 bg-white/70'
          }`}
        />
      </button>
    </label>
  );
}
