---
title: Master Project Index
tags:
  - project/index
  - teleprompter
  - open-source
  - clean-room
  - tauri2
  - rust
created: 2026-11-22
updated: 2026-11-23
status: completed
---

# 🚀 Teleprompter Invisible (Open Source) — Master Vault Index

Bienvenido al mapa central del proyecto. Este vault documenta la concepción, ingeniería inversa ética (clean-room), arquitectura de sistemas, diseño visual, implementación en **Tauri 2 + Rust**, pruebas automatizadas de invisibilidad y producción audiovisual de lanzamiento en 3D.

---

## 🛡️ Principio Fundamental: Clean-Room Engineering
Este proyecto se construye bajo un protocolo riguroso de **ingeniería limpia (Clean-Room)**:
- **Cero código o activos copiados**: Ningún archivo, script, estilo ni recurso gráfico de FlowPrompter u otra aplicación privativa se integra en el repositorio.
- **Cuarentena estricta**: Todo archivo legado de análisis (`temp_analysis/`, `package.legacy.json`) permanece aislado y excluido del control de versiones mediante `.gitignore`.
- **Diseño basado en especificación**: Toda la lógica se diseña a partir de APIs públicas documentadas del sistema operativo (Win32 DWM `SetWindowDisplayAffinity`) y estándares abiertos.

---

## 🗺️ Mapa de Navegación del Vault

### 01. Análisis & Requisitos Clean-Room
- [[01-Analisis/Clean-Room-Analysis|Clean-Room Analysis]]: Requisitos funcionales del teleprompter invisible, protocolo de aislamiento "Chinese Wall", mecánica técnica de `WDA_EXCLUDEFROMCAPTURE` (Win32 DWM) y contraste de arquitectura frente a Electron.
- [[01-Analisis/OBS-Verification|Verificación en OBS y Videoconferencias]]: Análisis técnico exhaustivo de exclusión de captura DWM en OBS Studio, Microsoft Teams, Zoom, Google Meet y Discord.
- [[01-Analisis/FlowPrompter-hallazgos|FlowPrompter Hallazgos (Archivado)]]: Registro preliminar de relevamiento funcional y redirección clean-room.

### 02. Naming & Identidad de Marca
- [[02-Naming/Candidate-Names|Candidate Names Matrix]]: Auditoría exhaustiva de 10 nombres candidatos con verificación automatizada en GitHub, Twitter/X, Crates.io y npm. Incluye análisis de colisiones y recomendación del Top 3 (`VeilCue`, `StealthPrompter`, `InvisiCue`).
- [[02-Naming/Candidatos|Candidatos (Redirección)]]: Enlace de compatibilidad hacia la matriz de candidatos.
- [[02-Naming/Decision|Decisión Final de Nombre]]: Registro de la elección del usuario, tagline oficial, valores de marca y assets de identidad.

### 03. Arquitectura de Software
- [[03-Arquitectura/ADR-001-Stack-Tauri2-Rust|ADR-001: Selección de Stack Tauri 2 + Rust + SolidJS]]: Justificación arquitectónica de rendimiento: <20MB RAM, <10MB instalador, bindings Win32 nativos sin sobrecarga de V8/Chromium.
- [[03-Arquitectura/ADR-002-Window-Capture-Exclusion|ADR-002: Exclusión de Captura Win32]]: Definición del trait `WindowPlatform`, constante `WDA_EXCLUDEFROMCAPTURE` (`0x11`) y fallbacks en runtime.
- [[03-Arquitectura/ADR-003-Licencia|ADR-003: Licencia MIT]]: Filosofía open source permisiva y gobernanza del proyecto.
- [[03-Arquitectura/ADR-004-Seguridad-Capabilities|ADR-004: Capabilities y CSP Tauri 2]]: Sandbox estricto, política zero-telemetry y aislamiento local.

### 04. Sistema de Diseño & UX
- [[04-Diseno/Design-System|Design System]]: Paleta glassmorphism oscuro, tipografía variable mono/sans, tokens visuales y microinteracciones fluidas.
- [[04-Diseno/Launcher-UX|Launcher UX]]: Ventana de administración, editor de guiones, atajos de teclado y persistencia local JSON.
- [[04-Diseno/Prompter-HUD|Prompter HUD]]: HUD transparente, auto-scroll a 144Hz, control de velocidad en WPM/px, guía visual y modo click-through.

### 05. Marketing & Lanzamiento
- [[05-Marketing/Copy-Twitter-X|Hilo de Lanzamiento X/Twitter]]: Hilo técnico viral de anuncio con hook, comparativa de recursos y demo visual.
- [[05-Marketing/Show-HN-Reddit|Show HN & Comunidades]]: Copy y estrategia de distribución técnica para Hacker News, r/rust, r/opensource y Product Hunt.
- [[05-Marketing/Etica-Uso-Responsable|Uso Responsable]]: Posicionamiento ético del producto para creadores, oradores y desarrolladores.

### 06. Video 3D & Media (Remotion)
- [[06-Video/Storyboard-3D|Storyboard Video 3D]]: Guion técnico y desglose de las 4 escenas 3D configuradas en Remotion 4.x + `@remotion/three`.
- [[06-Video/Assets-Audio|Assets & Render]]: Especificaciones de composición 1080p horizontal, 9:16 vertical, paleta de iluminación y render final.

---

## 📌 Bitácora de Progreso y Registro de Decisiones
- [[Log|Bitácora Diaria de Trabajo (Log.md)]]: Registro cronológico detallado de hitos, análisis, decisiones de diseño y resultados de verificación.

---

## 📊 Matriz de Trazabilidad de Requisitos (Milestones M1-M5)

| Hito | Requisito Principal | Documento Clave en Vault | Estado |
|---|---|---|---|
| **M1** | Clean-Room Vault, Naming & Entorno | `[[00-Index]]`, `[[Log]]`, `[[01-Analisis/Clean-Room-Analysis]]`, `[[02-Naming/Candidate-Names]]` | **COMPLETADO (Gate PASS)** |
| **M2** | Core Rust & `WindowPlatform` Trait | `[[03-Arquitectura/ADR-001-Stack-Tauri2-Rust]]`, `[[03-Arquitectura/ADR-002-Window-Capture-Exclusion]]` | **COMPLETADO (Gate PASS)** |
| **M3** | Tauri 2 Multi-Ventana & HUD Prompter | `[[04-Diseno/Launcher-UX]]`, `[[04-Diseno/Prompter-HUD]]` | **COMPLETADO (Gate PASS)** |
| **M4** | Suite de Verificación de Invisibilidad | `[[01-Analisis/OBS-Verification]]`, scripts de verificación y benchmarks | **COMPLETADO (Gate PASS)** |
| **M5** | Video 3D Remotion, Binario Release & CI/CD | `[[05-Marketing/Copy-Twitter-X]]`, `[[06-Video/Storyboard-3D]]`, `[[Log]]` | **COMPLETADO (Gate PASS)** |
