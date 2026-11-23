import type { JSX } from 'solid-js';

export function PlayIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="currentColor" viewBox="0 0 24 24">
      <path d="M7 4.5v15a1 1 0 001.55.83l12-7.5a1 1 0 000-1.66l-12-7.5A1 1 0 007 4.5z" />
    </svg>
  );
}

export function PauseIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="4.5" width="4" height="15" rx="1.5" />
      <rect x="14" y="4.5" width="4" height="15" rx="1.5" />
    </svg>
  );
}

export function RewindIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12.5 19l-7-7 7-7m6 14l-7-7 7-7" />
    </svg>
  );
}

export function EyeIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export function EyeOffIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
    </svg>
  );
}

export function ShieldCheckIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

export function SettingsIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export function TrashIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function PlusIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function CloseIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function LockIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}

export function UnlockIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 018 0" />
    </svg>
  );
}

export function GripIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="1.5" />
      <circle cx="15" cy="8" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="16" r="1.5" />
      <circle cx="15" cy="16" r="1.5" />
    </svg>
  );
}

export function SearchIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

export function MinimizeIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-3.5 h-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5" />
    </svg>
  );
}

export function MaximizeIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-3 h-3'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function FolderIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

export function ChevronDownIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-3.5 h-3.5'} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function TeleprompterLogo(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class || 'w-6 h-6'} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="13" rx="3" stroke="currentColor" stroke-width="1.8" />
      <path d="M6 8h12M6 11h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M9 20l3-3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}
