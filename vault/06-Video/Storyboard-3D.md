---
title: Storyboard y Guion Técnico Video 3D de Lanzamiento (Remotion)
tags:
  - video
  - 3d
  - remotion
  - launch
  - marketing
  - threejs
created: 2026-11-22
updated: 2026-11-23
status: completed
---

# 🎬 Storyboard y Guion Técnico: Video 3D de Lanzamiento (Remotion)

Este documento detalla la planificación audiovisual, desglose de escenas, parámetros de cámara, iluminación en Three.js y copy narrativo para el video de presentación oficial de **Stealth Prompter**, implementado en **Remotion 4.x + `@remotion/three`**.

---

## 1. Especificaciones Técnicas de Renderizado

| Parámetro | Valor Técnico | Justificación |
|---|---|---|
| **Composición ID** | `LaunchVideo` | Identificador único en el root de Remotion (`src/index.ts`) |
| **Resolución** | `1920 x 1080` (Full HD, 16:9) | Formato estándar horizontal para YouTube, X/Twitter y GitHub |
| **Tasa de Cuadros** | `30 fps` | Reproducción cinematográfica fluida y renderizado determinista |
| **Duración Master** | `450 frames` (15 s) / `900 frames` (30 s) | Ritmo dinámico para alto impacto en redes sociales |
| **Motor 3D** | Three.js v0.160+ vía `@remotion/three` | Renderizado por GPU WebGL determinista frame por frame |
| **Paleta Cromática** | Dark Obsidian `#090A0F`, Cyber Cyan `#00F0FF`, Stealth Emerald `#10B981`, Slate `#F8FAFC` | Coherencia con el Design System oficial ([[04-Diseno/Design-System]]) |

### Configuración Global de Escena Three.js
- **Cámara (`PerspectiveCamera`)**:
  - Campo de visión (`fov`): `50°`
  - Posición inicial: `[0, 0, 5]`
  - Planos de corte: `near = 0.1`, `far = 1000`
- **Iluminación**:
  - Luz ambiental (`AmbientLight`): Color `#FFFFFF`, Intensidad `0.7`
  - Luz direccional principal (`DirectionalLight`): Posición `[5, 5, 5]`, Intensidad `1.2`, Color `#E2E8F0`
  - Luz de acento perimetral (`PointLight`): Posición `[0, -2, 2]`, Color `#00F0FF`, Intensidad `2.5`
- **Material de Vidrio 3D (`MeshPhysicalMaterial`)**:
  - `transmission`: `0.95` (Transmisión óptica hiperrealista)
  - `opacity`: `1.0`
  - `transparent`: `true`
  - `roughness`: `0.05` (Vidrio pulido sin grano)
  - `ior`: `1.50` (Índice de refracción del cristal óptico)
  - `color`: `#12141D` con tinte Cyber Cyan en los bordes

---

## 2. Desglose Secuencial de Escenas (4 Escenas Deterministas)

### 🔴 Escena 1: El Problema — Pantallas Saturadas y Pérdida de Contacto Visual
- **Intervalo de Frames**:
  - Secuencia 15s (450 frames): `Frames 0 – 112` (3.75 segundos)
  - Secuencia 30s (900 frames): `Frames 0 – 225` (7.5 segundos)
- **Concepto Visual**:
  Una pantalla de escritorio virtual en perspectiva isométrica 3D saturada de ventanas desordenadas (Word, Bloc de notas, navegador web con guiones). El orador se distrae mirando hacia los laterales de la pantalla, perdiendo la conexión directa con la audiencia.
- **Acción & Movimiento 3D**:
  - La cámara realiza un travelling frontal lento mientras las ventanas de texto vibran con micro-glitches de color rojo tenue (`#EF4444`).
  - Se visualiza una línea de mirada que diverge de la cámara web, ilustrando la falta de naturalidad.
- **Copy en Pantalla (Typography)**:
  > *"The Screen Share Dilemma: Notes clutter your presentation or you look away from your audience."*
- **Diseño Sonoro**:
  - Nota grave de bajo sintético con zumbido tenso y sutiles efectos de interferencia analógica.

---

### 🟢 Escena 2: La Revelación — El Escudo de Invisibilidad DWM
- **Intervalo de Frames**:
  - Secuencia 15s (450 frames): `Frames 113 – 225` (3.75 segundos)
  - Secuencia 30s (900 frames): `Frames 226 – 450` (7.5 segundos)
- **Concepto Visual**:
  Aparece en el espacio 3D un panel flotante de vidrio oscuro ultraligero con bordes luminiscentes Cyber Cyan (`#00F0FF`). La pantalla se divide dinámicamente en dos mitades (*Split-Screen View*):
  - **Lado Izquierdo (Lo que tú ves)**: El orador lee cómodamente su guion flotando directamente frente a la lente de la cámara.
  - **Lado Derecho (Lo que ve tu audiencia)**: La captura de pantalla en Zoom / OBS / Teams está completamente limpia; el teleprompter no existe.
