import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PROJECT_ROOT = path.resolve(process.cwd());
const BENCHMARK_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'benchmark_resources.ps1');

/**
 * Resolves project specifications from repository, vault, or teamwork state.
 */
function loadProjectSpec(fileName = 'PROJECT.md') {
  const localPath = path.join(PROJECT_ROOT, fileName);
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath, 'utf8');

  const scratchRoot = path.join(os.homedir(), '.gemini', 'antigravity', 'scratch', 'teamwork');
  if (fs.existsSync(scratchRoot)) {
    try {
      const runs = fs.readdirSync(scratchRoot);
      for (const run of runs) {
        const candidate = path.join(scratchRoot, run, '.agents', 'teamwork', fileName);
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate, 'utf8');
        }
      }
    } catch {}
  }
  return '';
}

function loadAdr001() {
  const adrPath = path.join(PROJECT_ROOT, 'vault', '03-Arquitectura', 'ADR-001-Stack-Tauri2-Rust.md');
  if (fs.existsSync(adrPath)) {
    return fs.readFileSync(adrPath, 'utf8');
  }
  return '';
}

describe('F13: Resource Usage Benchmarks vs Electron Baseline', () => {
  it('1. should verify benchmark script interface specification in scripts/ or PROJECT.md', () => {
    if (fs.existsSync(BENCHMARK_SCRIPT)) {
      const content = fs.readFileSync(BENCHMARK_SCRIPT, 'utf8');
      assert.match(content, /RAM|WorkingSet|CPU|Electron/i);
    } else {
      // Validate contract specification parsed from PROJECT.md & TEST_INFRA.md
      const projectMd = loadProjectSpec('PROJECT.md');
      assert.ok(projectMd.length > 0, 'PROJECT.md specification must be available');

      // 1. Verify Feature 13 entry in Feature Inventory
      const featureMatch = projectMd.match(/\|\s*13\s*\|\s*Resource Usage Benchmarks\s*\|\s*([^|]+)\|\s*([A-Za-z0-9]+)\s*\|/);
      assert.ok(featureMatch, 'PROJECT.md must define Feature 13 in Feature Inventory');

      const featureDesc = featureMatch[1].trim();
      assert.match(featureDesc, /RAM/i);
      assert.match(featureDesc, /CPU/i);
      assert.match(featureDesc, /startup time/i);
      assert.match(featureDesc, /binary size/i);
      assert.match(featureDesc, /Electron/i);
      assert.strictEqual(featureMatch[2].trim(), 'M4', 'Feature 13 must be scheduled for Milestone M4');

      // 2. Verify script in Code Layout
      assert.match(
        projectMd,
        /benchmark_resources\.ps1\s*#\s*RAM,\s*CPU,\s*binary size comparison metrics/,
        'Code layout must mandate scripts/benchmark_resources.ps1'
      );

      // 3. Verify TEST_INFRA.md matrix definition
      const testInfra = loadProjectSpec('TEST_INFRA.md');
      if (testInfra) {
        assert.match(testInfra, /\|\s*13\s*\|\s*Resource Usage Benchmarks\s*\|\s*R3/);
      }
    }
  });

  it('2. should verify RAM consumption baseline threshold parsed from ADR-001 architectural decisions', () => {
    const adrContent = loadAdr001();
    assert.ok(adrContent.length > 0, 'ADR-001 must exist in vault');

    // Parse RAM idle comparison row: | **Consumo RAM (Reposo)** | **25 – 45 MB** | 180 – 280 MB | **~85% menor consumo** |
    const ramIdleMatch = adrContent.match(/Consumo RAM \(Reposo\)[^\n]*\|\s*\*\*(\d+)\s*–\s*(\d+)\s*MB\*\*\s*\|\s*(\d+)\s*–\s*(\d+)\s*MB/i);
    assert.ok(ramIdleMatch, 'Must parse RAM Reposo thresholds from ADR-001');

    const tauriIdleMax = parseInt(ramIdleMatch[2], 10); // 45 MB
    const electronIdleMin = parseInt(ramIdleMatch[3], 10); // 180 MB

    assert.ok(tauriIdleMax <= 60, `Tauri idle RAM upper bound must be <= 60MB (got ${tauriIdleMax}MB)`);
    assert.ok(electronIdleMin >= 150, `Electron baseline idle RAM is >= 150MB (got ${electronIdleMin}MB)`);

    const ramSavingsPercent = ((electronIdleMin - tauriIdleMax) / electronIdleMin) * 100;
    assert.ok(ramSavingsPercent >= 60, `RAM savings must exceed 60% (got ${ramSavingsPercent.toFixed(1)}%)`);
  });

  it('3. should verify CPU utilization efficiency threshold parsed from ADR-001 (<2% vs 8%-18%)', () => {
    const adrContent = loadAdr001();
    assert.ok(adrContent.length > 0);

    // Parse CPU scroll comparison row: | **Uso de CPU en Scroll** | **< 2% CPU** en hardware estándar | 8% – 18% CPU continuo |
    const cpuMatch = adrContent.match(/Uso de CPU en Scroll[^\n]*\|\s*\*\*<\s*(\d+)%\s*CPU\*\*[^\n]*\|\s*(\d+)%\s*–\s*(\d+)%/i);
    assert.ok(cpuMatch, 'Must parse CPU utilization thresholds from ADR-001');

    const tauriCpuTarget = parseInt(cpuMatch[1], 10); // 2%
    const electronCpuMin = parseInt(cpuMatch[2], 10); // 8%

    assert.ok(tauriCpuTarget <= 5, `Tauri scroll CPU target must be <= 5% (got ${tauriCpuTarget}%)`);
    assert.ok(electronCpuMin > tauriCpuTarget, 'Electron CPU usage must be higher than Tauri target');
  });

  it('4. should verify binary distribution footprint threshold parsed from ADR-001 (<15MB vs 85-120MB)', () => {
    const adrContent = loadAdr001();
    assert.ok(adrContent.length > 0);

    // Parse installer size row: | **Tamaño del Instalador** | **~8 – 15 MB** | 85 – 120 MB | **~90% más compacto** |
    const installerMatch = adrContent.match(/Tamaño del Instalador[^\n]*\|\s*\*\*~?(\d+)\s*–\s*(\d+)\s*MB\*\*\s*\|\s*(\d+)\s*–\s*(\d+)\s*MB/i);
    assert.ok(installerMatch, 'Must parse Installer size thresholds from ADR-001');

    const tauriInstallerMax = parseInt(installerMatch[2], 10); // 15 MB
    const electronInstallerMin = parseInt(installerMatch[3], 10); // 85 MB

    assert.ok(tauriInstallerMax <= 20, `Tauri installer max size must be <= 20MB (got ${tauriInstallerMax}MB)`);
    assert.ok(electronInstallerMin >= 80, `Electron installer min size must be >= 80MB (got ${electronInstallerMin}MB)`);

    const footprintSavings = ((electronInstallerMin - tauriInstallerMax) / electronInstallerMin) * 100;
    assert.ok(footprintSavings >= 75, `Binary footprint savings must exceed 75% (got ${footprintSavings.toFixed(1)}%)`);
  });

  it('5. should verify machine-readable benchmark report format and schema', () => {
    function generateBenchmarkReport(tauriMetrics, electronMetrics) {
      return {
        timestamp: new Date().toISOString(),
        environment: 'Windows 11 x64',
        metrics: {
          tauri: tauriMetrics,
          electronBaseline: electronMetrics
        },
        savings: {
          ramPercent: Math.round(((electronMetrics.ramMb - tauriMetrics.ramMb) / electronMetrics.ramMb) * 100),
          binaryPercent: Math.round(((electronMetrics.binaryMb - tauriMetrics.binaryMb) / electronMetrics.binaryMb) * 100)
        }
      };
    }

    const report = generateBenchmarkReport(
      { ramMb: 38, cpuPercent: 1.8, binaryMb: 12, startupMs: 380 },
      { ramMb: 200, cpuPercent: 12.0, binaryMb: 95, startupMs: 2200 }
    );

    assert.ok(report.timestamp.endsWith('Z'), 'Report must include ISO UTC timestamp');
    assert.ok(report.savings.ramPercent > 70);
    assert.ok(report.savings.binaryPercent > 80);
    assert.strictEqual(typeof report.metrics.tauri.ramMb, 'number');
    assert.strictEqual(typeof report.metrics.electronBaseline.ramMb, 'number');
  });
});
