---
title: Storyboard y Guion Técnico Video 3D de Lanzamiento — Stealth Prompter
tags:
  - video
  - 3d
  - remotion
  - stealth
created: 2026-11-22
updated: 2026-11-25
status: completed
---

# 🎬 Storyboard y Guion Técnico: Stealth Prompter (60 fps)

Video de lanzamiento oficial para **Stealth Prompter** (app **Stealth**), producido en **Remotion 4.x + `@remotion/three`** tomando como guía de ambiente y composición un **marco metálico redondeado flotando sobre fondo oscuro con luz dramática rojo sigilo (`#f43f5e`) y acento violeta (`#7c6cff`) con reflejos en el piso**.

## 1. Especificaciones de Renderizado

| Parámetro | Horizontal (Master) | Vertical (Reels / Shorts / X) | GIF README |
|---|---|---|---|
| **Composición ID** | `LaunchVideo` | `LaunchVideoVertical` | Derivado de `launch.mp4` |
| **Resolución** | `1920 x 1080` (16:9) | `1080 x 1920` (9:16) | `720 x 405` |
| **Tasa de Cuadros** | `60 fps` | `60 fps` | `15 fps` (palettegen/paletteuse) |
| **Duración** | `720 frames` (12.0 s) | `720 frames` (12.0 s) | `4.5 s` (clip clave de invisibilidad) |
| **Paleta** | `#0b0b12` (Bg), `#7c6cff` (Violet), `#f43f5e` (Stealth Red), `#f4f4f8` (Text) | Misma paleta | Misma paleta |

## 2. Escenas Deterministas

1. **Escena 1 (`0–180` / 0–3.0s):** *The Screen-Share Dilemma* — Ventanas desordenadas distraen al presentador y rompen el contacto visual.
2. **Escena 2 (`175–370` / 2.9–6.1s):** *The Stealth Disappearance* — La app **Stealth** flota dentro del marco metálico redondeado con luz roja/violeta y reflejos en el piso; split-screen mostrando que en tu pantalla ves el guion y en la pantalla compartida **desaparece por completo** (`WDA_EXCLUDEFROMCAPTURE`).
3. **Escena 3 (`365–550` / 6.1–9.1s):** *Zero Bloat, Total Control* — Scroll manual fluido, opacidad de fondo 10%–100%, barra flotante minimalista y <40 MB RAM en Rust + Tauri 2.
4. **Escena 4 (`545–720` / 9.1–12.0s):** *Stealth Prompter* — Icono ninja shuriken-play, marca **Stealth Prompter** y CTA open source `github.com/getstealth/stealth`.
