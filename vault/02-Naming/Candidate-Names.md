---
title: Matriz de Candidatos de Naming y Disponibilidad Multiplataforma
tags:
  - naming
  - branding
  - clean-room
  - research
  - milestone-1
created: 2026-11-23
status: completed
author: explorer_m1_2
---

# 🏷️ Matriz de Naming: Candidatos, Disponibilidad y Selección Top 3

> **Referencia R1 / Clean-Room Engineering**: Documento de investigación y análisis de disponibilidad de nombres de proyecto en cumplimiento del Requisito R1. Ningún código o activo propietario de terceros ha sido incorporado. Todos los datos de disponibilidad fueron verificados empíricamente vía APIs y consultas HTTP directas el 23 de Noviembre de 2026.

---

## 1. Resumen Ejecutivo y Metodología de Evaluación

El objetivo de este análisis es seleccionar una identidad de marca contundente, memorable y 100% viable para el teleprompter de escritorio invisible desarrollado en **Tauri 2 + Rust**.

Para garantizar un lanzamiento libre de fricciones legales, colisiones de marca o secuestro de cuentas (typosquatting), cada candidato fue evaluado bajo cuatro vectores técnicos independientes:
1. **GitHub** (`github.com/<name>`): Disponibilidad del handle para usuario u organización oficial, y verificación de repositorios preexistentes con el mismo nombre.
2. **Twitter / X** (`x.com/<name>`): Disponibilidad del handle de redes sociales para la campaña de lanzamiento y comunicación con la comunidad.
3. **Crates.io** (`crates.io/crates/<name>`): Registro oficial de paquetes Rust, fundamental para la publicación de la librería core, CLI o crates auxiliares de la aplicación Tauri.
4. **npm** (`npmjs.com/package/<name>`): Registro oficial de paquetes Node/JavaScript, esencial para el frontend (SolidJS/Vite) o herramientas de integración.

### Criterios de Selección
- **Disponibilidad técnica (4/4 o 3/4 con mitigación clara)**: Prioridad a nombres con handle de organización libre en GitHub y registros limpios en crates.io y npm.
- **Claridad conceptual**: Capacidad del nombre para evocar la propuesta de valor única: *invisibilidad ante software de captura de pantalla (`WDA_EXCLUDEFROMCAPTURE`), ligereza y alto rendimiento*.
- **Identidad de marca y fonética**: Nombres cortos (1-3 sílabas), modernos, fáciles de pronunciar en inglés y español, y visualmente atractivos para isotipos y glassmorphism UI.

---

## 2. Matriz Comparativa de los 10 Candidatos

| # | Candidato | Crates.io | npm | GitHub (Org/User) | GitHub Repos Exactos | Twitter / X | Puntuación | Vibe & Categoría |
|---|---|---|---|---|---|---|---|---|
| 1 | **VeilCue** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 0 repos críticos (1 personal) | ✅ Disponible (404) | **4 / 4** 🌟 | Elegante, minimalista, moderno |
| 2 | **StealthPrompter** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 0 repos (Pizarra limpia) | ✅ Disponible (404) | **4 / 4** 🌟 | Máxima claridad técnica, SEO |
| 3 | **InvisiCue** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 0 repos (Pizarra limpia) | ⚠️ Ocupado (200) | **3 / 4** 🌟 | Pegadizo, ágil, creador |
| 4 | **WhisperCue** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 3 repos exactos | ✅ Disponible (404) | **4 / 4** | Sutil, discreto, asistente |
| 5 | **ShadowPrompter** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 1 repo exacto | ✅ Disponible (404) | **4 / 4** | Técnico, desarrollador, sigilo |
| 6 | **PrompterX** | ✅ Disponible | ✅ Disponible | ✅ Disponible (404) | 1 repo exacto | ⚠️ Ocupado (200) | **3 / 4** | Futurista, alta tecnología |
| 7 | **GhostCue** | ✅ Disponible | ✅ Disponible | ❌ Ocupado (200) | 5 repos exactos | ❌ Ocupado (200) | **2 / 4** | Fantasmagórico, sugestivo |
| 8 | **TeleGhost** | ✅ Disponible | ✅ Disponible | ❌ Ocupado (200) | 3 repos (17 parciales) | ❌ Ocupado (200) | **2 / 4** | Retro-futurista, vintage |
| 9 | **PhantomScript** | ✅ Disponible | ❌ Ocupado (200) | ❌ Ocupado (200) | 14 repos exactos | ✅ Disponible (404) | **2 / 4** | Literario, colisión scripts juegos |
| 10 | **AetherScript** | ✅ Disponible | ✅ Disponible | ❌ Ocupado (200) | 10 repos exactos | ❌ Ocupado (200) | **2 / 4** | Etéreo, suena a lenguaje de código |

