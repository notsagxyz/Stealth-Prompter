---
title: Design System & CSS Tokens (Stealth)
tags:
  - design
  - tokens
  - glassmorphism
  - stealth
created: 2026-11-22
updated: 2026-11-25
---

# 🎨 Design System — Stealth (Stealth Prompter)

Sistema visual minimalista, redondeado y de vidrio oscuro (*dark glass*) para **Stealth** (comercializado como **Stealth Prompter**), con acento configurable por el usuario, tipografía local empaquetada sin CDN, contraste AA y accesibilidad completa.

---

## 1. Tokens CSS Core (`:root`)

Los 13 tokens base obligatorios definidos en `src/index.css` y aplicados a Launcher, Settings y Prompter HUD:

```css
:root {
  --bg: #0b0b12;
  --surface: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.08);
  --text: #f4f4f8;
  --text-muted: rgba(244, 244, 248, 0.55);
  --accent: #7c6cff;
  --accent-glow: rgba(124, 108, 255, 0.35);
  --radius-window: 22px;
  --radius-card: 14px;
  --radius-pill: 999px;
  --font-sans: "Inter", "Geist", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", monospace;

  /* Tokens derivados de elevación y HUD */
  --border-strong: rgba(255, 255, 255, 0.14);
  --surface-elevated: rgba(16, 16, 26, 0.84);
  --accent-soft: rgba(124, 108, 255, 0.14);
  --hud-bg-opacity: 0.75;
  --shadow-window: 0 24px 64px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  --shadow-card: 0 12px 32px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  --shadow-pill: 0 8px 24px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

---

## 2. Opciones de Color de Acento (6 Presets)

El usuario puede seleccionar cualquiera de los 6 acentos desde **Settings → Appearance** (`data-accent="<id>"` o actualización dinámica de variables CSS en `:root`, persistido en `settings.json` bajo `accent_color`):

| ID | Nombre | `--accent` | `--accent-glow` | `--accent-soft` | Uso |
|---|---|---|---|---|---|
| `violet` *(Default)* | **Violet** | `#7c6cff` | `rgba(124, 108, 255, 0.35)` | `rgba(124, 108, 255, 0.14)` | Identidad por defecto de Stealth |
| `indigo` | **Indigo** | `#6366f1` | `rgba(99, 102, 241, 0.35)` | `rgba(99, 102, 241, 0.14)` | Azul profundo sobrio |
| `crimson` | **Crimson Stealth** | `#f43f5e` | `rgba(244, 63, 94, 0.35)` | `rgba(244, 63, 94, 0.14)` | Sigilo nocturno / alto contraste |
| `emerald` | **Emerald** | `#10b981` | `rgba(16, 185, 129, 0.35)` | `rgba(16, 185, 129, 0.14)` | Confirmación y visibilidad limpia |
| `amber` | **Amber** | `#f59e0b` | `rgba(245, 158, 11, 0.35)` | `rgba(245, 158, 11, 0.14)` | Calidez de estudio / iluminación cálida |
| `cyan` | **Cyan** | `#06b6d4` | `rgba(6, 182, 212, 0.35)` | `rgba(6, 182, 212, 0.14)` | Precisión técnica fría |

---

## 3. Tipografía y Empaquetado Local (Zero CDN)

Las fuentes se empaquetan localmente en el bundle Vite mediante `@fontsource/inter` y `@fontsource/jetbrains-mono` (cero peticiones externas, cumplimiento estricto de `offline_only` y CSP):

```ts
// src/index.css / src/main imports
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/600-italic.css'; // Palabra acentuada en cursiva del titular
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
```

### Escala Tipográfica

| Rol | Familia | Tamaño | Peso | Tracking / Detalle |
|---|---|---|---|---|
| **Hero Headline** | `--font-sans` | `28px – 32px` | `600` / `700` | `-0.025em`; palabra focal en `font-style: italic; color: var(--accent)` |
| **Subtitle** | `--font-sans` | `13px – 14px` | `400` | Color `--text-muted`, máx. 1–2 líneas |
| **Section Title** | `--font-sans` | `14px` | `600` | Acompañado de barrita vertical de acento (`2.5px`) |
| **Body / Script Card** | `--font-sans` | `13px` | `400` / `500` | `line-height: 1.5` |
| **Micro-label** | `--font-mono` | `10px – 11px` | `500` | `text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.55` |
| **Numeric Readout / Keycap** | `--font-mono` | `11px – 12px` | `500` | `font-variant-numeric: tabular-nums` |
| **HUD Prompter Text** | `--font-sans` | `16px – 96px` *(default `44px`)* | `500` / `600` | `line-height: 1.55`, `#f4f4f8` siempre opaco al 100% |

---

## 4. Superficies Atmosféricas, Sombras y Blur

### 4.1 Doble Resplandor Radial (`Dual Radial Glow`)
Aplicado en el lienzo raíz del Launcher detrás de las tarjetas sin saturar el contenido:

```css
.bg-stealth-glow {
  background-color: var(--bg);
  background-image:
    radial-gradient(60% 48% at 48% 12%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 72%),
    radial-gradient(42% 42% at 88% 82%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%);
}
```

