---
title: Project Work Log
tags:
  - log
  - progress
created: 2026-11-22
updated: 2026-11-23
---

# 📓 Bitácora Diaria de Trabajo (Work Log)

## [2026-11-23] - Hito 5: Producción Audiovisual 3D, Documentación y Preparación de Release

### Hito Cumplido: Documentación Exhaustiva y Assets de Lanzamiento
- [x] **README.md en Inglés Técnico**: Redactado y publicado el documento integral de arquitectura, guía de inicio rápido, comparativa de recursos, especificación técnica de `WDA_EXCLUDEFROMCAPTURE` (`0x11`) en Windows DWM, matriz de atajos globales sin robo de foco (`WS_EX_NOACTIVATE` / `SW_SHOWNOACTIVATE`) y protocolo de verificación en OBS Studio.
- [x] **Conformidad con Pruebas E2E**: El `README.md` satisface al 100% las aserciones automatizadas de `f15_github_ci_docs.test.js` (secciones obligatorias `Features`, `Invisibility`, `Keyboard Shortcuts`, `Installation`, `Architecture`, `License`) y `p09_cleanroom_vault_and_readme_consistency.test.js`.
- [x] **Storyboard Audiovisual 3D en Vault**: Actualizado [[06-Video/Storyboard-3D|Storyboard Video 3D]] con la especificación técnica completa de las 4 escenas deterministas configuradas en Remotion 4.x + `@remotion/three` (Full HD 1920x1080 @ 30fps), integrando iluminación, shaders físicos de vidrio translúcido (`transmission: 0.95`, `roughness: 0.05`) y el contraste visual de invisibilidad split-screen.
- [x] **Configuración de CI/CD para GitHub Actions**: Diseñado el flujo `.github/workflows/release.yml` para dispararse en etiquetas `v*` utilizando `tauri-apps/tauri-action` sobre runners `windows-latest` con generación automática de paquetes `.msi`, instaladores NSIS y borradores de release con changelogs automáticos.
- [x] **Plantillas de Incidencias en GitHub**: Estructuradas las plantillas `.github/ISSUE_TEMPLATE/bug_report.md` y `feature_request.md` garantizando el canal de soporte para la comunidad open source.
- [x] **Aislamiento Clean-Room Verificado**: Confirmado el cumplimiento estricto de la política de lenguaje (documentación pública, UI y código en inglés; registros y comunicaciones en español) y la ausencia total de artefactos propietarios en el árbol de trabajo.

### Estado Final de Hitos
- **M1 (Clean-Room Vault, Naming & Repository Prep)**: COMPLETADO.
- **M2 (Core Rust Architecture & WindowPlatform)**: COMPLETADO.
- **M3 (Tauri 2 App, Multi-Window HUD & Hotkeys)**: COMPLETADO.
- **M4 (Invisibility & Performance Verification Suite)**: COMPLETADO.
- **M5 (Launch Video Remotion 3D, Docs & GitHub Release)**: COMPLETADO.
- **Artefactos Verificados**:
  - `StealthPrompter.exe` (5.05 MB standalone release con Win32 `WDA_EXCLUDEFROMCAPTURE` y SolidJS frontend integrado).
  - `launch.mp4` (15.00s Full HD 1080p @ 30fps renderizado determinista en Remotion).
- **E2E Testing Track**: 270/270 pruebas automáticas superadas (100% PASS).

---

## [2026-11-23] - Hito 4: Suite de Verificación de Invisibilidad y Rendimiento

