---
title: Launcher & Settings UX Specification (Stealth)
tags:
  - design
  - ux
  - launcher
  - settings
  - stealth
created: 2026-11-25
updated: 2026-11-25
---

# 🖥️ Launcher & Settings UX — Stealth

Especificación de experiencia de usuario y arquitectura visual del **Launcher** y panel **Settings** de **Stealth** (R2, R3, M4), contrastada contra la captura inicial previa al rediseño (`screenshots/before_launcher.png`).

---

## 1. Línea Base Pre-Rediseño (`screenshots/before_launcher.png`)

La captura inicial `vault/04-Diseno/screenshots/before_launcher.png` (`980×640`) documenta el punto de partida antes de M4:
- Estructura de 3 columnas tipo estudio (`Scripts` a la izquierda, editor central vacío y panel inspector fijo a la derecha).
- Nombre legado en barra superior y botón prominente blanco **`Show HUD`**.
- Paleta plana sin resplandor radial, sin textura ambiental, sin fuentes locales empaquetadas ni selector de acento.

En cumplimiento de **R2 y R3**, el botón `"Show HUD"` se elimina por completo y la ventana evoluciona hacia un **Launcher minimalista, centrado y sin distracciones**.

---

## 2. Arquitectura de Ventana Frameless (Launcher)

- **Geometría**: Ventana compacta y centrada (`980×640` o `780×580`, mínimo `740×480` en `tauri.conf.json`), `"decorations": false`, `"transparent": true`, `"shadow": true`.
- **Carcasa visual**: `--bg` (`#0b0b12`), radio de ventana `--radius-window` (`22px`), borde `1px solid var(--border)`, doble resplandor radial (`--accent-glow`) y textura sutil `star-dots`.
- **Barra de título propia y arrastrable (`data-tauri-drag-region`)**:
  - Izquierda: Isotipo original de **Stealth** + nombre de aplicación **`Stealth`** (sin textos largos).
  - Derecha: Acceso directo discreto a **Settings** (píldora o botón icono Lucide `Settings`) + controles monocromos de ventana (`Minimize`, `Maximize`, `Close`).
  - **Sin botón `"Show HUD"`**: Al abrir o iniciar un guion se lanza el Prompter HUD directamente; la barra flotante del HUD gestiona todos los controles en vivo.

---

## 3. Vista Principal del Launcher (Minimalista)

La vista principal contiene únicamente lo esencial para preparar o lanzar un guion en segundos:

1. **Bloque Hero**:
   - Microetiqueta mono opcional (`STEALTH · READY` o contador sutil de guiones).
   - Titular principal (`28–32px`, `Inter` semibold) con una palabra focal en **cursiva y color acento**: por ejemplo, *"Ready to *prompt*?"*.
   - Subtítulo breve de 1 línea en `--text-muted` (`Local scripts, invisible during screen sharing.`).
2. **Acción Principal (`New script`)**:
   - Botón en píldora claro (`#f4f4f8` con texto `#0b0b12`) o tile con icono circular Lucide y badge `+` recortado (`cutout ring`) para crear un guion nuevo y abrir el editor limpio (`ScriptEditor.tsx`), acompañado de CTA secundario en píldora oscura para abrir/iniciar el último guion.
3. **Lista de Guiones Recientes (`RECENT SCRIPTS`)**:
   - Cabecera con **barrita vertical de acento (`2.5px`)**, microetiqueta mono en mayúsculas (`RECENT SCRIPTS`) y contador alineado a la derecha.
   - Búsqueda rápida discreta en vidrio oscuro.
   - Tarjetas redondeadas (`--radius-card: 14px`, `var(--surface)`, borde `1px var(--border)`) mostrando:
     - Título del guion (`ScriptSummary.title`)
     - Extracto breve (`ScriptSummary.snippet`, máx. 1–2 líneas, resolviendo la compatibilidad de `ScriptList.tsx`)
     - Metadatos mono (`word_count`, duración estimada) y acciones de abrir/editar/reproducir o eliminar al hover/foco.
4. **Editor de Guion Limpio (`ScriptEditor.tsx`)**:
   - Al seleccionar o crear un guion, la vista permite editar título y contenido en un lienzo sin ruido, con píldora **`Start Prompter`** (abre el HUD con el guion activo) y regreso inmediato a la lista.

---

## 4. Panel de Settings (4 Secciones en Tarjetas Redondeadas)

Accesible desde el botón **Settings** del Launcher; renderizado con tarjetas glass (`--radius-card: 14px`) y títulos con barrita vertical de acento:

### 4.1 `Prompter`
- **Default Scroll Speed**: Slider + botones `-/+` con pasos decimales granulares (`0.1` a `20.0`, default `2.5`).
- **Font Size**: Slider + `-/+` (`16px` a `96px`, default `44px`).
- **Background Opacity**: Slider `10%` a `100%` (default `75%`) con valor actual visible en mono (`75%`), controlando únicamente el fondo del HUD sin atenuar el texto.
- **Scroll Behavior**: Preferencias de scroll manual (sensibilidad de rueda/arrastre y reanudación suave al pulsar Play).
- **Mirror Mode** & **Capture Exclusion (`WDA_EXCLUDEFROMCAPTURE`)**: Switches accesibles con badge de estado (`Hidden from capture` / `Visible`).

### 4.2 `Shortcuts`
- Tabla en tarjetas con combinaciones en tipografía `JetBrains Mono` (`tabular-nums`), incluyendo explícitamente los controles operativos en modo **Click-Through**:
  - `Alt+Space` — Play / Pause
  - `Alt+Up` / `Alt+Down` — Speed Up / Down
  - `Alt+Shift+Up` / `Alt+Shift+Down` — Manual Scroll Up / Down (activo incluso en Click-Through)
  - `Alt+[-/=]` o `Alt+Shift+Left/Right` — Background Opacity Down / Up (activo incluso en Click-Through)
  - `Alt+R` — Rewind to Top
  - `Alt+L` — Toggle Click-Through Lock
  - `Alt+H` — Show / Hide Prompter HUD

### 4.3 `Appearance`
- Selector de **6 colores de acento** en fila de círculos (`24px`) con anillo exterior separado por 2px en el color activo:
  1. `Violet` (`#7c6cff` — **Default**)
  2. `Indigo` (`#6366f1`)
  3. `Crimson Stealth` (`#f43f5e`)
  4. `Emerald` (`#10b981`)
  5. `Amber` (`#f59e0b`)
  6. `Cyan` (`#06b6d4`)
- Actualización instantánea en vivo de `--accent`, `--accent-glow` y resplandor radial, persistida en `settings.json` (`accent_color`).

### 4.4 `About`
- Identidad: **Stealth** (*Stealth Prompter*), versión actual, licencia **MIT Open Source**.
- Privacidad local-first: almacenamiento atómico en `%APPDATA%\com.stealth.desktop\` (`offline_only`, cero telemetría, cero cuentas).

---

## 5. Accesibilidad y Capturas

- Todos los controles usan iconos de `lucide-solid`, etiquetas claras en inglés, foco visible `:focus-visible` con anillo `--accent`, contraste WCAG AA y soporte de `@media (prefers-reduced-motion: reduce)`.
- Las capturas post-rediseño (`after_launcher.png`, `after_settings.png`) se guardarán junto a `before_launcher.png` en `vault/04-Diseno/screenshots/` durante M4.
