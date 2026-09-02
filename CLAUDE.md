# CLAUDE.md — Guía operativa y plan de trabajo

App: **Bitácora** — PWA mono-usuario de seguimiento de hábitos. Ver `ESPEC.md` para el detalle completo de requerimientos. Este archivo es el plan de ejecución: qué construir, en qué orden, y las reglas que no se negocian.

---

## Reglas que no se negocian

1. **Cero lógica de negocio en componentes.** Scoring, agregaciones, rachas → `src/domain/` como funciones puras (sin React, sin Dexie).
2. **Cero metas hardcodeadas.** Todo sale del objeto `Goals`.
3. **Cero red en runtime.** Nada de fetch, analytics, fuentes o CDNs externos. Todo empaquetado local.
4. **Todo el texto de UI en es-CL.** Fechas en formato local.
5. **Semana ISO lunes→domingo. Zona horaria `America/Santiago`.** Fechas se guardan como `YYYY-MM-DD` local, nunca UTC crudo.
6. **TypeScript `strict`, sin `any` en el dominio.**
7. **Cobertura ≥80% en `src/domain/`.**

Orden de construcción de cada feature: **dominio + tests → capa de datos → UI.** Nunca al revés.

---

## Stack y sustituciones recomendadas

El repo está vacío, así que "ya instalado" = nativo del navegador o ya incluido por otra dependencia del stack. Antes de agregar una librería, revisar si algo del stack ya lo cubre.