### 4.2 Textura Sutil de Puntos ("Star-Dot")
Textura ambiental muy tenue (`0.035` de opacidad) generada puramente con CSS sin recursos externos:

```css
.bg-star-dots {
  background-image:
    radial-gradient(rgba(244, 244, 248, 0.045) 1px, transparent 1px),
    radial-gradient(rgba(244, 244, 248, 0.025) 1px, transparent 1px);
  background-size: 48px 48px, 73px 73px;
  background-position: 0 0, 21px 31px;
}
```

### 4.3 Reglas de Vidrio Oscuro (`Glass Cards & Pills`)
- **Ventana principal (Launcher)**: `border-radius: var(--radius-window)` (`22px`), `border: 1px solid var(--border)`, `box-shadow: var(--shadow-window)`, `backdrop-filter: blur(24px)`, padding exterior `20px–24px`.
- **Tarjetas de vidrio**: `background: var(--surface)`, hover `var(--surface-hover)`, `border: 1px solid var(--border)`, `border-radius: var(--radius-card)` (`14px`), `box-shadow: var(--shadow-card)`, padding interno `16px–20px`.
- **HUD Prompter (Fondo independiente del texto)**: El fondo usa `background-color: rgba(11, 11, 18, var(--hud-bg-opacity))` con rango `0.10` (`10%`) a `1.00` (`100%`) y `backdrop-filter` proporcional suave, mientras el texto del guion mantiene `opacity: 1` y sombra sutil `0 1px 10px rgba(0,0,0,0.65)` para legibilidad constante.

---

## 5. Primitivas de Componentes

1. **Barrita Vertical de Acento (`2–3px`)**:
   - A la izquierda de títulos de sección: `width: 2.5px` (o `3px`), `height: 14px`, `border-radius: 999px`, `background: var(--accent)`, `box-shadow: 0 0 10px var(--accent-glow)`.
2. **Iconos Lucide y Contenedor Circular con Badge `+` (`Cutout Ring`)**:
   - Todos los iconos UI provienen de `lucide-solid` con `strokeWidth={1.75}`.
   - Los tiles de creación usan un círculo de `40px` con fondo `var(--accent-soft)` y un badge `+` de `16px` anclado abajo a la derecha (`-bottom-1 -right-1`) con **anillo de recorte** (`box-shadow: 0 0 0 2px #11111a`) para separarse limpiamente del círculo.
3. **Botones en Píldora (`Pill CTAs`)**:
   - **Primario Claro / Acento**: `border-radius: var(--radius-pill)`, fondo `#f4f4f8` con texto `#0b0b12` (o `var(--accent)` con texto `#ffffff` cuando requiera acento explícito), `padding: 9px 18px`, `font-weight: 600`.
   - **Secundario Oscuro Glass**: `background: var(--surface)`, `border: 1px solid var(--border)`, `color: var(--text)`, `border-radius: var(--radius-pill)`.
   - **Estado Seleccionado**: `border-color: var(--accent)`, `background: var(--accent-soft)`.
4. **Selector de Color (`Swatch Ring`)**:
   - Círculos de `24px` en fila horizontal; el swatch activo muestra anillo exterior separado por 2px (`outline: 2px solid var(--text); outline-offset: 2px`).
5. **Indicador de Pasos en Píldora**:
   - Solo cuando aporta valor contextual (ej. primer uso / onboarding opcional): cápsula oscura `border-radius: 999px` con flechas laterales, cápsula alargada activa en `--accent` y puntos inactivos en `rgba(244,244,248,0.22)`.

---

## 6. Movimiento, Foco y Matriz de Contraste AA

### 6.1 Transiciones y `prefers-reduced-motion`
- Duración estándar de microinteracciones: `150ms – 250ms` con curva `cubic-bezier(0.22, 1, 0.36, 1)`.
- Regla obligatoria en `src/index.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 6.2 Foco Visible (`:focus-visible`)
Todo botón, tarjeta interactiva, slider, switch y chip debe exponer un anillo claro en navegación por teclado:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 6.3 Matriz de Contraste WCAG AA

| Par Visual | Primer Plano | Fondo | Ratio Estimado | Estado AA |
|---|---|---|---|---|
| Texto principal sobre lienzo | `#f4f4f8` | `#0b0b12` | **~17.5 : 1** | ✅ AAA / AA (≥4.5:1) |
| Texto atenuado sobre lienzo | `rgba(244,244,248,0.55)` (`~#8d8d96`) | `#0b0b12` | **~6.1 : 1** | ✅ AA (≥4.5:1) |
| CTA primario claro | `#0b0b12` | `#f4f4f8` | **~17.5 : 1** | ✅ AAA / AA |
| Palabra focal acento (`Violet`) | `#7c6cff` | `#0b0b12` | **~5.4 : 1** | ✅ AA texto normal y grande |
| Texto HUD en opacidad 10% | `#f4f4f8` + `text-shadow` | Escritorio claro/oscuro + `rgba(11,11,18,0.10)` | **≥4.5 : 1** *(reforzado por halo oscuro)* | ✅ Legible |
