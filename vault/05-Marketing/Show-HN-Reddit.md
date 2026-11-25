---
title: Textos de Lanzamiento para Show HN, Reddit y Product Hunt
tags:
  - marketing
  - hackernews
  - reddit
  - producthunt
created: 2026-11-23
updated: 2026-11-23
---

# 🌐 Textos de Lanzamiento en Comunidades

---

## 1. Hacker News ("Show HN")

**Title:**
> Show HN: Stealth Prompter – Open-source invisible teleprompter in Tauri 2 and Rust

**Body:**
> Hi HN!
>
> I frequently present on video calls and record tutorials, but traditional teleprompter apps either require bulky hardware glass rigs or show up awkwardly whenever you share your screen on Zoom, Google Meet, or Microsoft Teams. Existing desktop tools in this niche are closed-source, full of analytics trackers, and bundle heavy 200MB+ Electron runtimes.
>
> I built **Stealth Prompter**: an open-source, lightweight desktop teleprompter built with **Tauri 2, Rust, and SolidJS**.
>
> **The core feature:**
> On Windows, it leverages `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` (`0x11`). When screen-sharing software (Zoom, Teams, Meet, Discord) or recording software (OBS, Xbox Game Bar) captures your monitor, the DWM excludes the teleprompter window entirely. You see the script floating near your webcam for natural eye contact, while your audience sees only the clean desktop or presentation behind it.
>
> **Key Architecture & Benchmarks:**
> - **RAM in Idle:** 38.4 MB (compared to ~180 MB on Electron).
> - **CPU during 144Hz scroll:** 1.6% (compared to ~12% on Electron).
> - **Focus handling:** Configured with `WS_EX_NOACTIVATE` and `SW_SHOWNOACTIVATE` so global shortcuts control scroll speed and playback without stealing keyboard focus from your slides or code editor.
> - **Local-first & Zero-telemetry:** Scripts and settings are stored atomically in local JSON. No telemetry, no cloud accounts, strict CSP.
>
> Repo: https://github.com/stealthprompter/stealthprompter
>
> I'd love to hear your feedback, bug reports, and thoughts on extending the platform abstraction for macOS (`NSWindow.sharingType = .none`) and Linux Wayland!

---

## 2. Reddit

### r/rust
**Title:**
> [Media] I built Stealth Prompter: An open-source desktop teleprompter in Tauri 2 + Rust that stays invisible during screen shares and OBS recordings

**Post:**
> Hey r/rust!
> 
> I wanted to share a project I've been building: **Stealth Prompter**. It's an open-source desktop teleprompter written in Tauri 2 and Rust with a SolidJS frontend.
> 
> The killer feature is screen share invisibility. On Windows, it binds to Win32 `SetWindowDisplayAffinity(hwnd, 0x11)` (`WDA_EXCLUDEFROMCAPTURE`). It renders a glassmorphic floating HUD overlay near your camera so you can maintain direct eye contact while reading, but it is 100% excluded from window/monitor captures in OBS, Zoom, Teams, Meet, and Discord.
>
> **Rust architectural highlights:**
> - Modular `WindowPlatform` trait decoupling OS window affinity and display metrics from frontend events, with a complete mock platform for headless CI.
> - Atomic file-swapping persistence engine for scripts and settings with non-UTF8 lossy decoding and DOS device name sanitization.
> - Non-invasive global shortcuts using `tauri-plugin-global-shortcut` that don't trigger foreground focus switches.
> - Idle RAM footprint: **38.4 MB**. CPU usage during 144Hz rAF scroll: **1.6%**.
>
> GitHub: https://github.com/stealthprompter/stealthprompter
> Feedback and PRs welcome!

---

### r/opensource & r/SideProject
**Title:**
> Stealth Prompter: An open-source teleprompter that disappears from screen shares and recordings (Tauri 2 + Rust)

**Post:**
> Hey everyone!
> 
> If you've ever had to give a presentation on Zoom/Teams or record a tutorial with OBS, you know the struggle: you want to look at your notes or script, but you don't want the prompt window to be recorded or seen by your audience.
>
> Most commercial alternatives charge monthly subscriptions and take hundreds of megabytes of RAM.
>
> **Stealth Prompter** is completely free, open-source (MIT), and takes less than 40MB of RAM:
> - 👻 **Invisible to Audience:** You see your script; screen shares and recordings see right through it.
> - ⌨️ **No-Focus Shortcuts:** Play, pause, adjust speed, and rewind without clicking away from your presentation.
> - 🖱️ **Click-Through Mode:** Click and interact with apps underneath your script.
> - 🔒 **100% Private:** Zero telemetry, no cloud accounts, local JSON storage.
>
> Project link: https://github.com/stealthprompter/stealthprompter
> Let me know what you think!

---

## 3. Product Hunt

**Name:** Stealth Prompter  
**Tagline:** Open-source invisible teleprompter for video calls and recordings  
**Category:** Developer Tools, Open Source, Productivity, Remote Work  

**Short Description:**
> Stealth Prompter is a fast, lightweight open-source teleprompter built with Tauri 2 and Rust. It stays visible to you near your webcam for natural eye contact, but is 100% invisible to screen sharing and recordings on Zoom, Google Meet, Teams, and OBS.

**Maker Comment:**
> Hey Product Hunt community! 👋
> 
> We built Stealth Prompter because remote presentations and tutorial recordings shouldn't require clunky $300 teleprompter glass rigs or resource-hogging Electron apps.
> 
> By utilizing low-level OS display affinity (`WDA_EXCLUDEFROMCAPTURE`), Stealth Prompter renders your script right near your lens while remaining completely invisible to anyone watching your screen share or recording.
>
> It's 100% open-source, local-first, privacy-respecting, and takes less than 40MB of RAM.
> 
> We'd love your feedback!
