import { invoke } from '@tauri-apps/api/core';
import type { Settings, Script, ScriptSummary } from './types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function setCaptureExclusion(windowLabel: string, enabled: boolean): Promise<void> {
  if (!isTauri) return;
  return await invoke('set_capture_exclusion', {
    window_label: windowLabel,
    windowLabel,
    enabled: Boolean(enabled),
  });
}

export async function getCaptureExclusion(windowLabel: string): Promise<boolean> {
  if (!isTauri) return true;
  return await invoke<boolean>('get_capture_exclusion', {
    window_label: windowLabel,
    windowLabel,
  });
}

export async function togglePrompterWindow(): Promise<void> {
  if (!isTauri) return;
  return await invoke('toggle_prompter_window');
}

export async function setClickThrough(enabled: boolean): Promise<void> {
  if (!isTauri) return;
  return await invoke('set_click_through', { enabled: Boolean(enabled) });
}

export async function loadSettings(): Promise<Settings> {
  if (!isTauri) {
    return {
      scroll_speed: 3.0,
      font_size: 28,
      line_height: 1.5,
      window_opacity: 0.9,
      mirror_mode: false,
      click_through: false,
      theme: 'dark-glass',
      last_script_id: null,
      offline_only: true,
      telemetry_enabled: false,
      geometry: { x: 100, y: 100, width: 800, height: 400 },
      hotkeys: {
        toggle_play: 'Alt+Space',
        speed_up: 'Alt+Up',
        speed_down: 'Alt+Down',
        toggle_window: 'Alt+H',
      },
    };
  }
  return await invoke<Settings>('load_settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (!isTauri) return;
  return await invoke('save_settings', { settings });
}

export async function listScripts(): Promise<ScriptSummary[]> {
  if (!isTauri) return [];
  return await invoke<ScriptSummary[]>('list_scripts');
}

export async function loadScript(id: string): Promise<Script> {
  if (!isTauri) {
    return {
      id,
      title: 'Default Demo Script',
      content: 'Welcome to Stealth.\nInvisible teleprompter for presentations.',
      last_position: 0,
      speed: 3.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      cues: [],
    };
  }
  return await invoke<Script>('load_script', { id });
}

export async function saveScript(script: Script): Promise<void> {
  if (!isTauri) return;
  return await invoke('save_script', { script });
}

export async function deleteScript(id: string): Promise<void> {
  if (!isTauri) return;
  return await invoke('delete_script', { id });
}
