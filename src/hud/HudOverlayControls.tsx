import { Show, type JSX } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import {
  PlayIcon,
  PauseIcon,
  RewindIcon,
  CloseIcon,
  LockIcon,
  UnlockIcon,
  GripIcon,
  MirrorIcon,
  EyeOffIcon,
} from '../components/Icons';

export interface HudOverlayControlsProps {
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  opacity: number;
  mirrorMode: boolean;
  clickThrough: boolean;
  barCollapsed: boolean;
  onToggleCollapse: () => void;
  onTogglePlay: () => void;
  onRewind: () => void;
  onSpeedUp: () => void;
  onSpeedDown: () => void;
  onFontUp: () => void;
  onFontDown: () => void;
  onOpacityChange: (value: number) => void;
  onToggleMirror: () => void;
  onToggleClickThrough: () => void;
  onClose: () => void;
}

export function HudOverlayControls(props: HudOverlayControlsProps): JSX.Element {
  const handleStartDrag = (e: MouseEvent) => {
    if (e.button === 0) {
      try {
        getCurrentWindow().startDragging();
      } catch (err) {
        console.warn('startDragging error:', err);
      }
    }
  };

  const formattedSpeed = () =>
    props.speed < 10 ? `${props.speed.toFixed(1)}x` : `${props.speed.toFixed(0)}x`;

  const opacityPercent = () => Math.round(props.opacity * 100);

  return (
    <Show
      when={!props.barCollapsed}
      fallback={
        /* Persistent minimal Play / Restore button when toolbar is hidden */
        <div
          class={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full px-2 py-1.5 bg-[#0b0b12]/75 backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-200 ${
            props.clickThrough
              ? 'pointer-events-none opacity-25'
              : 'pointer-events-auto opacity-55 hover:opacity-100'
          }`}
        >
          <button
            type="button"
            data-testid="hud-mini-play"
            onClick={props.onTogglePlay}
            title={props.isPlaying ? 'Pause (Alt+Space)' : 'Play (Alt+Space)'}
            aria-label={props.isPlaying ? 'Pause' : 'Play'}
            class="w-9 h-9 rounded-full bg-[var(--accent,#7c6cff)] text-white flex items-center justify-center shadow-md hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            {props.isPlaying ? <PauseIcon class="w-4 h-4" /> : <PlayIcon class="w-4 h-4 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={props.onToggleCollapse}
            title="Show Controls Bar"
            aria-label="Show Controls Bar"
            class="px-2.5 h-7 rounded-full text-[11px] font-mono uppercase tracking-wider text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            Controls
          </button>
        </div>
      }
    >
      <header
        data-testid="hud-control-bar"
        role="toolbar"
        aria-label="Stealth Prompter Controls"
        data-tauri-drag-region
        onMouseDown={handleStartDrag}
        class={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] flex items-center gap-2 max-[420px]:gap-1 px-3 max-[420px]:px-2 py-1.5 rounded-full select-none transition-all duration-200 border border-white/[0.1] bg-[#0b0b12]/75 backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] ${
          props.clickThrough
            ? 'pointer-events-none opacity-30'
            : 'pointer-events-auto opacity-55 hover:opacity-100 focus-within:opacity-100'
        }`}
      >
        {/* Drag Handle & Live Playback Status */}
        <div
          data-tauri-drag-region
          class="max-[420px]:hidden flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-white/55 hover:text-white/90 pr-1.5 border-r border-white/10"
          title="Drag to move prompter window"
        >
          <GripIcon class="w-3.5 h-3.5" />
          <span
            class={`w-2 h-2 rounded-full transition-colors ${
              props.isPlaying
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-white/30'
            }`}
          />
          <span class="hidden sm:inline font-mono text-[10px] uppercase tracking-[0.14em] text-white/75">
            {props.isPlaying ? 'Playing' : 'Paused'}
          </span>
        </div>

        {/* Primary Play/Pause + Restart */}
        <div class="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={props.onTogglePlay}
            title={props.isPlaying ? 'Pause scrolling (Alt+Space)' : 'Play scrolling (Alt+Space)'}
            aria-label={props.isPlaying ? 'Pause' : 'Play'}
            class="w-9 h-9 rounded-full bg-[var(--accent,#7c6cff)] text-white hover:brightness-110 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_16px_var(--accent-glow,rgba(124,108,255,0.4))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {props.isPlaying ? <PauseIcon class="w-4 h-4" /> : <PlayIcon class="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={props.onRewind}
            title="Restart to top (Alt+R)"
            aria-label="Restart"
            class="w-7 h-7 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            <RewindIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed - / + */}
        <div
          class="flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-1.5 py-0.5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={props.onSpeedDown}
            title="Decrease Speed (Alt+Down)"
            aria-label="Speed Down"
            class="w-5 h-5 rounded-full text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            -
          </button>
          <span class="min-w-[34px] text-center font-mono text-[11px] text-white/90 tabular-nums">
            {formattedSpeed()}
          </span>
          <button
            type="button"
            onClick={props.onSpeedUp}
            title="Increase Speed (Alt+Up)"
            aria-label="Speed Up"
            class="w-5 h-5 rounded-full text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            +
          </button>
        </div>

        {/* Font Size - / + */}
        <div
          class="hidden md:flex items-center gap-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-1.5 py-0.5"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={props.onFontDown}
            title="Decrease Font Size"
            aria-label="Font Size Down"
            class="w-5 h-5 rounded-full text-white/70 hover:text-white hover:bg-white/10 text-[11px] font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            A-
          </button>
          <span class="min-w-[32px] text-center font-mono text-[11px] text-white/90 tabular-nums">
            {props.fontSize}px
          </span>
          <button
            type="button"
            onClick={props.onFontUp}
            title="Increase Font Size"
            aria-label="Font Size Up"
            class="w-5 h-5 rounded-full text-white/70 hover:text-white hover:bg-white/10 text-[11px] font-medium flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            A+
          </button>
        </div>

        {/* Background Opacity Slider (10% - 100%) */}
        <div
          class="max-[420px]:hidden flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-1"
          onMouseDown={(e) => e.stopPropagation()}
          title="Background Opacity (Alt+Shift+Up / Alt+Shift+Down — works even in click-through)"
        >
          <span class="font-mono text-[10px] uppercase tracking-wider text-white/50 hidden sm:inline">
            Op
          </span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={props.opacity}
            aria-label="Background Opacity"
            title="Background Opacity (10% - 100%, Alt+Shift+Up/Down)"
            onInput={(e) => props.onOpacityChange(parseFloat(e.currentTarget.value))}
            class="w-16 studio-slider"
          />
          <span class="font-mono text-[11px] text-white/90 min-w-[32px] text-right tabular-nums">
            {opacityPercent()}%
          </span>
        </div>

        {/* Secondary Toggles: Mirror, Click-Through, Collapse Bar, Close */}
        <div class="flex items-center gap-1 pl-1 border-l border-white/10" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={props.onToggleMirror}
            title="Toggle Mirror Mode"
            aria-label="Toggle Mirror Mode"
            class={`w-7 h-7 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)] ${
              props.mirrorMode
                ? 'bg-[var(--accent,#7c6cff)]/25 text-white border border-[var(--accent,#7c6cff)]/60'
                : 'text-white/65 hover:text-white hover:bg-white/10'
            }`}
          >
            <MirrorIcon class="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={props.onToggleClickThrough}
            title={
              props.clickThrough
                ? 'Click-Through Locked (Alt+L to unlock). Use Alt+PageUp/Down to scroll & Alt+Shift+Up/Down for opacity.'
                : 'Enable Click-Through (Alt+L). In click-through mode use Alt+PageUp/Down to scroll & Alt+Shift+Up/Down for opacity.'
            }
            aria-label="Toggle Click-Through"
            class={`w-7 h-7 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)] ${
              props.clickThrough
                ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40'
                : 'text-white/65 hover:text-white hover:bg-white/10'
            }`}
          >
            {props.clickThrough ? <LockIcon class="w-3.5 h-3.5" /> : <UnlockIcon class="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={props.onToggleCollapse}
            title="Hide Controls Bar (keeps mini Play button visible)"
            aria-label="Hide Controls Bar"
            class="max-[420px]:hidden w-7 h-7 rounded-full text-white/65 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            <EyeOffIcon class="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={props.onClose}
            title="Close Prompter (Alt+H)"
            aria-label="Close Prompter"
            class="w-7 h-7 rounded-full text-white/65 hover:text-red-300 hover:bg-red-500/20 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#7c6cff)]"
          >
            <CloseIcon class="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
    </Show>
  );
}