- **Acción & Movimiento 3D**:
  - El prisma de vidrio rota 15° sobre el eje Y revelando su refracción física (`MeshPhysicalMaterial`).
  - Emerge un holograma técnico con la instrucción Win32: `SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)`.
- **Copy en Pantalla (Typography)**:
  > *"True Hardware-Accelerated Invisibility.*  
  > *Desktop Window Manager excludes pixels directly at the GPU level."*
- **Diseño Sonoro**:
  - Sonido de activación energética de alta frecuencia (*energy swoosh*) seguido de una tonalidad limpia y cristalina.

---

### ⚡ Escena 3: Capacidades Clave — Rendimiento Nativo y Control Total
- **Intervalo de Frames**:
  - Secuencia 15s (450 frames): `Frames 226 – 337` (3.75 segundos)
  - Secuencia 30s (900 frames): `Frames 451 – 675` (7.5 segundos)
- **Concepto Visual**:
  Demostración acelerada de la ingeniería interna de Stealth Prompter:
  1. **Scroll a 144Hz**: El texto del guion se desliza con fluidez milimétrica sin caídas de cuadros (*zero frame drops*).
  2. **Atajos Globales Sin Robo de Foco**: Pulsaciones visuales de teclas (`Alt + Space`, `Alt + Up/Down`, `Alt + H`) interactúan con el prompter mientras una ventana de código en segundo plano permanece con foco activo.
  3. **Gráfico Comparativo de Memoria 3D**: Dos columnas 3D crecen en pantalla:
     - Barra roja inflada: *Electron Teleprompter (240 MB RAM)*.
     - Barra esbelta cyan: *Stealth Prompter (38 MB RAM)* -> **~85% menor consumo**.
- **Acción & Movimiento 3D**:
  - Rotación orbital fluida de la cámara alrededor del modelo 3D del launcher de vidrio oscuro con desenfoque de profundidad de campo (*bokeh*).
- **Copy en Pantalla (Typography)**:
  > *"Native Rust Engine. Under 40MB RAM. Zero Focus Stealing. 144Hz Fluidity."*
- **Diseño Sonoro**:
  - Ritmo de sintetizador rítmico (*arpeggiator*) moderno y ascendente.

---

### 🚀 Escena 4: Cierre & Llamado a la Acción (Outro CTA)
- **Intervalo de Frames**:
  - Secuencia 15s (450 frames): `Frames 338 – 450` (3.75 segundos)
  - Secuencia 30s (900 frames): `Frames 676 – 900` (7.5 segundos)
- **Concepto Visual**:
  Los halos Cyber Cyan y Stealth Emerald convergen en el centro de la pantalla formando el emblema 3D definitivo de **Stealth Prompter** (marco HUD con líneas de guion desvanecidas en transparencia).
- **Acción & Movimiento 3D**:
  - El isotipo extruido en metal cepillado y cristal brilla con un destello especular.
  - Alrededor emergen los sellos distintivos:
    - `100% Open Source (MIT)`
    - `Tauri 2 + Rust + SolidJS`
    - `Windows 10 / 11 Native`
- **Copy en Pantalla (Typography)**:
  > **Stealth Prompter**  
  > *"The open-source invisible teleprompter."*  
  > `github.com/stealthprompter/stealthprompter`
- **Diseño Sonoro**:
  - Acorde final triunfal con sintetizador analógico de baja reverberación (*sub bass drop*).

---

## 3. Matriz de Integración con el Código Remotion (`remotion/`)

| Elemento del Storyboard | Archivo en Código Remotion | Componente React / Three.js |
|---|---|---|
| Composición Master | `remotion/src/Composition.tsx` | `<Composition id="LaunchVideo" ... />` |
| Escena 1 (Problema) | `remotion/src/scenes/Scene1_Problem.tsx` | `<Scene1_Problem />` con efectos de cámara y texto |
| Escena 2 (Escudo DWM) | `remotion/src/scenes/Scene2_InvisibilityShield.tsx` | `<ThreeCanvas>` con `<MeshPhysicalMaterial>` y split-screen |
| Escena 3 (Features & Benchmarks) | `remotion/src/scenes/Scene3_Features.tsx` | Barras de comparación 3D y demostración de atajos |
| Escena 4 (Outro CTA) | `remotion/src/scenes/Scene4_OutroCTA.tsx` | Logo 3D extruido, badges MIT/Rust y enlace GitHub |
| Parámetros de Cámara y Luces | `remotion/src/scenes/ThreeSceneWrapper.tsx` | `<PerspectiveCamera fov={50} />`, `<directionalLight />` |