---

## 3. Fichas de Detalle de los 10 Candidatos

### 1. VeilCue
- **Etimología & Concepto**: Fusión de *Veil* (velo, capa translúcida o invisible que oculta algo a la vista ajena) y *Cue* (indicación, pie de entrada o texto del teleprompter).
- **Vibe & Estética**: Sofisticado, premium, glassmorphism oscuro. Transmite la idea de un velo digital que solo el orador puede ver.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` (HTTP 404)
  - npm: `AVAILABLE` (HTTP 404)
  - GitHub: `AVAILABLE` (`github.com/veilcue` devuelve 404, organización libre; solo existe un repo personal sin estrellas).
  - Twitter / X: `AVAILABLE` (`x.com/veilcue` devuelve 404).
- **Pros**: Breve (7 letras, 2 sílabas), 100% libre en todos los canales oficiales, branding impecable para web y logo.
- **Contras**: Requiere asociar la palabra "Veil" con la exclusión de captura en el marketing inicial.
- **Dominios sugeridos**: `veilcue.dev`, `veilcue.app`.

### 2. StealthPrompter
- **Etimología & Concepto**: Fusión directa de *Stealth* (sigilo militar, indetectable por radar) y *Prompter* (apuntador / teleprompter).
- **Vibe & Estética**: Táctico, de alto rendimiento, ingenieril y utilitario.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` (HTTP 404)
  - npm: `AVAILABLE` (HTTP 404)
  - GitHub: `AVAILABLE` (`github.com/stealthprompter` devuelve 404; exactamente 0 repositorios en GitHub).
  - Twitter / X: `AVAILABLE` (`x.com/stealthprompter` devuelve 404).
- **Pros**: Máxima claridad de intención (cualquier usuario comprende exactamente qué es sin explicaciones previas). SEO orgánico extraordinario. Pizarra 100% limpia en GitHub y redes.
- **Contras**: Longitud de 15 caracteres (más largo que un nombre abstracto).
- **Dominios sugeridos**: `stealthprompter.com`, `stealthprompter.dev`.

