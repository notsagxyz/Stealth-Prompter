---
title: Análisis de Referencias Visuales
tags:
  - design
  - references
  - dark-glass
  - tokens
  - video
created: 2026-11-25
updated: 2026-11-25
---

# 🔍 Análisis de Referencias Visuales

Extracción sistemática del lenguaje visual, proporciones, iluminación y composición a partir de las 2 imágenes de referencia suministradas, junto con las reglas estrictas de originalidad (*clean-room*) para **Stealth** (**Stealth Prompter**).

---

## 1. Imagen 1 — Atmósfera Glass Oscura, Jerarquía y Tarjetas (`media_1795646840522_3d2a5526.jpg`)

### Observaciones Directas
- **Carcasa de ventana**: Ventana oscura sin cromo del sistema con esquinas redondeadas amplias (`~22px`), borde perimetral de `1px` en blanco de muy baja opacidad (`rgba(255,255,255,0.08)`), sombra exterior profunda y un tenue brillo superior (`inset 0 1px 0 rgba(255,255,255,0.06)`).
- **Fondo y doble resplandor radial**: Lienzo casi negro (`#0b0b12`) con **dos resplandores radiales difusos** del color acento violeta (`#7c6cff` al `12%–18%`): uno amplio detrás de la zona superior central y otro suave en la esquina inferior derecha.
- **Tipografía de bienvenida**: Microetiqueta monoespaciada superior de baja opacidad, titular sans bold con una palabra clave en **cursiva y color acento** (`--accent`), y subtítulo corto atenuado inmediatamente debajo.
- **Tarjetas flotantes y barrita vertical**: Tarjetas en vidrio oscuro (`rgba(255,255,255,0.04)`, radio `14px`, borde `1px rgba(255,255,255,0.08)`, padding `18–20px`). El título de cada sección lleva una **barrita vertical de acento (`2.5–3px` de ancho, bordes píldora)** a su izquierda y contador alineado a la derecha.
- **Tiles de acción con badge `+` recortado**: Sub-tarjetas redondeadas (`12px`) con icono Lucide fino dentro de un círculo translúcido tintado en `--accent` y un pequeño badge circular `+` en la esquina inferior derecha separado por un **anillo de recorte oscuro (`2px`)** del mismo color de fondo del tile.
- **Indicador de pasos en píldora**: Cápsula flotante inferior oscura con flechas laterales, cápsula alargada activa en `--accent` y puntos inactivos atenuados.

### Traducción a Stealth (Launcher & Settings)
- Se adopta la ventana centrada redondeada (`22px`), el doble resplandor radial en `--accent-glow`, el titular con palabra en cursiva acentuada (*"Ready to *prompt*?"*), las tarjetas glass para *Recent scripts* y las 4 secciones de *Settings*, la barrita vertical de acento junto a los títulos de sección y el tile con badge `+` para **New script**.
- Se omite la barra lateral pesada de administración y los elementos ajenos al flujo de teleprompter: el Launcher de Stealth mantiene únicamente titular + subtítulo, CTA principal, guiones recientes y acceso a Ajustes.

---

## 2. Imagen 2 — Contraste de Píldoras, Selector de Color y Escena 3D (`media_1795646852595_6b09ccfb.jpg`)

### Observaciones Directas (UI dentro de la escena)
- **Textura de fondo ("star-dots")**: Puntos diminutos tipo estrellas muy tenues (`3%–5%` de opacidad) dispersos sobre `#0b0b12` que dan profundidad orgánica sin ruido visual.
- **Botones en píldora y microetiquetas**: Botón primario en píldora sólida clara (`#f4f4f8` con texto `#0b0b12`) combinado con píldora secundaria de vidrio oscuro y borde `1px`. Debajo, microetiquetas monoespaciadas en mayúsculas con `letter-spacing: 0.12em` y baja opacidad.
- **Contorno activo en filas e iconos**: Los elementos seleccionados en listas o cuadrículas reciben un tinte sutil `--accent-soft` y un borde `1px` en `--accent` (o `#f4f4f8`).
- **Selector de color de acento (`Swatch Ring`)**: Fila horizontal de círculos de color; el seleccionado presenta un **anillo exterior separado por una brecha oscura de 2px**.

### Observaciones Directas (Composición 3D para Video de Release — M6)
- **Marco metálico redondeado flotante**: La aplicación vive dentro de un bisel 3D redondeado de aluminio/titanio cepillado con reflejos especulares suaves en los biseles laterales.
- **Fondo arquitectónico estriado (Fluted Glass / Ribbed Backdrop)**: Detrás del marco metálico se proyectan estrías verticales de vidrio/metal bañadas por un **haz vertical dramático de luz** (carmín/rojo sigilo o violeta acento) que se degrada hacia negro puro en el lado opuesto.
- **Piso oscuro reflectante**: Superficie inferior tipo espejo negro satinado que refleja el borde inferior del marco metálico y las líneas de luz verticales del fondo.

### Traducción al Prompter HUD (M3) y Video 3D (M6)
- **HUD**: Adopta la píldora de vidrio flotante, los chips/botones circulares en píldora, las microetiquetas mono para velocidad y opacidad (`2.5x`, `75%`, `44px`), y mantiene el texto del guion dominante con fondo cuya opacidad (`10%–100%`) varía de forma independiente al texto.
- **Video 3D (M6)**: Reinterpreta el marco metálico redondeado flotante sobre piso reflectante oscuro y fondo vertical estriado iluminado en violeta (`#7c6cff`) y rojo sigilo (`#f43f5e`) para demostrar la exclusión de captura DWM de Stealth Prompter.

---

## 3. Reglas de Originalidad y Clean-Room (Sin Copias)

1. **Cero copia de marcas o copy**: Queda estrictamente prohibido reutilizar nombres, logotipos, textos, ilustraciones o ejemplos visibles en las imágenes de referencia.
2. **Adaptación de dominio**: Cada patrón visual se traduce exclusivamente a necesidades reales de **Stealth**: gestión de guiones recientes, ajustes en 4 tarjetas, selector de 6 acentos y barra de controles flotante en píldora del HUD.
3. **Activos 100% originales**: El icono ninja/sigilo (R5), los componentes SolidJS/Tailwind (M3–M4) y las escenas 3D del video de lanzamiento (M6) se diseñan y generan desde cero.
