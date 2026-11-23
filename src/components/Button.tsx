import type { JSX } from 'solid-js';

export interface ButtonProps {
  variant?: 'cyber' | 'emerald' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  class?: string;
  onClick?: (e: MouseEvent) => void;
  children: JSX.Element;
  title?: string;
}

export function Button(props: ButtonProps): JSX.Element {
  const variant = props.variant || 'cyber';
  const size = props.size || 'md';

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantStyles = {
    cyber:
      'border border-cyber-cyan/40 text-cyber-cyan bg-cyber-cyan/10 hover:bg-cyber-cyan/20 hover:border-cyber-cyan focus:ring-cyber-cyan/50 shadow-cyber',
    emerald:
      'border border-stealth-emerald/40 text-stealth-emerald bg-stealth-emerald/10 hover:bg-stealth-emerald/20 hover:border-stealth-emerald focus:ring-stealth-emerald/50 shadow-emerald',
    ghost:
      'border border-obsidian-border text-slate-300 hover:text-white hover:bg-white/5 focus:ring-white/20',
    danger:
      'border border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500 focus:ring-rose-500/50',
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
