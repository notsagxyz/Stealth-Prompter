import type { JSX } from 'solid-js';

export interface ReadingMarkerProps {
  topPercent?: number;
  heightPx?: number;
  color?: string;
  glow?: boolean;
}

export function ReadingMarker(props: ReadingMarkerProps): JSX.Element {
  const top = () => `${props.topPercent ?? 35}%`;

  return (
    <div
      class="pointer-events-none fixed left-0 right-0 z-20 flex items-center justify-between px-6 transition-all duration-200"
      style={{
        top: top(),
      }}
    >
      {/* Left visual eye-line pip */}
      <div class="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />

      {/* Subtle hairline gradient across reading plane */}
      <div class="flex-1 mx-3 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Right visual eye-line pip */}
      <div class="w-1.5 h-1.5 rounded-full bg-white/40 shadow-sm" />
    </div>
  );
}
