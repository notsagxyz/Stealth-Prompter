import type { JSX } from 'solid-js';

export interface ReadingMarkerProps {
  topPercent?: number;
  heightPx?: number;
  color?: string;
  glow?: boolean;
}

export function ReadingMarker(props: ReadingMarkerProps): JSX.Element {
  const top = () => `${props.topPercent ?? 35}%`;
  const height = () => `${props.heightPx ?? 2}px`;
  const color = () => props.color ?? 'rgba(56, 189, 248, 0.4)';

  return (
    <div
      class="pointer-events-none fixed left-0 right-0 z-30 transition-all duration-150"
      style={{
        top: top(),
        height: height(),
        'background-color': color(),
        'box-shadow': props.glow !== false ? '0 0 8px rgba(0, 240, 255, 0.5)' : 'none',
      }}
    >
      {/* Visual eye-line indicator pills on edges */}
      <div class="absolute left-2 -top-1 w-2 h-2 rounded-full bg-cyber-cyan opacity-80" />
      <div class="absolute right-2 -top-1 w-2 h-2 rounded-full bg-cyber-cyan opacity-80" />
    </div>
  );
}
