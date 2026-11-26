<p align="center">
  <img src="assets/stealth-banner.png" alt="Stealth" width="100%" />
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows_10_%2F_11-0078D6.svg" alt="Windows 10 / 11" />
  <img src="https://img.shields.io/badge/Languages-English_%7C_Espa%C3%B1ol-7c6cff.svg" alt="English and Spanish" />
</p>

<p align="center">
  <strong>An invisible teleprompter for Windows that stays hidden during screen shares and recordings.</strong><br />
  Read your script naturally while looking at the camera — your audience only sees your screen, never your notes.
</p>

---

## Features

- **Invisible on Screen Shares & Recordings**: Hidden automatically in **Zoom**, **Microsoft Teams**, **Google Meet**, **OBS Studio**, **Discord**, and **Loom** (Windows 10 2004+ and Windows 11).
- **Smooth Auto-Scroll**: Adjust reading speed, font size, and background opacity so your script stays easy to read over any app.
- **Stay in Your Presentation**: Control play, pause, speed, and visibility with global hotkeys without clicking away from your slides or code.
- **Move Anywhere**: Drag the floating prompter from the top handle or the bottom control bar.
- **Mirror Mode**: Flip text horizontally if you use a physical glass teleprompter rig.
- **Click-Through Mode**: Let mouse clicks pass straight through the prompter to the windows behind it.
- **English & Español**: Switch between English and Spanish right from the app.
- **Private & Offline**: No accounts, no subscriptions, no internet connection required. All scripts stay on your computer.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Space` | Play / Pause |
| `Alt + Up` | Speed Up |
| `Alt + Down` | Slow Down |
| `Alt + H` | Show / Hide Prompter |
| `Alt + R` | Reset to Beginning |
| `Alt + M` | Toggle Mirror Mode |
| `Alt + C` | Toggle Click-Through |
| `Ctrl + +` / `Ctrl + -` | Increase / Decrease Font Size |

*You can customize shortcuts anytime in **Settings**.*

---

## Getting Started

### Option 1: Download the App
Download the latest Windows installer (`.exe` or `.msi`) from the [Releases](https://github.com/notsagxyz/Stealth-Prompter/releases) page, install it, and launch **Stealth**.

### Option 2: Build from Source
Requires **Windows 10/11**, **Node.js 20+**, **pnpm**, and **Rust**.

```bash
git clone https://github.com/notsagxyz/Stealth-Prompter.git
cd Stealth-Prompter
pnpm install
pnpm tauri build
```

---

## License

**[MIT License](LICENSE)**
