---
title: Clean-Room Functional & Technical Analysis
tags:
  - analysis
  - clean-room
  - reverse-engineering
  - win32
  - dwm
  - capture-exclusion
created: 2026-11-23
updated: 2026-11-23
status: approved
---

# 🔬 Clean-Room Functional & Technical Analysis

Este documento establece el análisis funcional y técnico de ingeniería limpia (**Clean-Room Software Engineering**) para el desarrollo del teleprompter invisible de escritorio de código abierto en **Tauri 2 + Rust**.

---

## 1. Protocolo Ético Clean-Room ("Chinese Wall")

El objetivo de este protocolo es garantizar que el producto resultante sea completamente independiente, original y libre de contaminación por derechos de autor o propiedad intelectual proveniente de aplicaciones comerciales o privativas preexistentes (específicamente FlowPrompter Desktop).

### 1.1 Metodología de Separación
1. **Lado "Sucio" (Quarantine / Dirty Room)**:
   - Artefactos analizados exclusivamente para identificar requisitos funcionales de alto nivel y comportamientos de API pública del sistema operativo Windows.
   - **Registro de Cuarentena Obligatoria**:
     * Directorio `temp_analysis/` (contiene bundles de JavaScript compilados/minificados: `index-B0Sepov5.js`, `index-BlOVkk9p.js`, `index.js`).
     * Archivo `package.legacy.json` (manifiesto de `@flowprompter/desktop` v2.0.54, autor `yuanze-dev`).
   - **Regla Inviolable**: Ningún archivo, fragmento de código, función, estilo CSS, esquema de datos interno ni activo gráfico presente en el Registro de Cuarentena será copiado, importado, traducido o reutilizado en el nuevo proyecto.
   - **Aislamiento en VCS**: Tanto `temp_analysis/` como el `package.legacy.json` heredado quedan excluidos del control de versiones mediante reglas explícitas en `.gitignore`.

2. **Lado "Limpio" (Clean Room)**:
   - Los ingenieros e implementadores del nuevo proyecto operan exclusivamente a partir de:
     * Especificaciones funcionales y requisitos de usuario documentados en este Vault.
     * Documentación oficial y pública de Microsoft Learn (APIs Win32 DWM).
     * Documentación oficial de Tauri 2, Rust y librerías de código abierto con licencia permisiva (MIT/Apache-2.0).
     * Estándares W3C y especificaciones abiertas de la industria.

---

## 2. Requisitos Funcionales del Teleprompter Invisible

A partir del análisis de las necesidades del usuario y la observación de comportamiento en sistemas de videoconferencia y grabación de escritorio, se definen los siguientes requisitos funcionales esenciales:

### 2.1 Invisibilidad Total ante Capturas de Pantalla
- **Objetivo**: La ventana del teleprompter (HUD) debe ser visible en el monitor físico del usuario orador, pero **completamente invisible** para:
  * Aplicaciones de videoconferencia: Zoom, Microsoft Teams, Google Meet, Cisco Webex, Discord.
  * Software de transmisión y grabación: OBS Studio, Streamlabs, Camtasia, vMix, Bandicam.
  * Herramientas de captura de pantalla: Windows Snipping Tool, ShareX, Lightshot, print screen nativo.
- **Transparencia en el Buffer de Captura**: El área ocupada por el teleprompter en la pantalla no debe mostrarse como un rectángulo negro ni generar artefactos visuales; debe renderizar limpiamente las ventanas y el fondo de escritorio que se encuentran por debajo del HUD.

### 2.2 Arquitectura Multi-Ventana Desacoplada
La aplicación requiere dos ventanas especializadas con responsabilidades separadas:
1. **Launcher / Administrador (Ventana de Gestión)**:
   - Ventana estándar con decoración de ventana (o barra de título personalizada moderna).
   - Estilo visual de vidrio oscuro (*dark glassmorphism*).
   - Gestión completa de guiones (crear, editar, renombrar, duplicar, eliminar, importar archivos `.txt`/`.md`).
   - Ajuste de configuración (velocidad predeterminada, tamaño de tipografía, margen de lectura, opacidad del HUD, combinaciones de teclas de atajos globales).
   - Botón de activación del HUD ("Lanzar Prompter") y control de estado sincronizado.

2. **Prompter HUD (Ventana Superpuesta de Lectura)**:
   - Ventana sin bordes, transparente, flotante y con propiedad de mantenerse siempre visible sobre las demás aplicaciones (*Always on Top*).
   - Capacidad de desplazamiento suave continuo de texto a 60/144 Hz acelerado por hardware (GPU).
   - Guía visual central o indicador de línea de lectura para mantener la mirada fija en el objetivo de la cámara.
   - Posibilidad de redimensionar y reposicionar la ventana cerca del lente de la cámara web para lograr contacto visual natural.

