export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HotkeysSettings {
  toggle_play: string;
  speed_up: string;
  speed_down: string;
  toggle_window: string;
}

export interface Settings {
  scroll_speed: number;
  font_size: number;
  line_height: number;
  window_opacity: number;
  mirror_mode: boolean;
  click_through: boolean;
  theme: string;
  last_script_id: string | null;
  offline_only: boolean;
  telemetry_enabled: boolean;
  geometry?: WindowGeometry | null;
  hotkeys: HotkeysSettings;
}

export interface Cue {
  id: string;
  label: string;
  position: number;
  notes?: string | null;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  last_position: number;
  speed: number;
  created_at: string;
  updated_at: string;
  cues: Cue[];
}

export interface ScriptSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_position: number;
  speed: number;
  word_count: number;
  snippet?: string;
}

export type PrompterActionType = 'play' | 'pause' | 'speed_change' | 'rewind' | 'reset' | 'speed_up' | 'speed_down' | 'toggle_play';

export interface PrompterActionPayload {
  type: PrompterActionType;
  value?: number;
}

export interface PrompterUpdateScriptPayload {
  script: Script;
}

export interface PrompterStateSyncPayload {
  playing: boolean;
  speed: number;
  progress: number;
}
