import type { JSX } from 'solid-js';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cyber' | 'emerald';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;
  title?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  const rawVariant = props.variant || 'secondary';
  const variant = rawVariant === 'cyber' || rawVariant === 'emerald' ? 'primary' : rawVariant;
  const size = props.size || 'md';

  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-white/30 disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-xl gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    icon: 'p-1.5 rounded-lg',
  }[size];

  const variantStyles = {
    primary:
      'bg-white text-black hover:bg-neutral-200 font-semibold shadow-sm active:scale-[0.98]',
    secondary:
      'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 active:scale-[0.98]',
    ghost:
      'text-white/70 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1]',
    danger:
      'text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20',
  }[variant];

  return (
    <button
      type="button"
      title={props.title}
      disabled={props.disabled}
      onClick={props.onClick}
      class={`${baseStyles} ${sizeStyles} ${variantStyles} ${props.class || ''}`}
    >
      {props.children}
    </button>
  );
}
