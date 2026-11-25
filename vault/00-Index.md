---
title: Master Project Index — Stealth (Stealth Prompter)
tags:
  - project/index
  - teleprompter
  - open-source
  - clean-room
  - tauri2
  - rust
  - stealth
created: 2026-11-22
updated: 2026-11-25
status: active
---

# 🚀 Stealth (Stealth Prompter) — Master Vault Index

Bienvenido al mapa central de **Stealth** (comercializado públicamente como **Stealth Prompter**). Este vault documenta la concepción clean-room, estudio de naming, arquitectura en **Tauri 2 + Rust + SolidJS**, sistema de diseño *dark glass*, estrategia de lanzamiento y producción del video de release en 3D.

---

## 🛡️ Principio Fundamental: Clean-Room Engineering
Este proyecto se construye bajo un protocolo riguroso de **ingeniería limpia (Clean-Room)**:
- **Cero código o activos copiados**: Ningún archivo, script, estilo ni recurso gráfico de FlowPrompter u otra aplicación privativa o imagen de referencia se integra en el repositorio.
- **Cuarentena estricta**: Todo archivo legado de análisis (`temp_analysis/`, `package.legacy.json`) permanece aislado y excluido del control de versiones mediante `.gitignore`.
- **Diseño basado en especificación**: Toda la lógica se diseña a partir de APIs públicas documentadas del sistema operativo (Win32 DWM `SetWindowDisplayAffinity`) y estándares abiertos.

---

## 🗺️ Mapa de Navegación del Vault

### 01. Análisis & Requisitos Clean-Room
- [[01-Analisis/Clean-Room-Analysis|Clean-Room Analysis]]: Requisitos funcionales del teleprompter invisible, protocolo de aislamiento "Chinese Wall", mecánica técnica de `WDA_EXCLUDEFROMCAPTURE` (Win32 DWM) y contraste de arquitectura frente a Electron.
- [[01-Analisis/OBS-Verification|Verificación en OBS y Videoconferencias]]: Análisis técnico exhaustivo de exclusión de captura DWM en OBS Studio, Microsoft Teams, Zoom, Google Meet y Discord.
- [[01-Analisis/FlowPrompter-hallazgos|Relevamiento Preliminar (Archivado)]]: Registro histórico de requisitos funcionales bajo aislamiento clean-room.

### 02. Naming & Identidad de Marca
- [[02-Naming/Candidate-Names|Candidate Names Matrix]]: Auditoría exhaustiva de candidatos y verificación en vivo multiplataforma (`2026-11-25T23:11:10Z`) en GitHub, X/Twitter, Crates.io, npm y dominios `.com/.dev/.app/.io` para el slug `stealthprompter`.
- [[02-Naming/Candidatos|Candidatos (Redirección)]]: Enlace de compatibilidad hacia la matriz de candidatos.
- [[02-Naming/Decision|Decisión Final de Marca (Stealth / Stealth Prompter)]]: Reglas R4 de marca dual (`Stealth` en app / `Stealth Prompter` comercial), slug `stealthprompter`, identificador `com.stealth.desktop` y alineación visual.

### 03. Arquitectura de Software
- [[03-Arquitectura/ADR-001-Stack-Tauri2-Rust|ADR-001: Selección de Stack Tauri 2 + Rust + SolidJS]]: Justificación arquitectónica de rendimiento, `WindowPlatform` trait con `WDA_EXCLUDEFROMCAPTURE` (`0x11`), almacenamiento atómico en `%APPDATA%\com.stealth.desktop\` y sandbox Tauri 2.

### 04. Sistema de Diseño & UX
- [[04-Diseno/Design-System|Design System & Tokens CSS]]: Paleta dark glass (`#0b0b12`), 13 tokens `:root`, 6 acentos configurables (Violet `#7c6cff` por defecto), fuentes locales `@fontsource`, foco visible, `prefers-reduced-motion` y matriz AA.
- [[04-Diseno/Referencias-Visuales|Análisis de Referencias Visuales]]: Extracción de lenguaje visual (resplandores radiales, star-dots, tarjetas glass, barrita vertical, badge `+`, escena 3D metálica) y límites clean-room.
- [[04-Diseno/Launcher-UX|Launcher & Settings UX]]: Ventana centrada frameless sin botón `"Show HUD"`, lista de guiones recientes y panel Settings en 4 tarjetas (`Prompter`, `Shortcuts`, `Appearance`, `About`).
- [[04-Diseno/Prompter-HUD|Prompter HUD & Control Bar]]: Opacidad solo del fondo (`10%–100%`), scroll manual (rueda/touchpad/arrastre) con pausa y reanudación suave, barra flotante en píldora colapsable y atajos globales en click-through.