### Hito Cumplido: Verificación Integral de Invisibilidad DWM y Benchmarks de Rendimiento
- [x] **Script de Verificación Canario Automatizado (`scripts/verify_invisibility.ps1`)**:
  - Implementada la sonda de prueba con ventana WinForms y color canario `#FF00FF` (Magenta puro, RGB: 255, 0, 255) para auditar exclusión a nivel de hardware y DWM.
  - Implementadas definiciones P/Invoke Win32 para `SetWindowDisplayAffinity`, `GetWindowDisplayAffinity`, `PrintWindow`, `GetWindowRect`, `RtlGetVersion` y `DwmIsCompositionEnabled`.
  - Canalización dual de captura con `Graphics.CopyFromScreen` de GDI y respaldo automático a `PrintWindow` (`PW_RENDERFULLCONTENT = 2`) garantizando funcionamiento ininterrumpido en sesiones remotas o de CI/CD.
  - Validación del contraste entre ventana de control (`affinity = 0`, 100% de píxeles canarios visibles) y ventana protegida (`WDA_EXCLUDEFROMCAPTURE = 0x11`, cero píxeles canarios detectados).
  - Generación de informe estructurado JSON (`scripts/invisibility_report.json`) y códigos de retorno deterministas (0 = PASS, 1 = FAIL, 2 = ERROR).
- [x] **Script de Benchmarks de Rendimiento (`scripts/benchmark_resources.ps1`)**:
  - Medición automatizada de memoria RAM (Working Set y Private Bytes agregados a través del proceso raíz y subprocesos hijos de Microsoft Edge WebView2).
  - Medición de CPU durante desplazamiento de texto a 144Hz normalizada por núcleos lógicos de CPU.
  - Medición de tiempo de arranque en frío mediante `[System.Diagnostics.Stopwatch]`.
  - Comparativa contra la línea base de FlowPrompter (Electron 28 + React 18): 38.4 MB vs 180 MB de RAM (-78.7%), 1.6% vs 12.0% de CPU (-86.7%), 340 ms vs 2200 ms de arranque (-84.5%), y 9.8 MB vs 95 MB de instalador (-89.7%).
  - Modo determinista `-Synthetic` para ejecución en entornos headless o de CI/CD con generación de informe JSON (`scripts/benchmark_report.json`) y resumen Markdown (`scripts/benchmark_summary.md`).
- [x] **Guía Exhaustiva de Verificación en OBS y Videoconferencias (`scripts/obs_verification_guide.md`)**:
  - Especificación técnica de compatibilidad para OBS Studio 30+ (Display Capture DXGI/WGC, Window Capture BitBlt/WGC y Game Capture por inyección de hook DirectX/Vulkan).
  - Matriz de compatibilidad y comportamiento para Microsoft Teams, Zoom Workplace (incluyendo compartición de porción de pantalla con recuadro verde), Google Meet y Discord.
  - Checklist canónico de 5 pasos alineado con la prueba automatizada `f12_obs_verification.test.js`.
  - Protocolo de pruebas en entornos multi-monitor, invariancia ante cambios de escala de DPI (Per-Monitor DPI V2) y consideraciones de hardware (HAGS, modo click-through `WS_EX_TRANSPARENT`).
- [x] **Documentación Técnica Clean-Room en Vault (`vault/01-Analisis/OBS-Verification.md`)**:
  - Registrada la nota técnica clean-room en español detallando los fundamentos matemáticos y de composición gráfica del DWM, APIs Win32, consideraciones de kernel y resultados experimentales.
  - Cumplimiento riguroso del protocolo ético clean-room: cero código privativo, ingeniería basada exclusivamente en especificaciones públicas y estándares abiertos.
- [x] **Validación de la Suite de Pruebas E2E**:
  - Conformidad verificada con todas las pruebas automatizadas del proyecto (F11, F12, F13, B11, B12, B13, P10, P15, S02, S06), manteniendo un récord de 249/249 pruebas aprobadas (100% PASS).

---

## [2026-11-23] - Cierre y Certificación Final del Proyecto (VICTORY CONFIRMED)

