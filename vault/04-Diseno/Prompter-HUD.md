---
title: Prompter HUD & Floating Control Bar Specification (Stealth)
tags:
  - design
  - ux
  - hud
  - prompter
  - stealth
created: 2026-11-25
updated: 2026-11-25
---

# 🕶️ Prompter HUD & Floating Control Bar — Stealth

Especificación funcional y visual de la ventana de lectura **Stealth HUD** (R1, R2, R3, M2–M3), contrastada contra la captura inicial previa al rediseño (`screenshots/before_hud.png`).

---

## 1. Línea Base Pre-Rediseño (`screenshots/before_hud.png`)

La captura inicial `vault/04-Diseno/screenshots/before_hud.png` (`1000×350`) muestra las limitaciones del HUD original antes de M3:
- Barra superior fija de ancho completo (`fixed top-0`) con título legado.
- Controles incompletos (faltan tamaño de fuente `-/+`, slider inline de opacidad `10%–100%`, espejo, indicador evidente de estado Playing/Paused y modo colapsado con píldora persistente de Play).
- Sin scroll manual por rueda/touchpad/arrastre (`pointer-events-none` en el contenedor de texto) y opacidad mínima limitada al `20%` que afectaba el conjunto del panel.

---

## 2. Lienzo de Lectura & Transparencia Independiente (R1, R3)

- **El texto manda**: Ventana transparente frameless (`1000×350` por defecto, redimensionable en bordes y esquinas, título `"Stealth HUD"`, `WDA_EXCLUDEFROMCAPTURE` activo). Sin decoraciones ni paneles distractores alrededor del guion.
- **Opacidad solo del fondo (`10%–100%`)**:
  - `window_opacity` (`0.10` a `1.00`, default `0.75`) controla **únicamente** la canalización alfa del fondo del HUD (`rgba(11, 11, 18, opacity)` y `backdrop-filter: blur(...)` suave proporcional).
  - El texto del guion (`#f4f4f8` + `text-shadow: 0 1px 10px rgba(0, 0, 0, 0.72)`) y la guía de lectura permanecen siempre al **100% de opacidad y contraste legible**, incluso con fondo al `10%`.
- **Marcador de lectura (`ReadingMarker.tsx`)**: Línea sutil fija cerca del tercio superior (`~35%`) con puntos laterales y brillo tenue en `--accent`, sin obstruir el texto.

---

## 3. Scroll Manual con Pausa y Reanudación Suave (R1)

Cuando el HUD está desbloqueado (`!click_through`):
1. **Rueda del mouse y touchpad**: Eventos `wheel` sobre el lienzo del texto ajustan `scrollY` de forma inmediata y precisa.
2. **Arrastre directo del texto (`Pointer Drag`)**: Pulsar y arrastrar verticalmente sobre el área del guion (`cursor: grab` / `grabbing`) desplaza el texto en tiempo real sin activar `startDragging()` de ventana (la barra o borde superior sigue moviendo la ventana).
3. **Pausa automática y reanudación sin saltos**:
   - Cualquier desplazamiento manual pausa inmediatamente el auto-scroll si estaba reproduciéndose (`ScrollEngine.applyManualDelta(delta)` -> `pause()` + `state_sync`), manteniendo el motor sincronizado en la nueva posición exacta (`scrollY`).
   - Al volver a pulsar **Play**, el motor retoma desde la nueva `scrollY` con una rampa suave (`ease-in` corto de `~200ms`) sin saltos bruscos ni retrocesos al offset anterior.
4. **Modo Click-Through (`WS_EX_TRANSPARENT`)**:
   - Los eventos de puntero atraviesan el HUD hacia la presentación/IDE subyacente.
   - Tanto el **scroll manual** (`Alt+Shift+Up` / `Alt+Shift+Down`) como la **opacidad del fondo** (`Alt+[-/=]` o `Alt+Shift+Left/Right`) siguen completamente operativos mediante atajos globales.
   - Un **micro-tooltip / píldora de ayuda discreta** permanece visible en modo Click-Through informando los atajos globales clave (`Click-through active · Alt+L unlock · Alt+Shift+↑/↓ scroll · Alt+Shift+←/→ opacity`).

