import type { JSX } from 'solid-js';

export interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  class?: string;
}

export function Slider(props: SliderProps): JSX.Element {
  return (
    <div class={`flex flex-col gap-1.5 ${props.class || ''}`}>
      <div class="flex justify-between items-center text-xs">
        <span class="text-slate-300 font-medium">{props.label}</span>
        <span class="text-cyber-cyan font-mono font-semibold">
          {props.value}
          {props.unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step || 1}
        value={props.value}
        onInput={(e) => props.onChange(parseFloat(e.currentTarget.value))}
        class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyber-cyan focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
      />
    </div>
  );
}
