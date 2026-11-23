import type { JSX } from 'solid-js';

export interface GlassCardProps {
  class?: string;
  children: JSX.Element;
  title?: string;
  subtitle?: string;
  action?: JSX.Element;
}

export function GlassCard(props: GlassCardProps): JSX.Element {
  return (
    <div
      class={`bg-glass-surface/80 backdrop-blur-glass border border-glass-border rounded-2xl shadow-glass transition-all duration-200 ${
        props.class || ''
      }`}
    >
      {(props.title || props.action) && (
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-glass-border">
          <div>
            {props.title && <h3 class="text-sm font-semibold tracking-normal text-white">{props.title}</h3>}
            {props.subtitle && <p class="text-xs text-slate-400 mt-0.5">{props.subtitle}</p>}
          </div>
          {props.action && <div>{props.action}</div>}
        </div>
      )}
      {props.children}
    </div>
  );
}
