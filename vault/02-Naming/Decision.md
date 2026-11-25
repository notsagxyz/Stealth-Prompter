---
title: Decisión Final de Naming e Identidad de Marca — Stealth (Stealth Prompter)
tags:
  - naming
  - branding
  - decision
  - stealth
created: 2026-11-23
updated: 2026-11-25
---

# 🎯 Decisión Final de Marca: Stealth (Stealth Prompter)

## 1. Arquitectura Dual de Marca (R4)

Para combinar máxima concisión dentro de la interfaz con claridad inmediata en el lanzamiento público, el proyecto adopta una identidad dual limpia bajo un **único slug técnico**:

| Contexto | Nombre Oficial | Uso Obligatorio |
|---|---|---|
| **Dentro de la App / Binario / Títulos** | **`Stealth`** | `productName: "Stealth"`, barra del Launcher (`Stealth`), ventana HUD (`Stealth HUD`), ejecutable (`stealth.exe`), instalador y diálogos internos. |
| **Comercial / Público / Marketing** | **`Stealth Prompter`** | Título del `README.md`, descripción del repo, hilo de Twitter/X, Hacker News ("Show HN"), Product Hunt, Reddit y video de lanzamiento. |
| **Slug Único (Repos, Paquetes, Handle)** | **`stealthprompter`** | Repositorio GitHub (`stealthprompter`), handle X (`@stealthprompter`), paquete npm (`stealthprompter`), crate Rust (`stealthprompter`), dominios `stealthprompter.{com,dev,app,io}`. |
| **Identificador Tauri & Datos Locales** | **`com.stealth.desktop`** | `identifier` en `tauri.conf.json` y carpeta `%APPDATA%\com.stealth.desktop\` (con migración automática al arrancar desde la carpeta anterior para no perder guiones ni ajustes). |

---

## 2. Disponibilidad Verificada en Vivo (`2026-11-25T23:11:10Z`)

- **GitHub (`github.com/stealthprompter`)**: ✅ **DISPONIBLE** (`HTTP 404`, `0` repositorios exactos). *(Nota: el slug con guion `stealth-prompter` resultó ocupado por el usuario `Stealth-prompter`, por lo que `stealthprompter` sin guion es la elección definitiva).*
- **Twitter / X (`@stealthprompter`)**: ✅ **DISPONIBLE** (`HTTP 404` y 0 resultados en búsqueda web; sujeto a validación final al registrar la cuenta).
- **Crates.io (`stealthprompter`)**: ✅ **DISPONIBLE** (`HTTP 404`).
- **npm (`stealthprompter`)**: ✅ **DISPONIBLE** (`HTTP 404`).
- **Dominios (`stealthprompter.com`, `.dev`, `.app`, `.io`)**: ✅ **TODOS DISPONIBLES** (`NXDOMAIN` + RDAP `HTTP 404`).
- **Nota sobre colisión comercial no competidora**: Existe un widget móvil web llamado *"Stealth Prompter"* en la suite de marketing *Grow With Newman* (`growwithnewman.com`). No compite en escritorio nativo (Tauri 2 + Rust + exclusión DWM `WDA_EXCLUDEFROMCAPTURE`), es propietario y no posee `stealthprompter` en ningún registro técnico, dominio ni X.

---

## 3. Elementos de Identidad Visual & Mensajería

### Tagline Principal (Inglés)
> *"The open-source invisible teleprompter that stays hidden from screen sharing and recordings."*

### Tagline en Español
> *"El teleprompter de código abierto invisible al compartir pantalla y grabar."*

### Descripción Corta para GitHub (< 120 caracteres)
> `Stealth Prompter — Open-source invisible desktop teleprompter hidden from screen shares (Tauri 2 + Rust).` *(106 caracteres)*

### Paleta Oficial (Alineada con `vault/04-Diseno/Design-System.md`)
- **Fondo Base (`--bg`)**: `#0b0b12` (casi negro con leve matiz azulado/violeta).
- **Vidrio Oscuro (`--surface`)**: `rgba(255, 255, 255, 0.04)` con borde `1px rgba(255, 255, 255, 0.08)` y radios `22px` (ventana), `14px` (tarjetas), `999px` (píldoras).
- **Acento por Defecto (`--accent`)**: `#7c6cff` (**Violet**) + `--accent-glow: rgba(124, 108, 255, 0.35)`, configurable entre 6 presets (`Violet`, `Indigo`, `Crimson Stealth`, `Emerald`, `Amber`, `Cyan`).
- **Texto Principal (`--text`)**: `#f4f4f8` (contraste >17:1 sobre `#0b0b12`).

### Concepto de Icono (R5)
- Icono **100% original** minimalista y reconocible a `16px`, con temática ninja / sigilo sobre tile redondeado oscuro, trazo limpio y un único color de acento (3 conceptos SVG + selección documentados en M5).