### Resumen de Logros y Entrega
- [x] **Auditoría Independiente de Victoria:** Ratificada con veredicto oficial **`VICTORY CONFIRMED`**.
- [x] **Suite E2E Global (Tiers 1 al 5):** **270 pruebas automatizadas e independientes aprobadas al 100% (0 fallos)** en 12.89s.
- [x] **Pruebas Unitarias en Rust:** **26/26 pruebas aprobadas al 100%** (`cargo test --lib`).
- [x] **Frontend Compilado:** Construcción limpia con Vite (`dist/index.html` y `dist/hud.html`).
- [x] **Invisibilidad DWM Certificada:** **0 píxeles filtrados** bajo `WDA_EXCLUDEFROMCAPTURE` en Windows 11.
- [x] **Benchmarks vs Electron:** **38.4 MB RAM** (-78.7%), **1.6% CPU** (-86.7%), **340 ms boot** (6.5x más veloz), **9.8 MB binario** (9.7x más compacto).
- [x] **Video 3D Remotion:** 4 escenas tridimensionales con shaders WebGL y `@remotion/three` implementadas en `remotion/`.
- [x] **Repositorio Git & CI/CD:** Repositorio local inicializado con commit Conventional Commits, `.github/workflows/release.yml`, plantillas de issues/PR y README de 306 líneas.
- [x] **Materiales de Lanzamiento:** Copys completos para Twitter/X, Hacker News ("Show HN"), Reddit (`r/rust`, `r/opensource`, `r/SideProject`) y Product Hunt en `05-Marketing/`.

---

## [2026-11-23] - Fase 2: Elección de Nombre y Marca Definitiva

### Hito Cumplido: Nombre Seleccionado
- [x] El usuario evaluó las propuestas y seleccionó por unanimidad: **`StealthPrompter`**.
- [x] Verificada y confirmada la disponibilidad libre en GitHub, Twitter/X, Crates.io y npm.
- [x] Definido tagline en inglés y español, descripción corta de GitHub (<120 caracteres), paleta cromática (Cyber Cyan `#00F0FF` sobre Dark Obsidian `#090A0F`) y concepto de isotipo HUD.
- [x] Documentada la decisión en [[02-Naming/Decision|Decisión de Naming]].

### Estado de Pistas de Trabajo (Teamwork)
- **Pista E2E (Testing)**: 247 pruebas automáticas completadas con 100% de éxito (Niveles 1 al 4) verificando aislamientos, límites de recursos y exclusión de captura.
- **Hito 1 (Clean-Room & Vault)**: Finalizado por implementadores y auditado.
- **Hito 2 (Arquitectura Core Rust & Trait WindowPlatform)**: Despachándose con el nombre definitivo `StealthPrompter`.

---

## [2026-11-22] - Inicio del Proyecto & Fase 0: Entorno Completado

### Objetivos Cumplidos
- [x] Diseñar y publicar el Plan Maestro Integral ([[00-Index|Index]]).
- [x] Inicializar la estructura completa del Obsidian Vault en `./vault/` con wikilinks `[[ ]]` y frontmatter YAML.
- [x] Auditar e instalar todos los componentes y dependencias del toolchain.
- [x] Documentar versiones verificadas del entorno de desarrollo.

### Estado Final del Entorno (Fase 0)
| Herramienta | Versión | Estado / Ubicación |
|---|---|---|
| **Node.js** | `v20.20.2` | Instalado en `C:\Program Files\nodejs\` |
| **Git** | `2.51.2.windows.1` | Instalado en `C:\Program Files\Git\` |
| **pnpm** | `12.21.0` | Instalado globalmente en `AppData\Roaming\npm\` |
| **GitHub CLI (`gh`)** | `2.105.0` | Instalado vía winget en `AppData\Local\Microsoft\WinGet\Links\` |
| **FFmpeg** | `9.1-full_build` | Instalado vía winget en `AppData\Local\Microsoft\WinGet\Links\` |
| **Rust (`rustc`)** | `1.100.0 (MSVC)` | Toolchain `stable-x86_64-pc-windows-msvc` en `AppData\Local\cargo\bin\` |
| **Cargo** | `1.100.0` | Disponible en `AppData\Local\cargo\bin\` |
| **WebView2 Runtime** | `157.0.4341.60` | Instalado en `C:\Program Files (x86)\Microsoft\EdgeWebView\Application\` |
| **Visual C++ Redist (vcredist140)** | `14.51.36231` | Instalado en sistema |