### 2.3 Operación Invariante al Foco (Focus-Invariance)
- **Problema Observado**: Durante una presentación en vivo, el orador está compartiendo diapositivas (PowerPoint, Keynote), navegando por una página web o programando en un editor de código. Si presiona una tecla para pausar o acelerar el teleprompter y la ventana del teleprompter "roba" el foco del teclado, la presentación o la interacción en pantalla se interrumpe abruptamente.
- **Requisito Técnico**:
  * La ventana HUD del prompter nunca debe tomar el foco del teclado al mostrarse, reanudarse o interactuar con ella (`WS_EX_NOACTIVATE`, `SW_SHOWNOACTIVATE`).
  * Todos los atajos de control (Play/Pause, Acelerar, Desacelerar, Rebobinar, Mostrar/Ocultar) deben registrarse como **atajos globales a nivel del sistema operativo**, procesándose en segundo plano sin alterar la ventana activa en primer plano (`GetForegroundWindow`).

### 2.4 Modo Click-Through Interactivo
- **Comportamiento**: En situaciones donde el HUD cubre controles de la pantalla compartida (por ejemplo, botones de una presentación o controles de una demo en vivo), el usuario debe poder activar el modo *Click-Through*.
- En este modo, todos los clics y movimientos del ratón atraviesan visualmente el teleprompter e interactúan con la aplicación que está por debajo, sin cerrar ni interrumpir la lectura del texto.

### 2.5 Persistencia Local Atómica y Cero Telemetría
- La aplicación es 100% *local-first* y privada:
  * Guiones guardados en disco local en formato JSON estructurado (`scripts/*.json`).
  * Configuración persistida en `%APPDATA%\<app-id>\settings.json`.
  * Escritura atómica (guardado en archivo `.tmp` + rename atómico) para prevenir corrupción de datos ante caídas o apagados abruptos.
  * **Cero telemetría**: A diferencia de las aplicaciones comerciales basadas en Electron que integran rastreadores como Sentry, PostHog o Intercom, esta solución no realiza ninguna petición de red no solicitada.

---

## 3. Mecánica Técnica de Invisibilidad en Win32 (DWM)

### 3.1 El Rol del Desktop Window Manager (DWM)
En Windows 10 y 11, el subsistema de composición gráfica Desktop Window Manager (DWM) es responsable de componer todas las superficies de ventana aceleradas por hardware en el framebuffer final que se envía a la tarjeta gráfica.

Cuando una aplicación de captura (como OBS, Zoom o Windows Graphics Capture API) solicita una captura de pantalla, el DWM genera un flujo de fotogramas a partir de su árbol de composición de ventanas.

### 3.2 La API `SetWindowDisplayAffinity`
Microsoft proporciona una API Win32 nativa en `user32.dll` específicamente diseñada para controlar la afinidad de visualización de una ventana en el pipeline del DWM:

```c
BOOL SetWindowDisplayAffinity(
    HWND  hWnd,
    DWORD dwAffinity
);
```

#### Valores de Afinidad y Comportamiento en Windows
| Constante | Valor Hex | Valor Decimal | Versión Mínima de Windows | Comportamiento en Capturas / Screen Sharing |
|---|---|---|---|---|
| `WDA_NONE` | `0x00000000` | `0` | Windows 7 | Comportamiento normal. La ventana se incluye y es plenamente visible en todas las capturas. |
| `WDA_MONITOR` | `0x00000001` | `1` | Windows 7 | La ventana solo se dibuja en la salida del monitor físico. En capturas de pantalla o grabaciones, el área de la ventana se renderiza como un **rectángulo completamente negro**. |
| `WDA_EXCLUDEFROMCAPTURE` | `0x00000011` | `17` | **Windows 10 Versión 2004 (Build 19041)** o superior | **La ventana es completamente excluida del buffer de composición de captura**. El DWM renderiza lo que esté detrás de la ventana exactamente como si la ventana no existiera. |

#### Matriz de Compatibilidad y Estrategia de Fallback
1. **Windows 10 Build >= 19041 y Windows 11**:
   - `SetWindowDisplayAffinity(hwnd, 0x00000011)` se ejecuta con éxito.
   - Invisibilidad total transparente lograda.
2. **Windows 10 Build < 19041**:
   - `0x00000011` no está soportado por el kernel DWM antiguo.
   - Fallback automático a `WDA_MONITOR` (`0x00000001`): el prompter protege el contenido mostrándose negro en capturas en vez de transparente, informando al usuario en los logs.
3. **Sistemas No-Windows (macOS / Linux)**:
   - En macOS, la propiedad equivalente en Cocoa es `NSWindow.sharingType = .none` (excluye la ventana de grabaciones del sistema).
   - En Linux (X11 / Wayland), no existe un estándar universal análogo en los compositores.
   - La arquitectura desacoplará esta lógica en Rust mediante el trait `WindowPlatform`, garantizando que la aplicación compile y ejecute con mocks o stubs adecuados en cualquier plataforma.

