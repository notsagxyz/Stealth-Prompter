import type { JSX } from 'solid-js';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Settings,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Search,
  Minus,
  Square,
  X,
  GripHorizontal,
  FlipHorizontal2,
  Heart,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileText,
  Sparkles,
  ExternalLink,
  PanelLeft,
} from 'lucide-solid';

export const PlayIcon = (props: { class?: string }): JSX.Element => (
  <Play class={props.class} strokeWidth={2} />
);

export const PauseIcon = (props: { class?: string }): JSX.Element => (
  <Pause class={props.class} strokeWidth={2} />
);

export const RewindIcon = (props: { class?: string }): JSX.Element => (
  <RotateCcw class={props.class} strokeWidth={1.75} />
);

export const EyeIcon = (props: { class?: string }): JSX.Element => (
  <Eye class={props.class} strokeWidth={1.75} />
);

export const EyeOffIcon = (props: { class?: string }): JSX.Element => (
  <EyeOff class={props.class} strokeWidth={1.75} />
);

export const SettingsIcon = (props: { class?: string }): JSX.Element => (
  <Settings class={props.class} strokeWidth={1.75} />
);

export const LockIcon = (props: { class?: string }): JSX.Element => (
  <Lock class={props.class} strokeWidth={1.75} />
);

export const UnlockIcon = (props: { class?: string }): JSX.Element => (
  <Unlock class={props.class} strokeWidth={1.75} />
);

export const PlusIcon = (props: { class?: string }): JSX.Element => (
  <Plus class={props.class} strokeWidth={1.75} />
);

export const TrashIcon = (props: { class?: string }): JSX.Element => (
  <Trash2 class={props.class} strokeWidth={1.75} />
);

export const SearchIcon = (props: { class?: string }): JSX.Element => (
  <Search class={props.class} strokeWidth={1.75} />
);

export const MinimizeIcon = (props: { class?: string }): JSX.Element => (
  <Minus class={props.class} strokeWidth={1.75} />
);

export const MaximizeIcon = (props: { class?: string }): JSX.Element => (
  <Square class={props.class} strokeWidth={1.75} />
);

export const CloseIcon = (props: { class?: string }): JSX.Element => (
  <X class={props.class} strokeWidth={1.75} />
);

export const GripIcon = (props: { class?: string }): JSX.Element => (
  <GripHorizontal class={props.class} strokeWidth={1.75} />
);

export const MirrorIcon = (props: { class?: string }): JSX.Element => (
  <FlipHorizontal2 class={props.class} strokeWidth={1.75} />
);

export const HeartIcon = (props: { class?: string }): JSX.Element => (
  <Heart class={props.class} fill="currentColor" strokeWidth={1.75} />
);

export const ChevronLeftIcon = (props: { class?: string }): JSX.Element => (
  <ChevronLeft class={props.class} strokeWidth={1.75} />
);

export const ChevronRightIcon = (props: { class?: string }): JSX.Element => (
  <ChevronRight class={props.class} strokeWidth={1.75} />
);

export const SlidersIcon = (props: { class?: string }): JSX.Element => (
  <SlidersHorizontal class={props.class} strokeWidth={1.75} />
);

export const FileTextIcon = (props: { class?: string }): JSX.Element => (
  <FileText class={props.class} strokeWidth={1.75} />
);

export const SparklesIcon = (props: { class?: string }): JSX.Element => (
  <Sparkles class={props.class} strokeWidth={1.75} />
);

export const ExternalLinkIcon = (props: { class?: string }): JSX.Element => (
  <ExternalLink class={props.class} strokeWidth={1.75} />
);

export const SidebarIcon = (props: { class?: string }): JSX.Element => (
  <PanelLeft class={props.class} strokeWidth={1.75} />
);

/**
 * Original Stealth Ninja-Play Brand Mark (Concept A: 4-point stealth shuriken + center play cue)
 */
export const StealthLogo = (props: { class?: string }): JSX.Element => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class={props.class || 'w-5 h-5'}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="28" height="28" rx="8" fill="#13131d" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
    <path
      d="M16 5.5L19.4 12.6L26.5 16L19.4 19.4L16 26.5L12.6 19.4L5.5 16L12.6 12.6L16 5.5Z"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linejoin="round"
    />
    <path
      d="M14.2 13.1L19.2 16L14.2 18.9V13.1Z"
      fill="var(--accent, #7c6cff)"
    />
  </svg>
);
