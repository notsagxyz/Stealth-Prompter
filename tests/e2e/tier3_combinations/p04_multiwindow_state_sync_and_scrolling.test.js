import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';

/**
 * P04: Pairwise Combination — Multi-Window State Sync & Prompter Scrolling
 * Features tested:
 * - F7: Tauri 2 Multi-Window Setup (Launcher & Prompter)
 * - F8: SolidJS Launcher UI & Controls
 * - F9: SolidJS Overlay HUD Prompter (Smooth Scroll & Event Bus)
 *
 * Verifies bidirectional IPC event communication between Launcher and Prompter HUD
 * without cyclic event echoes or state divergence.
 */

class MockTauriEventBus {
  constructor() {
    this.emitter = new EventEmitter();
    this.eventLog = [];
  }

  emit(eventName, payload, sourceWindow) {
    this.eventLog.push({ eventName, payload, sourceWindow, timestamp: Date.now() });
    this.emitter.emit(eventName, { payload, sourceWindow });
  }

  listen(eventName, listener) {
    this.emitter.on(eventName, listener);
    return () => this.emitter.off(eventName, listener);
  }
}

class MockLauncherWindow {
  constructor(bus) {
    this.bus = bus;
    this.state = {
      prompterPlaying: false,
      prompterSpeed: 2.0,
      prompterProgress: 0.0
    };

    // Listen to HUD state synchronization
    this.bus.listen('prompter:state_sync', ({ payload, sourceWindow }) => {
      if (sourceWindow === 'launcher') return; // Prevent self-echo
      this.state.prompterPlaying = payload.playing;
      this.state.prompterSpeed = payload.speed;
      this.state.prompterProgress = payload.progress;
    });
  }

  sendAction(type, value) {
    this.bus.emit('prompter:action', { type, value }, 'launcher');
  }

  updateScript(script) {
    this.bus.emit('prompter:update_script', { script }, 'launcher');
  }
}

class MockHudPrompterWindow {
  constructor(bus) {
    this.bus = bus;
    this.playing = false;
    this.speed = 2.0;
    this.progress = 0.0;
    this.script = null;
    this.tickCount = 0;

    // Listen to Launcher actions
    this.bus.listen('prompter:action', ({ payload, sourceWindow }) => {
      if (sourceWindow === 'prompter') return; // Prevent self-echo
      this.handleAction(payload);
    });

    this.bus.listen('prompter:update_script', ({ payload }) => {
      this.script = payload.script;
      this.progress = payload.script.scrollPosition || 0;
    });
  }

  handleAction(action) {
    switch (action.type) {
      case 'play':
        this.playing = true;
        break;
      case 'pause':
        this.playing = false;
        break;
      case 'speed_change':
        this.speed = Math.max(0.1, action.value ?? this.speed);
        break;
      case 'rewind':
        this.progress = Math.max(0, this.progress - (action.value ?? 50));
        break;
      case 'reset':
        this.progress = 0;
        this.playing = false;
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    this.broadcastStateSync();
  }

  tick(deltaMs = 16.67) {
    if (!this.playing) return;
    // Scroll progress increases proportionally to speed and delta
    const step = (this.speed * 1.5 * deltaMs) / 16.67;
    this.progress += step;
    this.tickCount++;
    this.broadcastStateSync();
  }

  broadcastStateSync() {
    this.bus.emit('prompter:state_sync', {
      playing: this.playing,
      speed: this.speed,
      progress: Math.round(this.progress * 100) / 100
    }, 'prompter');
  }
}

describe('P04: Pairwise Multi-Window State Sync & Scrolling', () => {
  it('should synchronize Play action from Launcher to HUD and start scrolling', () => {
    const bus = new MockTauriEventBus();
    const launcher = new MockLauncherWindow(bus);
    const hud = new MockHudPrompterWindow(bus);

    assert.equal(hud.playing, false);
    assert.equal(launcher.state.prompterPlaying, false);

    launcher.sendAction('play');

    assert.equal(hud.playing, true);
    assert.equal(launcher.state.prompterPlaying, true);

    // Simulate 3 animation frame ticks
    hud.tick(16.67);
    hud.tick(16.67);
    hud.tick(16.67);

    assert.ok(hud.progress > 0, 'HUD progress must have advanced');
    assert.equal(launcher.state.prompterProgress, Math.round(hud.progress * 100) / 100);
  });

  it('should synchronize Speed Change action without resetting current progress', () => {
    const bus = new MockTauriEventBus();
    const launcher = new MockLauncherWindow(bus);
    const hud = new MockHudPrompterWindow(bus);

    launcher.sendAction('play');
    hud.tick(16.67);
    hud.tick(16.67);
    const progressBeforeSpeedChange = hud.progress;
    assert.ok(progressBeforeSpeedChange > 0);

    // Increase speed to 4.5
    launcher.sendAction('speed_change', 4.5);

    assert.equal(hud.speed, 4.5);
    assert.equal(launcher.state.prompterSpeed, 4.5);
    assert.equal(hud.progress, progressBeforeSpeedChange, 'Progress must not reset on speed change');

    // Next tick should advance faster
    hud.tick(16.67);
    const delta = hud.progress - progressBeforeSpeedChange;
    assert.ok(Math.abs(delta - (4.5 * 1.5)) < 0.1, `Delta should be close to 6.75, got ${delta}`);
  });

  it('should avoid feedback loops when synchronizing state across windows', () => {
    const bus = new MockTauriEventBus();
    const launcher = new MockLauncherWindow(bus);
    const hud = new MockHudPrompterWindow(bus);

    const initialEventCount = bus.eventLog.length;
    launcher.sendAction('pause');

    // One action event + one sync response event = exactly 2 events
    const newEvents = bus.eventLog.slice(initialEventCount);
    assert.equal(newEvents.length, 2);
    assert.equal(newEvents[0].eventName, 'prompter:action');
    assert.equal(newEvents[1].eventName, 'prompter:state_sync');
  });

  it('should support Rewind and Reset actions and sync back to Launcher', () => {
    const bus = new MockTauriEventBus();
    const launcher = new MockLauncherWindow(bus);
    const hud = new MockHudPrompterWindow(bus);

    hud.progress = 200;
    hud.playing = true;

    // Rewind by 60
    launcher.sendAction('rewind', 60);
    assert.equal(hud.progress, 140);
    assert.equal(launcher.state.prompterProgress, 140);

    // Reset
    launcher.sendAction('reset');
    assert.equal(hud.progress, 0);
    assert.equal(hud.playing, false);
    assert.equal(launcher.state.prompterProgress, 0);
    assert.equal(launcher.state.prompterPlaying, false);
  });

  it('should update HUD script and bookmark from Launcher updateScript event', () => {
    const bus = new MockTauriEventBus();
    const launcher = new MockLauncherWindow(bus);
    const hud = new MockHudPrompterWindow(bus);

    const testScript = {
      id: 'script-42',
      title: 'Demo Speech',
      scrollPosition: 85.5
    };

    launcher.updateScript(testScript);
    assert.deepEqual(hud.script, testScript);
    assert.equal(hud.progress, 85.5);
  });
});
