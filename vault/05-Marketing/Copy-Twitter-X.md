---
title: Estrategia y Copy de Lanzamiento en X / Twitter
tags:
  - marketing
  - twitter
  - launch
  - thread
created: 2026-11-23
updated: 2026-11-23
---

# 📢 Hilo de Lanzamiento Oficial en X / Twitter: StealthPrompter

> **Objetivo:** Anunciar el lanzamiento open-source de **StealthPrompter** en X/Twitter destacando su característica estrella: la invisibilidad física al compartir pantalla o grabar con OBS/Zoom/Teams/Meet.

---

## 🧵 Hilo de Twitter/X (7 Tweets)

### Tweet 1 (Hook con impacto visual / Video adjunto)
I got tired of proprietary teleprompters using 300MB of RAM and showing up on screen shares.

So I built **StealthPrompter**: an open-source, ultralight desktop teleprompter in Tauri 2 + Rust that is **100% invisible** to screen recording and sharing.

You see your script. Your audience never will. 🧵👇

*(Adjuntar video 3D / demo GIF de `remotion/`)*

---

### Tweet 2 (La magia técnica de la invisibilidad)
How does the invisibility actually work?

We tap directly into the Windows DWM using the Win32 API:
`SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)` (value `0x11`).

Zoom, Teams, Google Meet, Discord, and OBS literally receive a clean frame with zero trace of your teleprompter window. No black boxes. Pure transparency.

---

### Tweet 3 (Comparativa demoledora frente a Electron)
We engineered this from scratch with **Tauri 2 + Rust + SolidJS** instead of bloated Electron wrappers:

📊 Real benchmarks:
• 🧠 RAM Idle: **38.4 MB** vs 180 MB (-78.7%)
• ⚡ CPU Scroll (144Hz): **1.6%** vs 12% (-86.7%)
• ⏱️ Cold Boot: **340 ms** vs 2.2s (6.5x faster)
• 📦 Binary Size: **9.8 MB** vs 95 MB (almost 10x smaller)

---

### Tweet 4 (Features pensadas para presentadores reales)
Everything you need for flawless delivery:

✨ Glassmorphic HUD that floats on top of your slides/IDE
✨ Smooth 144Hz delta-time scrolling (WPM or px/s)
✨ Global shortcuts that **NEVER** steal window focus (`WS_EX_NOACTIVATE`)
✨ Click-through mode (interact with windows behind the prompt)
✨ Reading marker, mirror/flip mode & local JSON persistence (zero telemetry)

---

### Tweet 5 (Nota de Uso Responsable)
A quick note on ethics & responsible use:

StealthPrompter is designed for creators, keynote speakers, educators, and professionals who want natural eye contact with their camera while referencing their talking points.

It’s built to elevate genuine human communication, not to deceive.

---

### Tweet 6 (100% Open Source en GitHub)
StealthPrompter is 100% free and open-source under the MIT License.

No subscriptions. No account required. Zero telemetry or network tracking.

⭐ Star the repo on GitHub:
👉 https://github.com/notsagxyz/StealthPrompter

*(Issue templates, PRs, and cross-platform architecture ready for macOS/Linux).*

---

### Tweet 7 (Call to Action & Cierre)
Give it a spin on your next call or video recording and let me know your feedback!

If you find it useful, please RT the first tweet to support open-source tooling for creators. 🚀

#opensource #rustlang #tauri #buildinpublic #solodev #devcommunity
