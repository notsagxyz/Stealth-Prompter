---
title: Evaluación HyperFrames vs Remotion — Video de Release
tags:
  - video
  - remotion
  - hyperframes
  - decision
created: 2026-11-25
---

# 🎬 Evaluación Técnica: HyperFrames vs Remotion

Para producir el paquete audiovisual de lanzamiento de **Stealth Prompter** (video master horizontal `1920x1080` a `60 fps`, versión vertical `1080x1920` `9:16` a `60 fps` para X/Reels/Shorts y un GIF corto optimizado para el `README.md`), se instalaron y evaluaron en profundidad las colecciones de skills de **HyperFrames** y **Remotion** (`remotion-best-practices`).

## Comparativa por Criterio y Escena

| Criterio | Remotion 4.x + `@remotion/three` | HyperFrames (HTML-to-Video) |
|---|---|---|
| **Escena 3D y Marco Metálico** | Renderizado WebGL determinista con Three.js / React Three Fiber (`MeshPhysicalMaterial`, luces direccionales rojo sigilo `#f43f5e`, acento violeta `#7c6cff` y reflejos en el piso). | Orientado a composiciones HTML/CSS y timelines 2D; carece de materiales físicos 3D integrados sin montaje manual complejo. |
| **Composición Dual 16:9 y 9:16** | Parametrización compartida en `remotion/src/Root.tsx` (`LaunchVideo` `1920x1080` y `LaunchVideoVertical` `1080x1920`, ambos a `60 fps`). | Requiere mantener archivos de escena o breakpoints separados por cada relación de aspecto. |
| **Velocidad de Iteración UI 2D** | Reutilización directa de componentes React (`RealLauncherUI.tsx`, `RealPrompterHUD.tsx`) con tipografía local y tokens exactos. | Excelente velocidad para motion graphics HTML/CSS puros, títulos cinéticos y transiciones de cámara 2D (`cut-the-curve`). |
| **Pipeline MP4 + GIF README** | Exportación H.264 `yuv420p` determinista vía `remotion render` y extracción directa de clip `4.5 s` con FFmpeg `palettegen`/`paletteuse`. | Exportación vía `hyperframes render` y conversión posterior con FFmpeg. |

## Decisión por Escena y Justificación

1. **Escena 1 (The Screen-Share Dilemma — 0.0 s a 3.0 s):** Implementada en **Remotion** por la integración directa de partículas 3D y tarjetas con perspectiva animada a `60 fps`.
2. **Escena 2 (The Stealth Disappearance — 2.9 s a 6.1 s):** Implementada en **Remotion + React Three Fiber**, aprovechando el marco metálico redondeado flotante, la iluminación dramática en rojo sigilo y violeta con reflejo en el suelo, y el split-screen donde el prompter desaparece por completo de la pantalla compartida (`WDA_EXCLUDEFROMCAPTURE`).
3. **Escena 3 (Zero Bloat, Total Control — 6.1 s a 9.1 s):** Implementada en **Remotion**, mostrando la UI real rediseñada de **Stealth** (scroll manual, opacidad 10%–100% y barra flotante en píldora).
4. **Escena 4 (Outro & CTA — 9.1 s a 12.0 s):** Implementada en **Remotion** con el emblema 3D del shuriken-play y el llamado a la acción open source de **Stealth Prompter**.

**Conclusión:** Se eligió **Remotion 4.x + `@remotion/three`** como motor principal unificado por su fidelidad 3D determinista en la escena del marco metálico y su capacidad de generar `16:9` y `9:16` a `60 fps` desde un único código fuente, reservando **HyperFrames** para futuras piezas 2D puramente tipográficas o changelogs semanales rápidos.