### 3. InvisiCue
- **Etimología & Concepto**: Fusión de *Invisible* y *Cue*.
- **Vibe & Estética**: Dinámico, amigable para el creador de contenido, moderno y directo.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` (HTTP 404)
  - npm: `AVAILABLE` (HTTP 404)
  - GitHub: `AVAILABLE` (`github.com/invisicue` devuelve 404; 0 repositorios en GitHub).
  - Twitter / X: `TAKEN` (`x.com/invisicue` devuelve 200, cuenta antigua inactiva). Handle alternativo viable: `@invisicueapp`.
- **Pros**: Muy sonoro, fácil de recordar y pronunciar. Perfectamente enfocado en la invisibilidad de la ayuda de lectura.
- **Contras**: El handle exacto en Twitter/X está tomado, requiriendo sufijo como `app` o `hq`.
- **Dominios sugeridos**: `invisicue.app`, `invisicue.dev`.

### 4. WhisperCue
- **Etimología & Concepto**: *Whisper* (susurro, discreción que no llama la atención) y *Cue*.
- **Vibe & Estética**: Íntimo, sereno, enfocado en asistencia sutil y sin distracciones.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `AVAILABLE` (Org 404; 3 repos menores) | Twitter / X: `AVAILABLE` (404).
- **Pros**: Fonética suave, excelente disponibilidad.
- **Contras**: Puede generar confusión con los modelos de transcripción de audio "Whisper" de OpenAI.

### 5. ShadowPrompter
- **Etimología & Concepto**: *Shadow* (sombra, operar tras bambalinas) y *Prompter*.
- **Vibe & Estética**: Desarrollador, dark mode nativo, ciberseguridad.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `AVAILABLE` (Org 404; 1 repo) | Twitter / X: `AVAILABLE` (404).
- **Pros**: Muy descriptivo y con estética fuertemente inclinada a herramientas para hackers / desarrolladores.
- **Contras**: La palabra "Shadow" puede tener connotaciones de malware o shadow IT.

### 6. PrompterX
- **Etimología & Concepto**: *Prompter* con el sufijo *X* (modernidad, velocidad, nueva generación).
- **Vibe & Estética**: Alta tecnología, pro software.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `AVAILABLE` (Org 404; 1 repo) | Twitter / X: `TAKEN` (200).
- **Pros**: Directo y enérgico.
- **Contras**: La "X" está sobreutilizada tras el rebranding de Twitter y existen proyectos homónimos en desarrollo.

### 7. GhostCue
- **Etimología & Concepto**: *Ghost* (fantasma que atraviesa paredes sin ser visto) y *Cue*.
- **Vibe & Estética**: Lúdico, transparente, ágil.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `TAKEN` (Usuario registrado; 5 repositorios) | Twitter / X: `TAKEN` (200).
- **Pros**: Imagen visual potente (un fantasma estilizado como logo).
- **Contras**: Bloqueado tanto en organización de GitHub como en usuario de Twitter/X.

### 8. TeleGhost
- **Etimología & Concepto**: *Tele* (teleprompter) y *Ghost*.
- **Vibe & Estética**: Clásico de herramientas de streaming.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `TAKEN` (200; 17 repos) | Twitter / X: `TAKEN` (200).
- **Pros**: Fácil de recordar.
- **Contras**: Múltiples colisiones en GitHub y cuentas de redes sociales ocupadas.

### 9. PhantomScript
- **Etimología & Concepto**: *Phantom* y *Script* (guion fantasma).
- **Vibe & Estética**: Teatral y misterioso.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `TAKEN` (200) | GitHub: `TAKEN` (200; 14 repos) | Twitter / X: `AVAILABLE` (404).
- **Pros**: Nombre con carácter.
- **Contras**: Bloqueado en npm y fuertemente saturado en GitHub por scripts de automatización de videojuegos.

### 10. AetherScript
- **Etimología & Concepto**: *Aether* (el quinto elemento clásico, intangible y presente en el espacio) y *Script*.
- **Vibe & Estética**: Etereo, futurista, poético.
- **Disponibilidad Empírica**:
  - Crates.io: `AVAILABLE` | npm: `AVAILABLE` | GitHub: `TAKEN` (200; 10 repos) | Twitter / X: `TAKEN` (200).
- **Pros**: Sonoridad bella y conceptualmente rica.
- **Contras**: Suena a lenguaje de programación o DSL, no a una aplicación de teleprompter. Alta colisión en GitHub.

---

## 4. Selección Oficial del TOP 3

Tras cruzar los factores de disponibilidad técnica, fuerza de marca, claridad funcional y facilidad de registro, se presentan los tres mejores candidatos:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             TOP 3 CANDIDATOS                                │
├─────┬──────────────────┬─────────────────┬─────────────────┬────────────────┤
│ #   │ Candidato        │ Disponibilidad  │ Estilo Visual   │ Enfoque        │
├─────┼──────────────────┼─────────────────┼─────────────────┼────────────────┤
│ 🥇  │ VeilCue          │ 4/4 (Pleno)     │ Dark Glass / V  │ Marca Premium  │
│ 🥈  │ StealthPrompter  │ 4/4 (Pleno)     │ Minimal / HUD   │ SEO y Claridad │
│ 🥉  │ InvisiCue        │ 3/4 (Alta)      │ Fluido / Glow   │ Creador Ágil   │
└─────┴──────────────────┴─────────────────┴─────────────────┴────────────────┘
```

### 🥇 1. VeilCue (Opción Recomendada — Elegancia y Marca Global)
- **Razón Principal**: Es el nombre más balanceado, moderno y estilizado. Tiene disponibilidad perfecta en todas las plataformas técnicas (GitHub handle y organización libres, Twitter/X libre, Crates.io libre, npm libre). Permite diseñar un isotipo icónico (una "V" estilizada como un pliegue de cristal o velo que revela una guía de texto).
- **Propuesta de Identidad**:
  - *Tagline Oficial*: *"The invisible teleprompter veil for effortless presentations."*
  - *Repositorio GitHub*: `github.com/veilcue/veilcue`

### 🥈 2. StealthPrompter (Opción Funcional — Claridad Inmediata y SEO)
- **Razón Principal**: Puntuación perfecta 4/4 y cero repositorios existentes en todo GitHub. Su nombre describe el 100% de la funcionalidad principal sin necesidad de explicaciones. Para campañas de difusión técnica (Show HN, Reddit r/rust, Twitter), el nombre atrae inmediatamente a profesionales que sufren buscando cómo ocultar sus notas durante grabaciones u OBS.
- **Propuesta de Identidad**:
  - *Tagline Oficial*: *"Undetectable desktop teleprompter for seamless streaming and calls."*
  - *Repositorio GitHub*: `github.com/stealthprompter/stealthprompter`

