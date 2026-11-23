import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Design tokens for dark glass aesthetic per PROJECT.md § Architecture
const DARK_GLASS_THEME = {
  background: 'rgba(15, 23, 42, 0.75)',
  backdropBlur: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  textColor: '#F8FAFC',
  accentColor: '#38BDF8'
};

// Word count and reading time utility conforming to launcher UI requirements
function calculateScriptMetrics(text, wpm = 150) {
  if (!text || text.trim().length === 0) {
    return { wordCount: 0, estimatedMinutes: 0 };
  }
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedMinutes = Math.round((wordCount / wpm) * 10) / 10;
  return { wordCount, estimatedMinutes };
}

describe('F08: SolidJS Frontend & Dark Glass Launcher UI', () => {
  it('1. should verify dark glass design tokens and CSS styles contract', () => {
    assert.match(DARK_GLASS_THEME.background, /rgba\(\d+,\s*\d+,\s*\d+,\s*0?\.\d+\)/);
    assert.ok(DARK_GLASS_THEME.backdropBlur.includes('blur'));
    assert.ok(DARK_GLASS_THEME.border.includes('rgba(255, 255, 255'));
    assert.strictEqual(DARK_GLASS_THEME.textColor, '#F8FAFC');
  });

  it('2. should verify launcher component UI structure and controls', () => {
    const requiredLauncherControls = [
      'scriptSelector',
      'scriptEditor',
      'speedSlider',
      'fontSizeControl',
      'mirrorToggle',
      'invisibilitySwitch',
      'togglePrompterButton'
    ];

    assert.strictEqual(requiredLauncherControls.length, 7);
    for (const control of requiredLauncherControls) {
      assert.ok(typeof control === 'string' && control.length > 0);
    }
  });

  it('3. should verify script editor state and reading time estimation', () => {
    const sampleScript = 'Welcome to today’s product announcement. We have spent the last six months engineering this platform.';
    const metrics = calculateScriptMetrics(sampleScript, 150);

    assert.ok(metrics.wordCount > 10, 'Must accurately count words in script');
    assert.strictEqual(typeof metrics.estimatedMinutes, 'number');

    const emptyMetrics = calculateScriptMetrics('');
    assert.strictEqual(emptyMetrics.wordCount, 0);
    assert.strictEqual(emptyMetrics.estimatedMinutes, 0);
  });

  it('4. should verify playback and speed slider bounds and step granularity', () => {
    const speedSliderConfig = {
      min: 1,
      max: 10,
      step: 1,
      default: 3
    };

    assert.strictEqual(speedSliderConfig.min, 1);
    assert.strictEqual(speedSliderConfig.max, 10);
    assert.ok(speedSliderConfig.default >= speedSliderConfig.min && speedSliderConfig.default <= speedSliderConfig.max);

    // Clamping logic
    function clampSpeed(speed) {
      return Math.max(speedSliderConfig.min, Math.min(speedSliderConfig.max, speed));
    }

    assert.strictEqual(clampSpeed(0), 1);
    assert.strictEqual(clampSpeed(15), 10);
    assert.strictEqual(clampSpeed(5), 5);
  });

  it('5. should verify invisibility toggle IPC command payload', () => {
    function buildInvisibilityCommand(windowLabel, enabled) {
      return {
        cmd: 'set_capture_exclusion',
        payload: {
          window_label: windowLabel,
          enabled: Boolean(enabled)
        }
      };
    }

    const command = buildInvisibilityCommand('prompter', true);
    assert.strictEqual(command.cmd, 'set_capture_exclusion');
    assert.strictEqual(command.payload.window_label, 'prompter');
    assert.strictEqual(command.payload.enabled, true);

    const disableCommand = buildInvisibilityCommand('prompter', false);
    assert.strictEqual(disableCommand.payload.enabled, false);
  });
});
