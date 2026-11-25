import type { JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  PlayIcon,
  PauseIcon,
  RewindIcon,
  CloseIcon,
  LockIcon,
  UnlockIcon,
  GripIcon,
} from '../components/Icons';

export interface HudOverlayControlsProps {
  isPlaying: boolean;
  speed: number;
  clickThrough: boolean;
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
  onToggleClickThrough?: () => void;
  onClose?: () => void;
}

export function HudOverlayControls(props: HudOverlayControlsProps): JSX.Element {
  const handleStartDrag = (e: MouseEvent) => {
    // Only drag with left mouse button
    if (e.button === 0) {
      try {
        getCurrentWindow().startDragging();
      } catch (err) {
        console.warn('startDragging error:', err);
      }
    }
  };

  return (
    <header
      data-tauri-drag-region
      onMouseDown={handleStartDrag}
      class={`fixed top-0 left-0 right-0 h-10 z-40 flex items-center justify-between px-3 select-none transition-opacity duration-300 ${
        props.clickThrough
          ? 'pointer-events-none opacity-0'
          : 'pointer-events-auto bg-black/40 backdrop-blur-md border-b border-white/[0.08] hover:opacity-100 opacity-60'
      }`}
    >
      {/* Left: Drag Handle Indicator */}
      <div
        data-tauri-drag-region
        class="flex items-center gap-2 cursor-grab active:cursor-grabbing text-white/50 hover:text-white/80 transition-colors py-1 pr-2"
        title="Drag to reposition teleprompter"
      >
        <GripIcon class="w-3.5 h-3.5 opacity-60" />
        <span class="text-xs font-medium tracking-tight text-white/80">Stealth</span>
      </div>

      {/* Center: Playback & Speed Controls */}
      <div class="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={props.onRewind}
          title="Rewind to start (Alt+R)"
          class="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        >
          <RewindIcon class="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={props.onTogglePlay}
          title={props.isPlaying ? 'Pause (Alt+Space)' : 'Play (Alt+Space)'}
          class="p-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all shadow-sm"
        >
          {props.isPlaying ? <PauseIcon class="w-3.5 h-3.5" /> : <PlayIcon class="w-3.5 h-3.5" />}
        </button>

        <div class="flex items-center gap-1 text-xs font-mono font-medium text-white/90 bg-white/[0.06] px-1.5 py-0.5 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={props.onSpeedDown}
            title="Speed Down (Alt+Down)"
            class="text-white/60 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 active:scale-95 transition-colors"
          >
            -
          </button>
          <span class="min-w-[28px] text-center font-semibold">{props.speed < 10 ? props.speed.toFixed(1) : props.speed.toFixed(0)}x</span>
          <button
            type="button"
            onClick={props.onSpeedUp}
            title="Speed Up (Alt+Up)"
            class="text-white/60 hover:text-white px-1 py-0.5 rounded hover:bg-white/10 active:scale-95 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Right: Mode & Close Actions */}
      <div class="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
        {props.onToggleClickThrough && (
          <button
            type="button"
            onClick={props.onToggleClickThrough}
            title={props.clickThrough ? 'Click-through locked: Press Alt+L or unlock in Launcher' : 'Lock Click-Through: mouse clicks pass through (Alt+L)'}
            class={`p-1.5 rounded-lg transition-colors ${
              props.clickThrough
                ? 'text-amber-400 bg-amber-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {props.clickThrough ? <LockIcon class="w-3.5 h-3.5" /> : <UnlockIcon class="w-3.5 h-3.5" />}
          </button>
        )}

        {props.onClose && (
          <button
            type="button"
            onClick={props.onClose}
            title="Hide Prompter HUD (Alt+H)"
            class="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 active:scale-95 transition-colors ml-1"
          >
            <CloseIcon class="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
}
