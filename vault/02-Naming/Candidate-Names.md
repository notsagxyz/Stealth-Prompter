---
title: Matriz de Candidatos de Naming y Disponibilidad Multiplataforma
tags:
  - naming
  - branding
  - clean-room
  - research
  - milestone-1
created: 2026-11-23
updated: 2026-11-25
status: completed
---

# 🏷️ Matriz de Naming: Candidatos, Disponibilidad en Vivo y Selección de Slug

> **Nota Clean-Room & Verificación**: Análisis original de naming y disponibilidad técnica. Ningún código o activo propietario de terceros ha sido incorporado. Los datos iniciales del `2026-11-23` fueron auditados nuevamente en vivo el **`2026-11-25T23:11:10Z`** mediante consultas HTTP directas (GitHub API, npm Registry, Crates.io API, X/Twitter, DNS `NS` y RDAP).

---

## 1. Resumen Ejecutivo y Metodología (R4)

Tras la directriz **R4** de renombrar la aplicación en pantalla a **Stealth** y comercializarla públicamente como **Stealth Prompter**, se realizó una auditoría en vivo de los slugs candidatos (`stealthprompter`, variante con guion, `stealth`, `getstealth`, `stealth-app`) en todos los registros técnicos y dominios:

1. **GitHub** (`api.github.com/users/<slug>` y `search/repositories?q=<slug>+in:name`)
2. **npm** (`registry.npmjs.org/<slug>`)
3. **Crates.io** (`crates.io/api/v1/crates/<slug>`)
4. **X / Twitter** (`x.com/<slug>` + búsqueda web)
5. **Dominios DNS/RDAP** (`.com`, `.dev`, `.app`, `.io`)

---

## 2. Verificación en Vivo de Slugs para Stealth (`2026-11-25T23:11:10Z`)

### 2.1 Registros, GitHub y Redes Sociales

| Slug | GitHub User/Org (`users/<slug>`) | GitHub Repos Exactos | npm | crates.io | X / Twitter | Veredicto |
|---|---|---|---|---|---|---|
| **`stealthprompter`** | ✅ **LIBRE (`HTTP 404`)** | ✅ **0 repos (`total_count: 0`)** | ✅ **LIBRE (`HTTP 404`)** | ✅ **LIBRE (`HTTP 404`)** | ✅ **LIBRE (`HTTP 404`, 0 resultados)** | **GANADOR UNIFICADO** |
| `variante con guion` | ❌ **OCUPADO (`HTTP 200`)** — usuario ocupado en GitHub | ❌ **OCUPADO (`total_count: 3`)** | ✅ LIBRE (`404`) | ✅ LIBRE (`404`) | `HTTP 404` | Descartado por colisión en GitHub |
| `stealth` | ❌ **OCUPADO (`HTTP 200`)** — usuario `stealth` (`id: 1227710`) | ❌ **OCUPADO (`11,380` repos)** | ❌ **OCUPADO (`200`)** | ✅ LIBRE (`404`) | ❌ **OCUPADO (`200`)** | Genérico saturado como slug; válido solo como nombre in-app **Stealth** |
| `getstealth` | ✅ LIBRE (`404`) | ✅ 0 repos | ✅ LIBRE (`404`) | ✅ LIBRE (`404`) | ❌ **OCUPADO (`200`)** | Colisión en X y `.com`/`.app` |
| `stealth-app` | ✅ LIBRE (`404`) | ❌ **OCUPADO (`111` repos)** | ✅ LIBRE (`404`) | ✅ LIBRE (`404`) | ❌ `@stealthapp` **OCUPADO (`200`)** | Saturado en GitHub/X/dominios |

### 2.2 Disponibilidad de Dominios (DNS `NS` + RDAP)

| Dominio | DNS `NS` (`Resolve-DnsName`) | RDAP (`rdap.org` / Verisign) | Estado |
|---|---|---|---|
| **`stealthprompter.com`** | `NXDOMAIN` | `HTTP 404` | ✅ **DISPONIBLE** |
| **`stealthprompter.dev`** | `NXDOMAIN` | `HTTP 404` | ✅ **DISPONIBLE** |
| **`stealthprompter.app`** | `NXDOMAIN` | `HTTP 404` | ✅ **DISPONIBLE** |
| **`stealthprompter.io`** | `NXDOMAIN` | `HTTP 404` | ✅ **DISPONIBLE** |
| `variante-con-guion.{com,dev,app}` | `NXDOMAIN` | `HTTP 404` | Disponible (pero descartado por colisión GitHub) |
| `getstealth.com` / `getstealth.app` | `NS_FOUND` | `HTTP 200 REGISTERED` | ❌ **OCUPADO** (`getstealth.dev` libre) |
| `stealth.dev` / `stealth.app` | `NS_FOUND` | Registrado | ❌ **OCUPADO** |
| `stealth-app.com` | `NS_FOUND` | Registrado | ❌ **OCUPADO** |

### 2.3 Búsqueda Web de Colisiones Comerciales
- **Hallazgo web (`Grow With Newman`)**: Existe una herramienta web propietaria para móviles llamada *"Stealth Prompter"* dentro de la suite de marketing *Grow With Newman* (`growwithnewman.com`) orientada a subtítulos quemados junto a la cámara frontal en navegador móvil.
  - **Impacto**: No es una app de escritorio nativa (Tauri/Rust/Win32 `WDA_EXCLUDEFROMCAPTURE`), no es open-source, y **no posee** ni el slug `stealthprompter` en GitHub/npm/crates.io/X ni los dominios `stealthprompter.{com,dev,app,io}`.
- **Otras utilidades open-source con "Stealth"**: `Thairu-dev/StealthIt`, `vortechron/stealth`, `suxrobGM/stealth-code`, `alexandrmotologa/stealth-voice-copilot`. Ninguna utiliza el slug `stealthprompter`.

---

## 3. Matriz Histórica de Candidatos Explorados (Fase Inicial)

| # | Candidato | Estado Crates/npm/GitHub | Notas |
|---|---|---|---|
| 1 | **Stealth / Stealth Prompter (`stealthprompter`)** | **4/4 Libre + 4 dominios libres** | **Elegido**: marca corta in-app (**Stealth**), nombre comercial claro (**Stealth Prompter**) y slug único limpio (`stealthprompter`). |
| 2 | **VeilCue** | Libre (`veilcue`) | Elegante y abstracto; descartado frente a la claridad directa de **Stealth Prompter**. |
| 3 | **InvisiCue** | Ocupado en X (`200`) | Descartado por handle tomado. |
| 4 | **WhisperCue** | Libre | Riesgo de confusión con modelos de audio OpenAI Whisper. |
| 5 | **ShadowPrompter** | Libre | Connotación cercana a "shadow IT". |
| 6–10 | **PrompterX / GhostCue / TeleGhost / PhantomScript / AetherScript** | Colisiones en GitHub / npm / X | Descartados por saturación en registros. |

---

## 4. Trazabilidad del Vault
- [[00-Index|Mapa Maestro del Vault]]
- [[02-Naming/Decision|Decisión Final de Marca y Reglas R4]]
- [[Log|Bitácora de Trabajo]]