### 3.3 Estilos Extendidos de Ventana Win32 (`GWL_EXSTYLE`)
Para que la ventana HUD cumpla con sus requerimientos de transparencia, flotabilidad e invariancia de foco, deben configurarse los siguientes estilos mediante `GetWindowLongPtrW` y `SetWindowLongPtrW`:

```c
// Estilos requeridos para la ventana HUD:
WS_EX_TOPMOST     = 0x00000008; // Siempre sobre otras ventanas
WS_EX_TRANSPARENT = 0x00000020; // Hit-testing pass-through (modo Click-Through)
WS_EX_TOOLWINDOW  = 0x00000080; // No aparece en barra de tareas ni Alt+Tab
WS_EX_LAYERED     = 0x00080000; // Ventana por capas con canal alfa por píxel
WS_EX_NOACTIVATE  = 0x08000000; // No toma el foco al hacer clic con el mouse
```

Y para mostrar la ventana sin transferir el foco del teclado:
```c
ShowWindow(hwnd, SW_SHOWNOACTIVATE); // SW_SHOWNOACTIVATE = 4
```

---

## 4. Comparativa Arquitectónica: Electron vs. Tauri 2 + Rust

La siguiente tabla resume las diferencias radicales entre la arquitectura pesada privativa observada en FlowPrompter y la nueva arquitectura limpia en Tauri 2 + Rust:

| Dimensión Técnica | FlowPrompter (Electron Legacy) | Nueva Arquitectura (Tauri 2 + Rust + SolidJS) | Beneficio para el Usuario / Proyecto |
|---|---|---|---|
| **Motor Base** | Chromium completo + Node.js embebido | Native Windows WebView2 + Backend Rust nativo | Eliminación de ~100MB de runtime innecesario. |
| **Consumo de Memoria (RAM)** | ~120 MB - 180 MB en reposo | **~15 MB - 25 MB** en ejecución activa | **>85% de ahorro de memoria**, ideal para streamers con recursos limitados. |
| **Tamaño de Distribución** | ~80 MB - 120 MB (instalador) | **~5 MB - 10 MB** (instalador `.msi` / `.exe`) | Descarga instantánea y menor huella de disco. |
| **Invocación Win32** | Librería dinámica FFI (`koffi` / `node-ffi`) | Crate `windows` de Rust compilado nativo | Cero sobrecarga de serialización, tipado fuerte y cero riesgo de crashes en el runtime de V8. |
| **Rendimiento de Scroll** | Virtual DOM pesado (React 18) | Reactividad granular sin VDOM (SolidJS) | Desplazamiento ultra-suave a 144Hz con 0% de uso perceptible de CPU. |
| **Telemetría y Privacidad** | Sentry, PostHog, Intercom, OpenTelemetry | **Cero telemetría** (100% privado y local) | Privacidad absoluta para reuniones confidenciales. |
| **Seguridad & Sandboxing** | Node.js con acceso amplio al sistema de archivos | Capabilities granulares de Tauri 2 con CSP estricto | Máxima seguridad contra inyección de scripts. |

---

## 5. Metodología de Verificación y Criterios de Aceptación

Para verificar técnica e independientemente el comportamiento de invisibilidad y rendimiento, se establecen las siguientes pruebas automatizadas:

1. **Prueba Automatizada de Píxel de Sonda (`Pixel Invisibility Probe`)**:
   - La ventana HUD del prompter se configura con un color de prueba de alto contraste único (magenta puro `#FF00FF` / RGB `255, 0, 255`).
   - Se activa la exclusión de captura `WDA_EXCLUDEFROMCAPTURE`.
   - Un script de verificación ejecuta una captura de pantalla completa del escritorio utilizando la API de Windows Graphics Capture o FFmpeg (`gdigrab`).
   - Se analiza el mapa de bits resultante: el conteo de píxeles con el valor de color `#FF00FF` debe ser **estrictamente cero (0)**.

2. **Prueba de Invariancia de Foco (`Focus Invariance Test`)**:
   - Una ventana de prueba externa (e.g., Notepad o PowerShell) se establece como ventana activa en primer plano (`GetForegroundWindow`).
   - Se disparan atajos globales de teclado para alternar visibilidad, reproducir y pausar el prompter.
   - Se verifica que el handle de ventana devuelto por `GetForegroundWindow` antes y después de cada acción permanezca idéntico.

3. **Prueba de Rendimiento y Recursos (`Resource Benchmark Test`)**:
   - Se mide el conjunto de trabajo de memoria de proceso (`WorkingSetPrivate`) y el porcentaje de CPU durante 60 segundos de scroll continuo.
   - El consumo de memoria debe mantenerse por debajo de 30 MB y el uso de CPU por debajo del 2% en sistemas multinúcleo modernos.
