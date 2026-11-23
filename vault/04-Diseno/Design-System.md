---
title: Design System & UX Spec
tags:
  - design
  - tokens
  - glassmorphism
  - minimal
  - linear-style
created: 2026-11-22
updated: 2026-11-23
---

# 🎨 Design System: Framer / Linear / Tidyloop Minimalist Dark Glass

Este documento define las especificaciones del sistema de diseño para **StealthPrompter**, enfocado en una estética minimalista premium de vidrio oscuro (*dark glassmorphism*) inspirada en interfaces de clase mundial como **Framer Studio**, **Linear**, **Raycast** y **Tidyloop**.

---

## 1. Principios de Diseño Visual

1. **Restricción & Sofisticación (Cero AI-Tells)**:
   - Prohibidos los colores cyberpunk chillones (cian/esmeralda saturados con glow fluorescente), insignias en mayúsculas estridentes y bordes de neón.
   - La autoridad visual se logra a través de contraste preciso, jerarquía tipográfica limpia y acabados en vidrio translúcido con desenfoque real (`backdrop-filter: blur(28px)`).

2. **Acción Principal en Pastilla Blanca (Pill CTA)**:
   - Los botones de acción primaria utilizan una pastilla en blanco puro con tipografía oscura (`bg-white text-black font-semibold rounded-full`), transmitiendo confianza y claridad inmediata (como en Tidyloop y Framer).
   - Las acciones secundarias se presentan en vidrio translúcido ahumado (`bg-white/[0.06] border border-white/10 hover:bg-white/[0.12]`).

3. **Profundidad Atmosférica**:
   - Fondo de grafito oscuro con degradado radial sutil (`radial-gradient(130% 100% at 50% 0%, #151824 0%, #0C0D12 60%, #07080A 100%)`).
   - Paneles flotantes con borde de 1px hairline (`rgba(255, 255, 255, 0.08)`) y tenue iluminación superior interior (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`).

4. **Microinteracciones y Pastillas de Estado**:
   - Píldoras de estado discretas con puntos de luz estables (e.g. punto esmeralda `#22C55E` para indicar que el teleprompter está protegido y oculto de capturas de pantalla).
   - Buscador integrado en la barra lateral con icono minimalista.

---

## 2. Paleta de Colores y Tokens

| Token | Valor CSS / Hex | Uso |
|---|---|---|
| `canvas.bg` | `#0A0B0E` / Radial `#151824` a `#07080A` | Fondo general de ventana |
| `glass.surface` | `rgba(18, 20, 26, 0.78)` | Paneles flotantes del Launcher y modal de Ajustes |
| `glass.hud` | `rgba(12, 14, 18, 0.85)` | Contenedor principal del HUD de lectura |
| `glass.border` | `rgba(255, 255, 255, 0.08)` | Bordes sutiles de paneles y separadores |
| `glass.card` | `rgba(255, 255, 255, 0.04)` | Elementos de lista y tarjetas de formulario |
| `glass.hover` | `rgba(255, 255, 255, 0.08)` | Estados de hover interactivos |
| `text.primary` | `#F8FAFC` | Títulos y texto de lectura principal |
| `text.secondary` | `#94A3B8` | Subtítulos y etiquetas de controles |
| `text.tertiary` | `#64748B` | Metadatos secundarios (conteo de palabras, tiempo) |
| `cta.primary` | `#FFFFFF` (texto `#000000`) | Botón principal de lanzamiento de HUD |
| `status.ready` | `#22C55E` | Indicador de exclusión de captura activa |

---

## 3. Especificación de Ventanas

### 3.1 Launcher (Ventana de Estudio Frameless)
- **Marco de Ventana**: 100% Frameless (`decorations: false`, `transparent: true`, `shadow: true`), eliminando completamente la barra de título estándar y botones por defecto de Windows.
- **Titlebar Glass Personalizada**: Controles de semáforo sutiles estilo macOS/Linux (Cerrar `×`, Minimizar `−`, Maximizar `□`) integrados en la zona superior de arrastre (`data-tauri-drag-region`), selector de guiones en píldora y badge de protección OBS.
- **Lienzo de Escritura Expandido (Studio Canvas)**: Área central amplia, tipografía de alta legibilidad, sin paneles rígidos que encajonen el texto.
- **Dock de Controles Flotante**: Barra de herramientas flotante anclada en el centro inferior con ajuste fino de velocidad (<1x y >1x), tamaño de fuente, espejo y botón de desbloqueo rápido de click-through.
- **Biblioteca Deslizable (Drawer)**: Cajón lateral con búsqueda en tiempo real que no interrumpe el flujo de redacción.
- Encabezado: Barra superior de 56px con logo, indicador de invisibilidad, controles de reproducción sincronizados y botón de lanzamiento.
- Barra lateral (256px): Buscador de discursos, botón "+ New", lista con conteo de palabras y eliminación al hover.
- Editor central: Título en tipografía grande, etiquetas de lectura (`420 words · ~2.5 min`), importación de archivos `.txt`/`.md` y área de redacción con interlineado 1.75.

### 3.2 Prompter HUD (Ventana Flotante)
- Dimensiones iniciales: 1000x350 px (mínimo 300x150, libremente redimensionable).
- Estilo: Contenedor con esquinas redondeadas (`rounded-2xl`), sin marco nativo de Windows (`decorations: false`), flotante sobre todas las apps (`alwaysOnTop`).
- Movilidad: Arrastre nativo en toda la barra superior (`data-tauri-drag-region` y `startDragging`).
- Redimensionado: Zonas interactivas en los 4 bordes y las 4 esquinas (`startResizeDragging`), con agarrador visual diagonal en la esquina inferior derecha.
- Guía de lectura: Línea horizontal con degradado sutil (`ReadingMarker`) ubicada al 35% de la altura de la ventana, justo debajo de la cámara web.
- Modo Click-Through: Alternable con un solo clic o atajo global para permitir que los clics atraviesen el prompter hacia las ventanas de fondo.
