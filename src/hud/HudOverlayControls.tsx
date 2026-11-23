import type { JSX } from 'solid-js';
import { PlayIcon, PauseIcon, RewindIcon } from '../components/Icons';

export interface HudOverlayControlsProps {
  isPlaying: boolean;
  speed: number;
  clickThrough: boolean;
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
}

export function HudOverlayControls(props: HudOverlayControlsProps): JSX.Element {
  return (
    <header
      data-tauri-drag-region
      class={`fixed top-0 left-0 right-0 h-[30px] z-40 flex items-center justify-between px-3 select-none transition-opacity duration-200 ${
        props.clickThrough
          ? 'pointer-events-none opacity-0'
          : 'pointer-events-auto bg-obsidian-surface/60 backdrop-blur-sm border-b border-obsidian-border hover:opacity-100 opacity-40'
      }`}
    >
      <div data-tauri-drag-region class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-stealth-emerald animate-pulse" />
        <span class="text-[10px] uppercase font-mono tracking-wider text-slate-300 font-semibold">
          Stealth HUD
        </span>
      </div>

      <div class="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={props.onRewind}
          title="Rewind (Alt+R)"
          class="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RewindIcon class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={props.onTogglePlay}
          title="Play/Pause (Alt+Space)"
          class="p-1 rounded text-cyber-cyan hover:bg-cyber-cyan/20 transition-colors"
        >
          {props.isPlaying ? <PauseIcon class="w-3.5 h-3.5" /> : <PlayIcon class="w-3.5 h-3.5" />}
        </button>

        <div class="flex items-center gap-1 text-[11px] font-mono font-medium text-slate-300 bg-black/40 px-1.5 py-0.5 rounded border border-obsidian-border">
          <button
            type="button"
            onClick={props.onSpeedDown}
            title="Speed Down (Alt+Down)"
            class="text-slate-400 hover:text-white px-0.5"
          >
            -
          </button>
          <span class="text-cyber-cyan min-w-[20px] text-center">{props.speed}x</span>
          <button
            type="button"
            onClick={props.onSpeedUp}
            title="Speed Up (Alt+Up)"
            class="text-slate-400 hover:text-white px-0.5"
          >
            +
          </button>
        </div>
      </div>
    </header>
  );
}
