<p align="center">
  <img src="assets/stealth-banner.png" alt="Stealth" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/rust-2021_edition-orange.svg" alt="Rust" />
  <img src="https://img.shields.io/badge/tauri-v2.0-24C8DB.svg" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Windows_DWM-WDA__EXCLUDEFROMCAPTURE-0078D6.svg" alt="Windows DWM Invisibility" />
</p>

<p align="center">
  <strong>The open-source invisible teleprompter that stays hidden from screen sharing and recordings.</strong><br />
  Built with <strong>Tauri 2</strong>, <strong>Rust</strong>, and <strong>SolidJS</strong> for minimal memory usage, zero focus stealing, and OS-level capture exclusion on Windows.
</p>

---

## Table of Contents

- [Core Value Proposition](#core-value-proposition)
- [Features](#features)
- [How Invisibility Works](#how-invisibility-works)
- [Architecture](#architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Verification & Testing](#verification--testing)
- [Installation & Building](#installation--building)
- [Directory Layout](#directory-layout)
- [License](#license)

---

## Core Value Proposition

Presentations, technical demos, and video calls require natural eye contact with your camera without exposing your speaking notes on screen shares.

**Stealth** solves this natively on Windows:
- **OS-Level Capture Exclusion**: Uses the Windows Desktop Window Manager (DWM) display affinity API (`WDA_EXCLUDEFROMCAPTURE = 0x00000011`) so the prompter window is omitted from screen captures, desktop shares, and recordings.
- **Lightweight Native Footprint**: Rust + SolidJS + WebView2 avoids bundling a heavy Chromium/Node.js runtime.
- **Non-Focus-Stealing Control**: Global hotkeys let you play, pause, adjust speed, or hide the HUD while keeping keyboard focus in your active presentation, IDE, or browser.
- **100% Open Source & Offline-First**: MIT-licensed, zero telemetry, zero accounts, and atomic local JSON persistence.

---

## Features

- **True DWM Capture Invisibility**: Window surface is excluded by the OS compositor before frames reach screen capture APIs.
- **Multi-Window Dark Glass UI**:
  - **Launcher (`index.html`)**: Manage scripts, import text, customize hotkeys, switch language (**English / Español**), and adjust HUD appearance.
  - **Prompter HUD (`hud.html`)**: Frameless, transparent, always-on-top overlay with smooth auto-scroll, draggable from both the top handle and bottom control bar.
- **Hardware-Accelerated Auto-Scroll**: Smooth CSS GPU transforms without Virtual DOM overhead.
- **Mirror Mode**: Horizontal flip for beam-splitter teleprompter glass hardware.
- **Click-Through Mode**: Pass mouse clicks directly through the prompter overlay to windows underneath.
- **Atomic Local Persistence**: Writes state to a temporary `.tmp` file, flushes with `sync_all()`, and atomically renames to prevent corruption of `settings.json` and scripts.
- **Bilingual Interface**: Full **English** and **Spanish** (`EN` / `ES`) support across the Launcher and HUD.

---

## How Invisibility Works

Stealth invokes the Win32 Desktop Window Manager API directly from Rust:

```rust
SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
```

- **`WDA_EXCLUDEFROMCAPTURE` (`0x00000011`)**: Introduced in **Windows 10 Version 2004 (Build 19041)** and standard in **Windows 11**. Unlike legacy `WDA_MONITOR` (which turns the window into a solid black rectangle in captures), `WDA_EXCLUDEFROMCAPTURE` instructs DWM to exclude the window surface entirely so capture tools see only the desktop and windows behind it.
- **Supported Capture Pipelines**: DXGI Desktop Duplication, Windows Graphics Capture (WGC), GDI (`BitBlt` / `GetDC`), and MediaFoundation — covering **Zoom**, **Microsoft Teams**, **Google Meet**, **OBS Studio**, **Discord**, and **Loom**.
- **Fallback**: On Windows builds earlier than `19041`, `WindowsPlatform` detects the OS build via `RtlGetVersion` and falls back to `WDA_MONITOR` with explicit logging.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Desktop Window Manager (DWM)                │
└──────────────────────────────▲──────────────────────────────┘
                               │ SetWindowDisplayAffinity(0x11)
┌──────────────────────────────┴──────────────────────────────┐
│                    WindowPlatform Trait                     │
│  - set_display_affinity()    - set_click_through()          │
│  - set_no_activate()         - show_unfocused() / hide()    │
├──────────────────────────────┬──────────────────────────────┤
│  WindowsPlatform (Win32 API) │  MockPlatform (Headless CI)  │
└──────────────────────────────┴──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                   Tauri 2 Core Backend                      │
│  - commands/ (IPC Handlers)   - storage/ (Atomic JSON)      │
│  - shortcuts/ (Global Hooks) - state/ (Thread-Safe Store)   │
└──────────────────────────────▲──────────────────────────────┘
                               │ Inter-Window IPC / Events
        ┌──────────────────────┴──────────────────────┐
        ▼                                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│   Launcher (index.html)     │ │     Prompter (hud.html)     │
│  - Script Editor & Library  │ │  - Frameless Topmost Overlay│
│  - Settings & Hotkeys (EN/ES)│ │  - GPU Smooth Auto-Scroll   │
└─────────────────────────────┘ └─────────────────────────────┘
```

- **`src-tauri/src/platform/`**: `WindowPlatform` trait decoupling Win32 (`windows-rs`) from `MockWindowPlatform` for headless testing.
- **`src-tauri/src/storage/`**: Atomic JSON persistence under `%APPDATA%\com.stealth.desktop\`.
- **`src-tauri/tauri.conf.json`**: Configures the `launcher` window and the frameless, transparent, `alwaysOnTop`, `skipTaskbar` `prompter` window.

---

## Keyboard Shortcuts

Global hotkeys are handled via `tauri-plugin-global-shortcut` without stealing focus from your foreground app:

| Shortcut | Action | Scope |
|---|---|---|
| `Alt + Space` | Toggle Play / Pause | System-wide Global |
| `Alt + Up` | Increase Scroll Speed | System-wide Global |
| `Alt + Down` | Decrease Scroll Speed | System-wide Global |
| `Alt + H` | Toggle Overlay / Panic Hide | System-wide Global |
| `Alt + R` | Rewind / Reset to Top | HUD / Launcher |
| `Alt + M` | Toggle Mirror Mode (Horizontal Flip) | Prompter HUD |
| `Alt + C` | Toggle Click-Through Mode | Prompter HUD |
| `Ctrl + +` / `Ctrl + -` | Increase / Decrease Font Size | Launcher / HUD |

*All global shortcuts can be customized in Launcher Settings.*

---

## Verification & Testing

### Automated Invisibility Canary Probe
`scripts/verify_invisibility.ps1` verifies OS-level capture exclusion at the pixel level by opening a solid `#FF00FF` canary overlay with `WDA_EXCLUDEFROMCAPTURE` enabled, capturing the desktop, and asserting **0 canary pixels** appear in the capture buffer.

### OBS Studio Manual Check
1. Launch **Stealth** and start the Prompter HUD over a high-contrast desktop background.
2. Open **OBS Studio** and add a **Display Capture** source.
3. Confirm in the OBS preview and test recording that the desktop is visible while the Prompter HUD is completely absent.

See [scripts/obs_verification_guide.md](scripts/obs_verification_guide.md) for the full step-by-step checklist.

### Running Tests
```bash
# Rust unit tests & clippy
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings

# E2E test suite
./tests/e2e/runner/run_all.ps1
```

---

## Installation & Building

### Prerequisites
- **OS**: Windows 10 Version 2004 (Build 19041) or Windows 11 (64-bit)
- **Rust**: `stable-x86_64-pc-windows-msvc` (1.75+)
- **Node.js**: 20.x+ with `pnpm`
- **Build Tools**: Visual Studio C++ Build Tools + WebView2 Runtime

### Setup & Run
```bash
git clone https://github.com/getstealth/stealth.git
cd stealth
pnpm install

# Development
pnpm tauri dev

# Release build (executable + NSIS / MSI installers)
pnpm tauri build
```

Generated artifacts are output under `src-tauri/target/release/`:
- `stealth.exe` (Standalone binary)
- `bundle/nsis/` (`.exe` installer)
- `bundle/msi/` (`.msi` installer)

---

## Directory Layout

```
.
├── .github/
│   ├── ISSUE_TEMPLATE/        # Bug report & feature request templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/release.yml  # Automated release CI/CD pipeline
├── assets/
│   ├── stealth-banner.png     # README hero banner
│   └── stealth-icon.svg       # Application icon
├── scripts/
│   ├── benchmark_resources.ps1
│   ├── obs_verification_guide.md
│   └── verify_invisibility.ps1
├── src/                       # SolidJS frontend (Launcher & HUD)
├── src-tauri/                 # Rust backend (Tauri 2 + Win32 DWM)
├── tests/                     # E2E & boundary test suite
├── LICENSE                    # MIT License
└── README.md
```

---

## License

Released under the **[MIT License](LICENSE)**.
