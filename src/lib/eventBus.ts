import { emit, listen } from '@tauri-apps/api/event';
import type { PrompterActionPayload, PrompterUpdateScriptPayload, PrompterStateSyncPayload } from './types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const localEmitter = new EventTarget();

export async function emitPrompterAction(action: PrompterActionPayload, sourceWindow: string = 'launcher'): Promise<void> {
  if (isTauri) {
    await emit('prompter:action', action);
  } else {
    localEmitter.dispatchEvent(new CustomEvent('prompter:action', { detail: { payload: action, sourceWindow } }));
  }
}

export async function emitUpdateScript(script: PrompterUpdateScriptPayload['script'], sourceWindow: string = 'launcher'): Promise<void> {
  if (isTauri) {
    await emit('prompter:update_script', { script });
  } else {
    localEmitter.dispatchEvent(new CustomEvent('prompter:update_script', { detail: { payload: { script }, sourceWindow } }));
  }
}

export async function emitStateSync(state: PrompterStateSyncPayload, sourceWindow: string = 'prompter'): Promise<void> {
  if (isTauri) {
    await emit('prompter:state_sync', state);
  } else {
    localEmitter.dispatchEvent(new CustomEvent('prompter:state_sync', { detail: { payload: state, sourceWindow } }));
  }
}

export async function emitToggleLock(): Promise<void> {
  if (isTauri) {
    await emit('prompter:toggle_lock', {});
  } else {
    localEmitter.dispatchEvent(new CustomEvent('prompter:toggle_lock', { detail: {} }));
  }
}

export async function onToggleLock(callback: () => void): Promise<() => void> {
  if (isTauri) {
    return await listen('prompter:toggle_lock', () => callback());
  } else {
    const handler = () => callback();
    localEmitter.addEventListener('prompter:toggle_lock', handler);
    return () => localEmitter.removeEventListener('prompter:toggle_lock', handler);
  }
}

export async function onPrompterAction(callback: (payload: PrompterActionPayload) => void): Promise<() => void> {
  if (isTauri) {
    return await listen<PrompterActionPayload>('prompter:action', (e) => callback(e.payload));
  } else {
    const handler = (e: Event) => callback((e as CustomEvent).detail.payload);
    localEmitter.addEventListener('prompter:action', handler);
    return () => localEmitter.removeEventListener('prompter:action', handler);
  }
}

export async function onUpdateScript(callback: (payload: PrompterUpdateScriptPayload) => void): Promise<() => void> {
  if (isTauri) {
    return await listen<PrompterUpdateScriptPayload>('prompter:update_script', (e) => callback(e.payload));
  } else {
    const handler = (e: Event) => callback((e as CustomEvent).detail.payload);
    localEmitter.addEventListener('prompter:update_script', handler);
    return () => localEmitter.removeEventListener('prompter:update_script', handler);
  }
}

export async function onStateSync(callback: (payload: PrompterStateSyncPayload) => void): Promise<() => void> {
  if (isTauri) {
    return await listen<PrompterStateSyncPayload>('prompter:state_sync', (e) => callback(e.payload));
  } else {
    const handler = (e: Event) => callback((e as CustomEvent).detail.payload);
    localEmitter.addEventListener('prompter:state_sync', handler);
    return () => localEmitter.removeEventListener('prompter:state_sync', handler);
  }
}