### 🥉 3. InvisiCue (Opción de Creador — Sonora y Accesible)
- **Razón Principal**: Es sumamente pegadizo y combina la palabra "Invisible" con "Cue" de forma natural. Dispone de Crates.io, npm y GitHub totalmente limpios. Ideal si se busca un tono más amigable, cercano a podcasters, educadores y creadores de contenido digital.
- **Propuesta de Identidad**:
  - *Tagline Oficial*: *"Invisible lines, flawless delivery."*
  - *Repositorio GitHub*: `github.com/invisicue/invisicue`

---

## 5. Presentación al Usuario en Español (Pitch para Selección Final)

> **Nota de Comunicación**: En cumplimiento del Requisito R4 y las pautas del proyecto, la interacción con el usuario se formula en español neutro, claro y profesional, lista para ser enviada por el orquestador principal.

---

### 💬 Propuesta para el Usuario

**Asunto**: Selección del Nombre Oficial del Proyecto — Top 3 Candidatos Verificados

Hola,

Hemos completado el análisis exhaustivo de naming y disponibilidad técnica para nuestro teleprompter invisible en **Tauri 2 + Rust**. 

Tras auditar 10 propuestas contra los registros oficiales de **GitHub**, **Twitter / X**, **Crates.io** y **npm**, identificamos los **3 mejores candidatos** que garantizan disponibilidad de marca y un posicionamiento impecable:

---

#### Opción 1: `VeilCue` 🥇 (Recomendación del Equipo)
- **Lema**: *"El velo invisible que sostiene tus palabras."*
- **Disponibilidad**: **4 / 4 Disponible** (GitHub libre, Twitter/X libre, Crates.io libre, npm libre).
- **Por qué nos encanta**: Es corto (7 letras, 2 sílabas), elegante y memorable. "Veil" (velo) evoca la capa translúcida invisible para las grabaciones y videollamadas, mientras que "Cue" es el término estándar para la asistencia de lectura. Encaja a la perfección con la interfaz dark glassmorphic de nuestra app.

#### Opción 2: `StealthPrompter` 🥈 (Máxima Claridad y SEO)
- **Lema**: *"El teleprompter invisible de grado táctico: indetectable en pantalla, implacable en rendimiento."*
- **Disponibilidad**: **4 / 4 Disponible** (Pizarra 100% limpia en GitHub con 0 repos existentes, Twitter/X libre, Crates.io libre, npm libre).
- **Por qué nos encanta**: Comunica exactamente qué hace la aplicación en el primer segundo. Es ideal para posicionamiento orgánico en motores de búsqueda, Show HN y comunidades de desarrolladores que buscan una solución directa a las capturas de pantalla.

#### Opción 3: `InvisiCue` 🥉 (Ágil y Enfocado a Creadores)
- **Lema**: *"Líneas invisibles para presentaciones memorables."*
- **Disponibilidad**: **3 / 4 Disponible** (GitHub libre con 0 repositorios previos, Crates.io libre, npm libre; Twitter requiere handle alternativo como `@invisicueapp`).
- **Por qué nos encanta**: Suena moderno, fresco y enérgico. Fusiona "Invisibility" y "Cue" de forma armónica, ideal para creadores de contenido, streamers y directivos en reuniones remotas.

---

**¿Cuál de estos tres nombres prefieres para inicializar el repositorio oficial y la identidad de marca del proyecto?**

1. **`VeilCue`**
2. **`StealthPrompter`**
3. **`InvisiCue`**

Quedamos a la espera de tu elección para registrar el repositorio y avanzar con la arquitectura del sistema.

---

## 6. Trazabilidad y Enlaces del Vault

- [[00-Index|Mapa Maestro del Vault]]: Índice central de navegación.
- [[Log|Bitácora Diaria de Trabajo]]: Registro cronológico de actividades y decisiones.
- [[01-Analisis/Clean-Room-Analysis|Análisis Clean-Room]]: Ingeniería inversa funcional de exclusión de captura Win32.
- [[03-Arquitectura/ADR-001-Stack-Tauri2-Rust|ADR-001]]: Selección tecnológica de Tauri 2 + Rust + SolidJS.