---

## 4. Barra de Controles Flotante en Píldora (R2)

Reemplaza por completo la cabecera fija anterior y el antiguo flujo de `"Show HUD"`:

### 4.1 Presencia Discreta y Colapso Persistente
- **Forma y ubicación**: Píldora flotante compacta (`--radius-pill: 999px`, vidrio oscuro esmerilado, borde `1px var(--border)`, `--shadow-pill`) flotando en la zona inferior o superior sin tapar el texto activo ni el marcador de lectura.
- **Opacidad adaptativa**: Discreta en reposo (`opacity: 0.35–0.45`) y gana presencia completa (`opacity: 1.0`) en `180ms` al pasar el cursor (`:hover`) o recibir foco de teclado (`:focus-within`).
- **Ocultar barra + píldora persistente de Play**:
  - Al pulsar el botón de ocultar/colapsar barra (`Hide controls`), la barra completa se repliega dejando **siempre visible una pequeña píldora flotante con el botón Play/Pause** y un control discreto para expandir de nuevo la barra completa (`Show controls`).

### 4.2 Controles Obligatorios (Iconos Lucide + Tooltips en Inglés)
Todos los iconos provienen de `lucide-solid` (`strokeWidth={1.75}`), con tooltips en inglés que muestran el nombre de la acción y su atajo global, además de navegación completa por teclado (`Tab`, `Enter`, `Space`, flechas en sliders, `:focus-visible` con anillo `--accent`):

| # | Control | Icono Lucide | Tooltip en Inglés (con Atajo) | Detalle Visual |
|---|---|---|---|---|
| 1 | **Play / Pause** *(Principal)* | `Play` / `Pause` | `"Play / Pause (Alt+Space)"` | Botón más grande y reconocible; estado **Playing** resaltado con `--accent` / luz y badge `PLAYING` vs **Paused** (`PAUSED`). |
| 2 | **Restart / Rewind** | `RotateCcw` | `"Restart script (Alt+R)"` | Reinicia al inicio (`scrollY = 0`). |
| 3 | **Speed `-/+`** | `Minus` / `Plus` | `"Decrease speed (Alt+Down)"` / `"Increase speed (Alt+Up)"` | Valor mono en vivo (ej. `2.5x`). |
| 4 | **Font Size `-/+`** | `A-` / `A+` *(o `Minus`/`Plus`)* | `"Decrease font size"` / `"Increase font size"` | Valor mono en vivo (ej. `44px`). |
| 5 | **Background Opacity** | `Droplet` / slider | `"Background opacity (Alt+Shift+←/→)"` | Slider inline `10%–100%` + lectura mono en vivo (`75%`). |
| 6 | **Mirror** | `FlipHorizontal2` | `"Toggle mirror mode"` | Estado activo marcado con anillo/tinte `--accent`. |
| 7 | **Click-Through** | `Lock` / `MousePointerClick` | `"Toggle click-through (Alt+L)"` | Muestra tooltip de atajos globales al bloquear. |
| 8 | **Collapse / Close** | `ChevronDown` / `X` | `"Hide control bar"` / `"Close HUD (Alt+H)"` | Colapsa a píldora Play persistente o cierra la ventana HUD. |

### 4.3 Estado Visible (Playing / Paused)
- Indicador explícito en la píldora (punto luminoso + etiqueta mono `PLAYING` en `--accent` o `PAUSED` en `--text-muted`) para reconocer el estado al instante sin leer el icono de forma aislada.
- Las capturas post-rediseño (`after_hud.png`) se guardarán junto a `before_hud.png` en `vault/04-Diseno/screenshots/` durante M3/M4.