| Capa | Spec dice | Recomendación |
|------|-----------|---------------|
| Framework/Build | React 18 + TS strict + Vite | **Sin cambios.** |
| PWA | `vite-plugin-pwa` | **Sin cambios.** Genera manifest + service worker. |
| Estilos | Tailwind | **Sin cambios.** |
| Persistencia | Dexie.js | **Sin cambios.** Es el núcleo. |
| **Estado** | Zustand | **Reemplazable.** `useLiveQuery` de `dexie-react-hooks` (viene con Dexie) hace que la UI reaccione a la BD sin store global. Zustand solo aporta valor para estado *no persistido* (tema activo, tab actual). **Empezar sin Zustand**; agregarlo solo si aparece estado global que no vive en Dexie. Ver [nota Estado](#nota-estado). |
| **Gráficos** | Recharts | **Usar con cuidado.** Recharts pesa ~100 KB gzip y choca con RNF-03 (<300 KB). Mitigaciones: (a) el **heatmap mensual NO es un gráfico** → CSS grid puro, sin librería; (b) cargar Recharts con `lazy()` solo en las vistas de tendencia; (c) los "anillos" del dashboard son SVG a mano (un `<circle>` con `stroke-dasharray`), no Recharts. Reevaluar uPlot (~10 KB) si el bundle se pasa. Ver [nota Gráficos](#nota-gráficos). |
| **Fechas** | date-fns + locale `es` | **Mantener** para semanas ISO. Pero: como guardamos `YYYY-MM-DD` local y nunca UTC, casi no hay aritmética de zona horaria. `Intl.DateTimeFormat('es-CL')` (nativo) cubre el formateo de display sin importar de date-fns. Ojo con DST (RNF-22): solo afecta el cálculo de horas de sueño que cruzan la noche del cambio de hora → aislarlo en `dates.ts`. |
| **Validación import** | Zod | **Mantener.** RNF-23 lo exige y no hay equivalente nativo razonable. |
| Notificaciones | Notification API | **Nativa, sin librería.** (RF-905) |
| Fotos | Blob en IndexedDB | **Nativo.** Guardar el `Blob` directo, `URL.createObjectURL` para mostrar. Convertir a base64 solo al exportar (RF-902). |
| Tests | Vitest + RTL | **Sin cambios.** |

**Dependencias que probablemente NO necesitas:** Zustand (al inicio), cualquier lib de anillos/progreso (SVG a mano), cualquier lib de calendario (CSS grid), moment/luxon (date-fns basta).

---

## Fase 1 — MVP usable

**HU:** 01, 02, 03, 04, 05, 11. Al terminar, la app sirve para uso diario.

### 1.1 Andamiaje ✅
- [x] Vite 8 + React 19 + TS strict + Tailwind v4 (`@tailwindcss/vite`) + `vite-plugin-pwa` + Dexie. **oxlint** (default del scaffold, en vez de ESLint) + Vitest. *(Prettier omitido — oxlint cubre; agregar solo si hay peleas de formato.)*
- [x] Estructura de `§10` del spec (`domain/`, `db/`, `features/`, `components/`, `data/`, `app/`).
- [x] Manifest + iconos 192/512 (placeholder sólido; ícono real → Fase 4) + service worker cache-first (RNF-06, RNF-07).

### 1.2 Dominio (con tests primero) — `src/domain/` ✅ · 25 tests, cobertura 86.95%
- [x] `dates.ts`: semana ISO, `ISODate`/`ISOWeek`, cruce de medianoche, días transcurridos, `toISODate` en TZ Chile vía Intl. Tests: DST Chile, cruce de medianoche.
- [x] `goals.ts`: `Goals` + defaults (§2) + `DIMENSION_WEIGHTS`.
- [x] `scoring.ts`: 5 dimensiones (§7.2), índice semanal ponderado, índice diario (§7.3), `indexTier`. Tests: semana sin datos, azucarada doble, pisos en 0, sin NaN.

### 1.3 Datos — `src/db/` ✅
- [x] `schema.ts`: Dexie v1 + índices por fecha (RNF-04, RNF-10). Entidades Fase 1 de §7.1 (food, days, sleep, settings). Dedup por PK (`date`).
- [x] `repositories.ts` (agua/comida/sueño/ajustes) + `aggregate.ts` (arma `WeekAggregate`/`DayAggregate` para el dominio).

### 1.4 UI ✅
- [x] Onboarding (RF-907): **pantalla 0 con bifurcación** → `[Empezar de cero]` / `[Importar respaldo]` (deshabilitado "próximamente" hasta Fase 4). Aviso médico + estatura + peso inicial + metas por defecto.
- [x] Ajustes: editar todas las metas (RF-901).
- [x] Registro rápido: +Agua ±250 ml con deshacer (RF-201/202), comida rápida (RF-101), picoteo con tipo (RF-102), sueño con cruce de medianoche (RF-401..403).
- [x] Dashboard (RF-601..607): índice grande con color+texto, 5 anillos SVG, botones rápidos, "qué falta hoy", **estado vacío sin NaN**.

**Salida de fase:** ✅ tests verdes, build OK (103.94 KB gzip), dev server levanta. **Detenido para prueba del usuario antes de Fase 2.**

**Pendientes menores arrastrados a Fase 4 (marcados con `ponytail:` en código):** aviso visible de "actualizar" del SW (RNF-06), ícono real, corrección DST en horas de sueño (hoy reloj de pared, ±1 h esa noche).

---

## Fase 2 — Entrenamiento y cuerpo

**HU:** 06, 07, 08, 09. · Esquema Dexie v2 (aditiva) con `workouts`, `exercises`, `body`.
- [x] Seed de biblioteca de ejercicios (`data/exercises.seed.ts`) con `safeForScoliosis` y `warning`. Se siembra en el primer arranque (`ensureExerciseSeed`).
- [x] Sesión de fuerza (`features/training/`): series/reps/peso/segundos según `metric`; **confirmación extra si `safeForScoliosis: false`** (RF-306, vía `confirm()`). Badge ⚠ escoliosis en la biblioteca.
- [x] Natación con RPE (RF-301). Contadores M5/M6 de la semana (RF-307).
- [x] Peso (1/día, reemplaza) y medidas (`features/body/`) (RF-501/502). Gráficos: peso con media móvil 7d + cintura destacada, variaciones vs. 4 semanas / inicio (RF-504/505/506). **Chart SVG a mano — NO se usó Recharts** (respeta RNF-03; bundle 108 KB gzip). Dominio `body.ts` con tests.

- [x] Editar/eliminar registros + retroactivo hasta 30 días (RF-105/106, HU-08). Pantalla `features/day/DayView.tsx`: selector de fecha (hoy…−30), lista de registros del día con borrar en vivo, y `QuickLog` parametrizado con fecha para registro retroactivo. Editar = borrar + re-registrar (sueño/cuerpo se reemplazan por PK de fecha).
- [x] Plantillas de rutina (RF-308) + progresión de carga (RF-309). Tabla `routines` (Dexie v3). En la sesión de fuerza: cargar/guardar/borrar plantillas (input inline, sin `prompt()`). Sección "Progresión de carga": selector de ejercicio → `LineChart` de peso/tiempo en el tiempo (`exerciseHistory`).

**Fase 2 completa.** Nav de 5 pestañas: Inicio, Entreno, Cuerpo, Día, Ajustes. Verificado en navegador (retroactivo, borrado en vivo, progresión). tsc limpio, 32 tests, build 111 KB gzip.

> **Fix aplicado en esta fase:** el `confirm()` de escoliosis es funcional pero el diseño (§8) pide un banner serio inline — reemplazar en el pulido de Fase 4.

---

## Fase 3 — Inteligencia del seguimiento

**HU:** 12, 13, 14.
- [ ] `summary.ts` (dominio + tests): resumen semanal determinista (§7.4). Fortalezas, debilidades, **exactamente una** acción por tabla de reglas. Empates: `sleep > training > nutrition > snacking > hydration`. <3 días registrados → "pocos datos". Texto factual, sin culpa (RF-707).
- [ ] Generación automática cada lunes 00:00 + bajo demanda + historial (RF-701/706).
- [ ] Vista mensual: heatmap CSS grid por índice diario, detalle al tocar, comparación mes anterior (RF-801..803).
- [ ] Rachas: sueño ≥7h y días con registro completo (RF-405, RF-605).

---

## Fase 4 — Robustez

**HU:** 10, 15, 16.
- [ ] Fotos de progreso (Blob) + comparador lado a lado (RF-503/507).
- [ ] Exportar JSON (fotos en base64) + importar con validación **Zod** (reemplazar/fusionar) + borrar con confirmación escrita (RF-902..904, RNF-23).
- [ ] Recordatorios locales opcionales (Notification API), off por defecto (RF-905).
- [ ] Pulido: modo claro/oscuro (RF-906), accesibilidad AA (RNF-16..18), presupuesto de bundle (RNF-03).

---

## Definition of Done (por HU)

Criterios de aceptación cumplidos · dominio con tests y `src/domain/` ≥80% · funciona offline y sobrevive recarga · usable con una mano a 375 px · pasa `tsc --noEmit` + ESLint + Prettier · estados vacío/carga/error resueltos (sin blanco ni NaN) · contraste AA en ambos temas.

---

## Notas de arquitectura

### Nota Estado
Flujo por defecto: escribes en Dexie → `useLiveQuery` re-renderiza. La UI optimista (RNF-02) escribe primero al estado local del componente y persiste después. Global store (Zustand) **solo si** aparece estado transversal que no pertenece a la BD.

### Nota Gráficos
- Anillos del dashboard → SVG a mano (`<circle stroke-dasharray>`), ~15 líneas, cero dependencias.
- Heatmap mensual → `grid grid-cols-7` de Tailwind, color por índice diario.
- Líneas/barras de tendencia (peso, sueño, índice 8 semanas) → Recharts con `lazy()`, cargado solo al entrar a esas vistas.
- Si el bundle supera 300 KB gzip (RNF-03), migrar las líneas a uPlot antes que romper el presupuesto.