### 05. Marketing & Lanzamiento
- [[05-Marketing/Copy-Twitter-X|Hilo de Lanzamiento X/Twitter]]: Hilo técnico de anuncio para **Stealth Prompter** (`@stealthprompter`).
- [[05-Marketing/Show-HN-Reddit|Show HN, Reddit & Product Hunt]]: Copy y posicionamiento ético/técnico para Hacker News, `r/rust`, `r/opensource` y Product Hunt.

### 06. Video 3D & Media (Remotion / HyperFrames)
- [[06-Video/Storyboard-3D|Storyboard Video 3D]]: Guion técnico, escena en marco metálico flotante con luz vertical y reflejos en piso, renders 1080p60, 9:16 y GIF.
- [[06-Video/Storyboard|Storyboard (Copia de Referencia)]]: Versión espejo histórica del guion audiovisual.

---

## 📌 Bitácora de Progreso y Registro de Decisiones
- [[Log|Bitácora Diaria de Trabajo (Log.md)]]: Registro cronológico de hitos, decisiones de diseño, migraciones y resultados de verificación.

---

## 📊 Hoja de Ruta (Milestones M1–M7)

| Hito | Nombre | Alcance Principal | Documentos Clave | Estado |
|---|---|---|---|---|
| **M1** | `M1-Naming-Deps-DesignDocs` | Capturas *before*, deps/skills, specs `04-Diseno/`, estudio `02-Naming/`, renombre R4 a `Stealth`/`Stealth Prompter`, migración `%APPDATA%` y fixes base | `[[00-Index]]`, `[[04-Diseno/Design-System]]`, `[[02-Naming/Decision]]`, `[[Log]]` | **EN PROGRESO** |
| **M2** | `M2-ScrollEngine-Backend-Shortcuts` | Modelo `Settings` (`accent_color`, opacidad `0.1..1.0`), atajos globales de scroll/opacidad en click-through y `ScrollEngine.ts` con reanudación suave | `[[04-Diseno/Prompter-HUD]]` | **PLANIFICADO** |
| **M3** | `M3-Prompter-HUD-Controls` | HUD con opacidad solo de fondo (`10%–100%`), scroll manual por puntero, barra flotante en píldora colapsable y píldora Play persistente | `[[04-Diseno/Prompter-HUD]]` | **PLANIFICADO** |
| **M4** | `M4-Launcher-Settings-Redesign` | Eliminación de `"Show HUD"`, rediseño glass del Launcher y Settings (4 secciones, 6 acentos, fuentes locales), capturas *after* | `[[04-Diseno/Launcher-UX]]`, `[[04-Diseno/Design-System]]` | **PLANIFICADO** |
| **M5** | `M5-Ninja-Icon-Brand-Assets` | 3 conceptos SVG ninja/sigilo, SVG maestro exportado con `pnpm tauri icon`, favicons, social preview `1280×640` y README | `[[02-Naming/Decision]]` | **PLANIFICADO** |
| **M6** | `M6-Release-Video` | Evaluación HyperFrames vs Remotion en `06-Video/`, render 1080p60 MP4, 9:16 vertical MP4 y GIF para README | `[[06-Video/Storyboard-3D]]`, `[[04-Diseno/Referencias-Visuales]]` | **PLANIFICADO** |
| **M7** | `M7-Final-E2E-And-Release` | Suite E2E Tiers 1–5 (`TEST_READY.md`), `clippy`, `tauri build` `.exe`, verificación `WDA_EXCLUDEFROMCAPTURE` + guía OBS/Game Bar | `[[01-Analisis/OBS-Verification]]`, `[[Log]]` | **PLANIFICADO** |
