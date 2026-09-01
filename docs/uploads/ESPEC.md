# Bitácora — App de seguimiento de hábitos (PWA)

**Documento de especificación para desarrollo con Claude Code**
Versión 1.0 · Español (es-CL) · Fecha: 2026-09-01

---

## 1. Contexto y objetivo

App personal (mono-usuario) para registrar y monitorear la adherencia a un plan de recomposición corporal durante semanas y meses. El foco **no es el peso**, sino la **consistencia en los hábitos** que producen el cambio: reducir ultraprocesados, cortar el picoteo, hidratarse, entrenar fuerza + natación y dormir mejor.

**Perfil del usuario:** 1,80 m, rango 70–80 kg, escoliosis de 32°, mucho tiempo sentado, se acuesta tarde (≈4 AM), duerme 4–6 h, come comida rápida 3–4 veces por semana, nada 90 min los miércoles.

**Objetivo del producto:** que el usuario abra la app ≤60 segundos al día, registre lo que hizo, y reciba cada domingo un resumen honesto con sus **puntos fuertes y débiles** de la semana y **una sola acción concreta** para la siguiente.

**Principio de diseño rector:** registrar tiene que costar menos que no registrar. Cualquier acción diaria se completa en ≤3 toques desde la pantalla de inicio.

---

## 2. Metas medibles (configurables, con estos valores por defecto)

| ID | Meta | Valor por defecto | Unidad / periodo |
|----|------|-------------------|------------------|
| M1 | Comida rápida / delivery | ≤ 1 (tolerancia 2) | veces por semana |
| M2 | Snacks dulces / picoteo | ≤ 3 | veces por semana |
| M3 | Agua | ≥ 2000 (8 vasos de 250 ml) | ml por día |
| M4 | Bebidas azucaradas | 0 | por semana |
| M5 | Sesiones de fuerza | ≥ 2 | por semana |
| M6 | Natación | ≥ 1 sesión de 90 min | por semana |
| M7 | Horas de sueño | ≥ 7 | por noche |
| M8 | Hora de acostarse | ≤ 01:30 | hora local |
| M9 | Peso | mantener 70–80 | kg |
| M10 | Cintura | tendencia a la baja | cm |

> Todas las metas viven en un objeto de configuración editable desde Ajustes. **Ningún valor puede estar hardcodeado en los componentes.**

---

## 3. Alcance

### Dentro del alcance (v1)
- Registro diario de comida, picoteo, agua, entrenamiento y sueño.
- Registro periódico de peso y medidas corporales.
- Dashboard con estado general de la semana en curso.
- Resumen semanal automático con fortalezas, debilidades y una acción sugerida.
- Vistas de tendencia semanal y mensual.
- Biblioteca de ejercicios de fuerza segura para escoliosis, con marcado de contraindicados.
- Exportar / importar toda la base de datos como JSON.
- Funciona 100% offline, instalable como PWA.

### Fuera del alcance (v1)
- Cuentas de usuario, login y sincronización multi-dispositivo.
- Backend, servidor y cualquier envío de datos a terceros.
- Base de datos de alimentos con conteo de calorías o macros.
- Integración con wearables, Apple Health o Google Fit.
- Multiusuario, roles o compartir con un entrenador.
- Consejos médicos generados por IA.

### Advertencia obligatoria en el producto
La app muestra, en Ajustes y en el primer arranque, un aviso: *"Esta app es una herramienta de registro personal, no da consejo médico. Con escoliosis de 32°, valida tu rutina de fuerza con un kinesiólogo o traumatólogo antes de empezar."*

---

## 4. Stack técnico

| Capa | Elección | Motivo |
|------|----------|--------|
| Framework | React 18 + TypeScript (modo `strict`) | Ecosistema y tipado del dominio |
| Build | Vite | Rápido, PWA con `vite-plugin-pwa` |
| Estilos | Tailwind CSS | Iteración rápida, mobile-first |
| Estado | Zustand (o Context + reducer) | Estado simple, sin boilerplate |
| Persistencia | IndexedDB vía **Dexie.js** | Offline real, consultas por rango de fechas |
| Gráficos | Recharts | Líneas y barras de tendencia |
| Fechas | date-fns con locale `es` | Semanas ISO (lunes a domingo) |
| Tests | Vitest + React Testing Library | Lógica de scoring y componentes |
| Formato | ESLint + Prettier | Consistencia |

**Reglas técnicas:**
- Zona horaria fija: `America/Santiago`. Las fechas se guardan como `YYYY-MM-DD` en hora local, nunca como UTC crudo.
- La semana va de **lunes a domingo** (ISO 8601).
- Toda la lógica de negocio (scoring, agregaciones, rachas) vive en `src/domain/` como funciones puras, sin React ni Dexie adentro, para poder testearla sola.

---

## 5. Requerimientos funcionales

### RF-100 · Registro de alimentación
- **RF-101** Registrar una comida rápida / delivery con fecha, hora y nota opcional (dónde / qué).
- **RF-102** Registrar un episodio de picoteo dulce con fecha, hora y tipo (dulce, salado, cuchiflí, bebida azucarada).
- **RF-103** Marcar el día como "comí real" (mínimo 2 comidas caseras de comida real) con un solo toque.
- **RF-104** Ver el contador de comida rápida de la semana en curso contra la meta M1, con estado visual: verde (bajo meta), ámbar (en la meta), rojo (sobre la meta).
- **RF-105** Editar y eliminar cualquier registro de las últimas 7 días.
- **RF-106** Registrar retroactivamente en cualquier fecha pasada de hasta 30 días.

### RF-200 · Hidratación
- **RF-201** Sumar agua en incrementos de 250 ml con un botón grande (+1 vaso), y un botón de deshacer.
- **RF-202** Mostrar progreso del día contra la meta M3 con un indicador visual de llenado.
- **RF-203** Registrar bebidas zero y bebidas azucaradas por separado; las azucaradas cuentan contra M4.
- **RF-204** Ver el promedio de ml/día de los últimos 7 y 30 días.

### RF-300 · Entrenamiento
- **RF-301** Registrar una sesión de natación con duración en minutos y percepción de esfuerzo (RPE 1–10).
- **RF-302** Registrar una sesión de fuerza seleccionando ejercicios de una biblioteca precargada.
- **RF-303** Por cada ejercicio, registrar series, repeticiones y peso o duración (para isométricos como la plancha).
- **RF-304** Biblioteca precargada con al menos: plancha frontal, plancha lateral, puente de glúteos, bird-dog, dead bug, remo con mancuerna, dominadas o jalón, face pull, press de hombro, sentadilla goblet, peso muerto rumano con carga ligera.
- **RF-305** Cada ejercicio lleva metadatos: grupo muscular, nivel, `safeForScoliosis: boolean`, notas de ejecución y una advertencia cuando aplique.
- **RF-306** Los ejercicios con `safeForScoliosis: false` (ej. hiperextensiones cargadas, flexiones laterales con peso, sentadilla con barra pesada sin supervisión) aparecen marcados con advertencia visible y requieren confirmación adicional para registrarse.
- **RF-307** Mostrar sesiones de fuerza de la semana contra M5 y natación contra M6.
- **RF-308** Permitir crear una plantilla de rutina (ej. "Fuerza A — core y espalda") y registrarla completa con un toque, ajustando pesos después.
- **RF-309** Ver el historial de un ejercicio y su progresión de carga en el tiempo.

### RF-400 · Sueño
- **RF-401** Registrar hora de acostarse, hora de despertar y calcular las horas dormidas automáticamente (manejando el cruce de medianoche).
- **RF-402** Marcar calidad subjetiva del sueño (mala / regular / buena).
- **RF-403** Mostrar horas dormidas contra M7 y hora de acostarse contra M8.
- **RF-404** Gráfico de las últimas 4 semanas con horas dormidas y hora de acostarse superpuestas.
- **RF-405** Calcular y mostrar la **racha actual** de noches consecutivas con ≥7 h.

### RF-500 · Peso y medidas
- **RF-501** Registrar peso en kg con fecha (máximo un registro por día; el nuevo reemplaza al anterior).
- **RF-502** Registrar medidas: cintura (a la altura del ombligo), abdomen, cadera, pecho, brazo. Todas opcionales.
- **RF-503** Adjuntar foto de progreso opcional, guardada como Blob en IndexedDB, nunca subida a ningún servidor.
- **RF-504** Gráfico de peso con media móvil de 7 días como línea principal, y los puntos diarios en gris de fondo.
- **RF-505** Gráfico de cintura, destacado como la métrica más relevante para este caso (la báscula puede no moverse mientras la cintura baja).
- **RF-506** Mostrar variación vs. hace 4 semanas y vs. el inicio del registro.
- **RF-507** Comparador de fotos lado a lado entre dos fechas.

### RF-600 · Dashboard (pantalla de inicio)
- **RF-601** Mostrar el **Índice de Adherencia Semanal** (0–100) de la semana en curso, en grande, con color según el rango (ver §7).
- **RF-602** Mostrar 5 anillos o barras, uno por dimensión: Alimentación, Picoteo, Hidratación, Entrenamiento, Sueño, cada uno con su porcentaje de cumplimiento.
- **RF-603** Botones de registro rápido siempre visibles: +Agua, +Entrenamiento, +Sueño, +Comida rápida, +Picoteo.
- **RF-604** Mostrar qué falta hoy para cerrar el día ("te faltan 3 vasos", "no has registrado el sueño de anoche").
- **RF-605** Mostrar la racha actual de días con registro completo.
- **RF-606** Mini-gráfico de las últimas 8 semanas del índice, para ver la tendencia sin cambiar de pantalla.
- **RF-607** El dashboard debe renderizar y ser usable aunque no exista ningún dato (estado vacío con llamado a la acción, nunca un error ni un NaN).

### RF-700 · Resumen semanal
- **RF-701** Generar automáticamente el resumen de la semana cerrada cada lunes a las 00:00 hora local (y bajo demanda desde el historial).
- **RF-702** El resumen incluye: índice global, desglose por dimensión, comparación con la semana anterior (↑ / ↓ / =).
- **RF-703** Listar **2 a 3 puntos fuertes**: dimensiones con cumplimiento ≥80% o que mejoraron ≥15 puntos respecto de la semana anterior.
- **RF-704** Listar **2 a 3 puntos débiles**: dimensiones con cumplimiento <60% o que empeoraron ≥15 puntos.
- **RF-705** Proponer **exactamente una acción** para la semana siguiente, derivada de la dimensión más débil, mediante reglas explícitas y auditables (ver §7.4). Sin IA, sin llamadas de red.
- **RF-706** Historial navegable de todos los resúmenes semanales anteriores.
- **RF-707** El texto del resumen es factual y neutro. Nunca usa lenguaje culpabilizador, ni comentarios sobre el cuerpo, ni sugiere restringir la comida más allá de las metas configuradas.

### RF-800 · Vista mensual
- **RF-801** Calendario tipo heatmap del mes, con cada día coloreado por su índice diario.
- **RF-802** Tocar un día abre el detalle de todos sus registros.
- **RF-803** Totales del mes por dimensión y comparación con el mes anterior.

### RF-900 · Datos, ajustes y sistema
- **RF-901** Editar todas las metas de §2 desde Ajustes.
- **RF-902** Exportar toda la base de datos a un archivo `.json` descargable, incluyendo las fotos en base64.
- **RF-903** Importar un `.json` exportado, con opción de reemplazar todo o fusionar por fecha.
- **RF-904** Borrar todos los datos, con confirmación escribiendo una palabra.
- **RF-905** Recordatorios locales opcionales vía Notification API: registrar el sueño en la mañana, beber agua en la tarde, y aviso de "hora de dormir" 30 min antes de M8. Todo desactivado por defecto y sin push remoto.
- **RF-906** Modo oscuro y claro, siguiendo la preferencia del sistema y con override manual.
- **RF-907** Onboarding de primer uso: aviso médico, altura, peso inicial, y confirmación de las metas por defecto.

---

## 6. Requerimientos no funcionales

### Rendimiento
- **RNF-01** First Contentful Paint <1,5 s en un móvil de gama media, con la app ya instalada.
- **RNF-02** Cualquier acción de registro rápido responde en <100 ms percibidos (escritura optimista en UI, persistencia después).
- **RNF-03** El bundle inicial pesa menos de 300 KB gzip; los gráficos se cargan con `lazy`.
- **RNF-04** Las consultas de agregación (mes completo) resuelven en <200 ms con 2 años de datos, usando índices de Dexie por fecha.

### Disponibilidad y offline
- **RNF-05** Todas las funciones operan sin conexión. La app nunca hace llamadas de red en tiempo de ejecución.
- **RNF-06** Service worker con estrategia cache-first para el app shell; nueva versión detectada y aplicada con un aviso de "actualizar".
- **RNF-07** Instalable como PWA (manifest, iconos 192/512, `display: standalone`, tema y splash).

### Privacidad y datos
- **RNF-08** Cero telemetría, cero analytics, cero servicios de terceros en tiempo de ejecución. Sin fuentes externas: todo se empaqueta local.
- **RNF-09** Los datos, incluidas las fotos, no salen del dispositivo salvo por una exportación iniciada explícitamente por el usuario.
- **RNF-10** El esquema de la base lleva número de versión y migraciones de Dexie; una migración jamás destruye datos existentes.
- **RNF-11** La app advierte al usuario que borrar los datos del navegador elimina todo, y sugiere exportar cada mes.

### Usabilidad
- **RNF-12** Diseño mobile-first, usable con una mano; los botones primarios en el tercio inferior de la pantalla.
- **RNF-13** Área táctil mínima de 44×44 px.
- **RNF-14** Registro diario completo en ≤60 segundos y ≤3 toques por acción.
- **RNF-15** Todo el texto de la interfaz en español (es-CL), fechas en formato local.

### Accesibilidad
- **RNF-16** Contraste mínimo WCAG AA (4.5:1) en ambos temas.
- **RNF-17** Navegable por teclado con foco visible; roles y `aria-label` en controles de registro.
- **RNF-18** El estado nunca se comunica solo por color: siempre acompañado de texto, icono o valor numérico.

### Calidad y mantenibilidad
- **RNF-19** TypeScript en modo `strict`, sin `any` en el dominio.
- **RNF-20** Cobertura de tests ≥80% en `src/domain/` (scoring, agregaciones, rachas, cruce de medianoche del sueño).
- **RNF-21** Sin lógica de negocio dentro de componentes de UI.
- **RNF-22** Casos borde cubiertos por tests: semana sin datos, día duplicado, sueño que cruza medianoche, cambio de horario de verano en Chile, importación de un JSON corrupto.

### Seguridad
- **RNF-23** Toda entrada importada se valida con un esquema (Zod) antes de escribirse en la base.
- **RNF-24** Las fotos se guardan como Blob, nunca se renderiza HTML proveniente de datos del usuario.

---

## 7. Modelo de datos y reglas de negocio

### 7.1 Entidades (TypeScript)

```ts
type ISODate = string;   // "2026-09-01" en hora local America/Santiago
type ISOWeek = string;   // "2026-W36", semana ISO lunes–domingo

interface FoodEvent {
  id: string;
  date: ISODate;
  time?: string;                                  // "HH:mm"
  kind: 'fastfood' | 'snack_sweet' | 'snack_salty' | 'sugary_drink';
  note?: string;
  createdAt: number;
}

interface DayLog {
  date: ISODate;                                  // clave primaria
  waterMl: number;                                // acumulado del día
  realMealsLogged: boolean;                       // ≥2 comidas caseras reales
  zeroDrinks: number;
  note?: string;
}

interface Workout {
  id: string;
  date: ISODate;
  type: 'swim' | 'strength' | 'walk' | 'other';
  durationMin: number;
  rpe?: number;                                   // 1–10
  sets?: ExerciseSet[];                           // solo en 'strength'
  note?: string;
}

interface ExerciseSet {
  exerciseId: string;
  reps?: number;
  weightKg?: number;
  seconds?: number;                               // isométricos (plancha)
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: 'core' | 'back' | 'chest' | 'shoulders' | 'legs' | 'glutes' | 'arms';
  metric: 'reps' | 'time';
  safeForScoliosis: boolean;
  cue: string;                                    // clave de ejecución
  warning?: string;                               // se muestra si safeForScoliosis === false
  isCustom: boolean;
}

interface SleepLog {
  date: ISODate;                                  // fecha del DESPERTAR
  bedtime: string;                                // "HH:mm" — puede ser del día anterior
  wakeTime: string;                               // "HH:mm"
  hours: number;                                  // derivado, maneja cruce de medianoche
  quality: 'bad' | 'ok' | 'good';
}

interface BodyMetric {
  date: ISODate;
  weightKg?: number;
  waistCm?: number;
  abdomenCm?: number;
  hipCm?: number;
  chestCm?: number;
  armCm?: number;
  photoBlobId?: string;
}

interface Goals {
  fastFoodPerWeek: number;      // 1
  sweetSnacksPerWeek: number;   // 3
  waterMlPerDay: number;        // 2000
  sugaryDrinksPerWeek: number;  // 0
  strengthPerWeek: number;      // 2
  swimPerWeek: number;          // 1
  sleepHours: number;           // 7
  bedtimeLimit: string;         // "01:30"
  weightRangeKg: [number, number]; // [70, 80]
}

interface WeeklySummary {
  week: ISOWeek;
  score: number;                          // 0–100
  dimensions: Record<Dimension, number>;  // 0–100 cada una
  deltaVsPreviousWeek: number;
  strengths: string[];                    // 2–3
  weaknesses: string[];                   // 2–3
  action: string;                         // exactamente 1
  generatedAt: number;
}

type Dimension = 'nutrition' | 'snacking' | 'hydration' | 'training' | 'sleep';
```

### 7.2 Índice de Adherencia Semanal

Pesos de las dimensiones (deben sumar 100 y ser configurables):

| Dimensión | Peso |
|-----------|------|
| Alimentación (`nutrition`) | 25 |
| Picoteo (`snacking`) | 15 |
| Hidratación (`hydration`) | 15 |
| Entrenamiento (`training`) | 25 |
| Sueño (`sleep`) | 20 |

`score = Σ (puntaje_dimensión × peso) / 100`, redondeado al entero más cercano.

Cálculo de cada dimensión (0–100):

- **Alimentación** — según `n` = comidas rápidas de la semana y `m` = `goals.fastFoodPerWeek`:
  `n ≤ m → 100`; `n = m+1 → 60`; `n = m+2 → 30`; `n ≥ m+3 → 0`.
- **Picoteo** — `n` = eventos `snack_sweet` + `snack_salty` + `sugary_drink`:
  `n ≤ meta → 100`, luego `−20` por cada exceso, con piso en 0. Cada `sugary_drink` cuenta doble.
- **Hidratación** — promedio sobre los días transcurridos de `min(waterMl / meta, 1) × 100`. Un día sin registro cuenta como 0.
- **Entrenamiento** — `(min(fuerza, metaFuerza)/metaFuerza × 0.6 + min(natación, metaNatación)/metaNatación × 0.4) × 100`.
- **Sueño** — promedio por noche registrada de `horasScore × 0.7 + bedtimeScore × 0.3`, donde
  `horasScore` = 100 si `hours ≥ meta`, 0 si `hours ≤ meta − 2`, y lineal entre ambos;
  `bedtimeScore` = 100 si se acostó a la hora límite o antes, `−10` por cada 30 min de retraso, piso en 0.
  Las noches sin registro cuentan como 0 y el resumen lo señala como "sin datos" en vez de como fracaso.

**Semana en curso:** las dimensiones diarias (hidratación, sueño) se promedian sobre los **días transcurridos**, no sobre 7, para que el lunes no aparezca en rojo. Las semanales (alimentación, picoteo, entrenamiento) se muestran como progreso, con la etiqueta "proyectado" hasta el domingo.

**Rangos de color:** ≥85 excelente · 70–84 bien · 50–69 a medias · <50 flojo. Siempre acompañados de texto.

### 7.3 Índice diario (para el heatmap del mes)

`agua (25) + sin comida rápida ese día (20) + picoteo ≤1 ese día (15) + sueño ≥meta (25) + hubo entrenamiento (15)`.
Un día sin ningún registro se pinta como "sin datos" (gris), nunca como 0.

### 7.4 Reglas del resumen semanal (deterministas, sin IA)

1. Calcular las 5 dimensiones y el delta contra la semana anterior.
2. **Fortalezas**: dimensiones con puntaje ≥80, o con mejora ≥15 puntos. Ordenar por puntaje descendente, tomar hasta 3. Si ninguna califica, se destaca el mejor dato disponible ("registraste 6 de 7 días") en lugar de dejar la lista vacía.
3. **Debilidades**: dimensiones con puntaje <60, o con caída ≥15 puntos. Ordenar por puntaje ascendente, tomar hasta 3.
4. **Acción única**: tomar la dimensión de menor puntaje y aplicar su regla.

| Dimensión más débil | Acción propuesta |
|---------------------|------------------|
| `sleep` | "Esta semana adelanta la hora de acostarte 30 minutos respecto de tu promedio actual (X:XX → Y:YY). Solo eso." |
| `nutrition` | "Elige de antemano el día de comida rápida de esta semana y déjalo agendado. Los otros días, comida real." |
| `snacking` | "Saca los dulces del escritorio. Deja fruta o frutos secos a la vista en su lugar." |
| `hydration` | "Deja la botella de 1 L frente a la pantalla y llénala dos veces al día." |
| `training` | "Agenda las 2 sesiones de fuerza como bloques fijos en el calendario, de 30 minutos, antes del miércoles." |

5. Si dos dimensiones empatan, prioridad: `sleep` > `training` > `nutrition` > `snacking` > `hydration` (el sueño es la palanca que arrastra a las demás).
6. Si la semana tiene menos de 3 días con registro, no se genera resumen: se muestra "semana con muy pocos datos" y la única sugerencia es registrar más días.

---

## 8. Historias de usuario

Formato: **Como** [usuario] **quiero** [acción] **para** [beneficio], con criterios de aceptación en Gherkin.

### Épica 1 — Fundaciones

**HU-01 · Instalar y usar sin conexión** (RF-907, RNF-05..07)
Como usuario quiero instalar la app en mi celular y usarla sin internet para registrar en cualquier momento.
- Dado que abro la app en Chrome móvil, cuando cumple los criterios de PWA, entonces el navegador me ofrece instalarla.
- Dado que estoy en modo avión, cuando abro la app instalada, entonces carga completa y puedo registrar y ver datos.
- Dado que registro algo sin conexión, cuando cierro y reabro, entonces el dato sigue ahí.

**HU-02 · Configurar mis metas** (RF-901, RF-907)
Como usuario quiero ver y ajustar mis metas para que la app mida lo que yo decidí.
- Dado que abro la app por primera vez, cuando termino el onboarding, entonces quedan guardadas las metas por defecto y mi peso inicial.
- Dado que cambio la meta de agua a 2500 ml, cuando vuelvo al dashboard, entonces el progreso se recalcula contra 2500.
- Dado que estoy en el onboarding, entonces veo el aviso de que la app no da consejo médico y que debo validar la rutina de fuerza por mi escoliosis.

### Épica 2 — Registro diario

**HU-03 · Registrar agua en un toque** (RF-201, RF-202, RNF-14)
Como usuario quiero sumar un vaso de agua con un solo toque para no dejar de registrar por flojera.
- Dado que estoy en el dashboard, cuando toco "+1 vaso", entonces el contador sube 250 ml en menos de 100 ms.
- Dado que toqué de más, cuando toco deshacer, entonces se resta el último vaso.
- Dado que llego a 2000 ml, entonces el indicador se marca como cumplido con texto e icono, no solo con color.

**HU-04 · Registrar comida rápida y picoteo** (RF-101, RF-102, RF-104)
Como usuario quiero anotar cuando como delivery o pico dulces para ver el patrón real de la semana.
- Dado que registro una comida rápida, cuando vuelvo al dashboard, entonces el contador semanal sube y muestra "1 de 1 usado".
- Dado que ya usé mi cupo, cuando registro otra, entonces la dimensión de alimentación baja a 60 y el estado pasa a ámbar con texto explicativo.
- Dado que registro un picoteo, entonces puedo elegir el tipo en la misma pantalla sin escribir nada.

**HU-05 · Registrar el sueño de anoche** (RF-401..403)
Como usuario quiero anotar a qué hora me acosté y me levanté para ver si estoy mejorando el horario.
- Dado que me acosté a las 03:40 y desperté a las 09:10, cuando lo registro, entonces la app calcula 5,5 h correctamente cruzando la medianoche.
- Dado que me acosté después de la 01:30, entonces la app lo muestra como fuera de meta sin ningún texto de reproche.
- Dado que no registré anoche, cuando abro el dashboard en la mañana, entonces veo un recordatorio de "registra tu sueño".

**HU-06 · Registrar entrenamiento de fuerza** (RF-302..305, RF-308)
Como usuario quiero registrar mi rutina de fuerza con series y peso para ver si estoy progresando.
- Dado que creé la plantilla "Fuerza A", cuando la registro, entonces se cargan sus ejercicios y solo ajusto pesos.
- Dado que registro una plancha, entonces la app me pide segundos, no repeticiones.
- Dado que el ejercicio tiene `safeForScoliosis: false`, entonces veo la advertencia y debo confirmar antes de guardarlo.

**HU-07 · Registrar natación** (RF-301, RF-307)
Como usuario quiero registrar mi sesión de natación del miércoles para que cuente en mi semana.
- Dado que registro 90 minutos de natación, entonces la meta semanal de natación queda cumplida.
- Dado que la semana termina sin natación, entonces la dimensión de entrenamiento refleja solo la parte de fuerza.

**HU-08 · Corregir lo que registré mal** (RF-105, RF-106)
Como usuario quiero editar o borrar registros de los últimos días para que los datos sean confiables.
- Dado que registré dos veces el mismo delivery, cuando borro uno, entonces el contador semanal se corrige de inmediato.
- Dado que olvidé registrar el jueves, cuando elijo esa fecha, entonces puedo registrar retroactivamente hasta 30 días atrás.

### Épica 3 — Peso y medidas

**HU-09 · Seguir peso y cintura** (RF-501..506)
Como usuario quiero registrar peso y cintura para ver la tendencia real y no asustarme con el ruido diario.
- Dado que registro el peso dos veces el mismo día, entonces solo queda el último valor.
- Dado que tengo 3 semanas de datos, entonces el gráfico muestra la media móvil de 7 días como línea principal.
- Dado que el peso no baja pero la cintura sí, entonces la app destaca la baja de cintura como progreso.

**HU-10 · Comparar fotos de progreso** (RF-503, RF-507)
Como usuario quiero comparar dos fotos lado a lado para ver cambios que la báscula no muestra.
- Dado que subo una foto, entonces se guarda solo en mi dispositivo y ninguna petición de red sale de la app.
- Dado que tengo dos fotos, cuando elijo ambas fechas, entonces las veo lado a lado con su fecha y peso.

### Épica 4 — Monitoreo

**HU-11 · Ver cómo voy en la semana** (RF-601..607)
Como usuario quiero abrir la app y entender en 5 segundos cómo va mi semana.
- Dado que abro la app, entonces veo el índice 0–100 y las 5 dimensiones con su porcentaje.
- Dado que hoy me faltan cosas, entonces veo qué falta en texto concreto ("te faltan 3 vasos").
- Dado que no tengo ningún dato todavía, entonces veo un estado vacío con instrucciones, sin errores ni "NaN".

**HU-12 · Recibir mi resumen semanal** (RF-701..707)
Como usuario quiero un resumen cada semana con mis puntos fuertes y débiles para saber qué corregir.
- Dado que termina el domingo, cuando abro la app el lunes, entonces veo el resumen de la semana cerrada.
- Dado que el resumen se generó, entonces lista 2–3 fortalezas, 2–3 debilidades y **exactamente una** acción.
- Dado que la semana tiene menos de 3 días registrados, entonces la app avisa que hay pocos datos y no inventa conclusiones.
- Dado cualquier resumen, entonces el texto no contiene juicios sobre mi cuerpo ni lenguaje de culpa.

**HU-13 · Ver el mes completo** (RF-801..803)
Como usuario quiero un calendario del mes para detectar patrones (ej. los fines de semana se me cae todo).
- Dado que abro la vista mensual, entonces veo cada día coloreado por su índice diario.
- Dado que toco un día, entonces veo todos sus registros en detalle.
- Dado que hay un mes anterior, entonces veo la comparación por dimensión.

**HU-14 · Ver mis rachas** (RF-405, RF-605)
Como usuario quiero ver mis rachas para tener un motivo de mantener la constancia.
- Dado que llevo 5 noches con ≥7 h, entonces veo "racha de 5 noches".
- Dado que corto una racha, entonces la app la reinicia sin ningún mensaje negativo.

### Épica 5 — Control de mis datos

**HU-15 · Exportar e importar mis datos** (RF-902..904, RNF-23)
Como usuario quiero respaldar mis datos para no perder meses de registro si limpio el navegador.
- Dado que exporto, entonces descargo un `.json` con todos los registros y fotos.
- Dado que importo ese archivo en un dispositivo limpio, entonces recupero todo idéntico.
- Dado que importo un archivo corrupto, entonces la app lo rechaza con un mensaje claro y no toca los datos existentes.

**HU-16 · Recordatorios locales** (RF-905)
Como usuario quiero recordatorios opcionales para no olvidar registrar ni trasnochar de más.
- Dado que activo el recordatorio de sueño, entonces recibo un aviso local 30 min antes de mi hora límite.
- Dado que no doy permiso de notificaciones, entonces la app sigue funcionando completa y no vuelve a insistir.

---

## 9. Fases de entrega

**Fase 1 — MVP usable (HU-01, HU-02, HU-03, HU-04, HU-05, HU-11)**
Base de datos, metas, registro de agua/comida/picoteo/sueño y dashboard con el índice. Al terminar esta fase la app ya sirve para usarla a diario.

**Fase 2 — Entrenamiento y cuerpo (HU-06, HU-07, HU-08, HU-09)**
Biblioteca de ejercicios, sesiones de fuerza y natación, plantillas, peso y medidas con gráficos.

**Fase 3 — Inteligencia del seguimiento (HU-12, HU-13, HU-14)**
Resumen semanal, vista mensual con heatmap, rachas y tendencias.

**Fase 4 — Robustez (HU-10, HU-15, HU-16)**
Fotos y comparador, exportar/importar, recordatorios locales, pulido de accesibilidad y rendimiento.

---

## 10. Estructura de proyecto sugerida

```
src/
  domain/            # funciones puras, sin React ni Dexie
    scoring.ts       # dimensiones, índice semanal, índice diario
    summary.ts       # fortalezas, debilidades, acción única
    dates.ts         # semanas ISO, cruce de medianoche, zona horaria
    goals.ts
    __tests__/
  db/
    schema.ts        # Dexie, versiones y migraciones
    repositories/    # foodRepo, sleepRepo, workoutRepo, bodyRepo
    backup.ts        # export / import + validación Zod
  features/
    dashboard/
    nutrition/
    hydration/
    training/
    sleep/
    body/
    summary/
    settings/
  components/        # UI genérica (Ring, Card, QuickButton, Chart)
  data/
    exercises.seed.ts
  app/               # rutas, layout, tema, service worker
```

---

## 11. Definition of Done

Una historia está terminada cuando:
1. Cumple todos sus criterios de aceptación.
2. La lógica de dominio que introduce tiene tests unitarios y `src/domain/` mantiene ≥80% de cobertura.
3. Funciona sin conexión y sobrevive a recargar la página.
4. Es usable con una mano en una pantalla de 375 px de ancho.
5. Pasa `tsc --noEmit`, ESLint y Prettier sin advertencias.
6. Los estados vacío, de carga y de error están resueltos (nada de pantallas en blanco ni `NaN`).
7. Contraste AA verificado en tema claro y oscuro.

---

## 12. Prompt inicial para Claude Code

> Lee `ESPEC.md` completo. Vamos a construir esta PWA por fases.
>
> Empieza por la **Fase 1**. Antes de escribir código:
> 1. Propón un plan de tareas concreto para la Fase 1, mapeando cada tarea a los RF y HU del documento.
> 2. Levanta el proyecto con Vite + React + TypeScript strict + Tailwind + Dexie + vite-plugin-pwa.
> 3. Implementa primero `src/domain/` (scoring, fechas, metas) **con sus tests**, antes de tocar la UI. Los tests deben cubrir los casos borde de §RNF-22.
> 4. Luego la capa de datos (`src/db/`) con el esquema versionado.
> 5. Recién después la UI: dashboard, registro rápido y ajustes.
>
> Reglas que no se negocian:
> - Sin lógica de negocio dentro de componentes.
> - Sin valores de metas hardcodeados: todo sale de `Goals`.
> - Cero llamadas de red en tiempo de ejecución.
> - Todo el texto de interfaz en español de Chile.
> - Semanas ISO de lunes a domingo, zona horaria America/Santiago.
>
> Al terminar la Fase 1, corre los tests, muéstrame el resultado y detente para que yo la pruebe antes de seguir con la Fase 2.

---

## Anexo · Seed de la biblioteca de ejercicios

| Ejercicio | Grupo | Métrica | Seguro con escoliosis | Clave de ejecución |
|---|---|---|---|---|
| Plancha frontal | core | tiempo | Sí | Glúteo apretado, costillas abajo, sin hundir la lumbar |
| Plancha lateral | core | tiempo | Sí | Trabajar ambos lados por igual, cadera alta |
| Puente de glúteos | glúteos | reps | Sí | Empuje desde el talón, sin arquear la lumbar |
| Bird-dog | core | reps | Sí | Movimiento lento, pelvis quieta |
| Dead bug | core | reps | Sí | Lumbar pegada al suelo todo el rango |
| Remo con mancuerna | espalda | reps | Sí | Torso estable, sin rotar la columna |
| Jalón al pecho / dominada asistida | espalda | reps | Sí | Sin balanceo, control en la bajada |
| Face pull | hombros | reps | Sí | Excelente para la postura del escritorio |
| Press de hombro sentado | hombros | reps | Sí | Espalda apoyada, sin arquear |
| Sentadilla goblet | piernas | reps | Sí | Carga frontal, torso vertical |
| Peso muerto rumano ligero | piernas | reps | Sí | Carga conservadora, espalda neutra |
| Flexión lateral con mancuerna | core | reps | **No** | Carga asimétrica sobre la curva; evitar |
| Hiperextensión cargada | espalda | reps | **No** | Compresión lumbar; evitar sin supervisión |
| Sentadilla con barra pesada | piernas | reps | **No** | Carga axial alta; solo con técnica supervisada |

> Los ejercicios marcados como no seguros vienen incluidos a propósito, para que la app los muestre con advertencia en vez de que el usuario los busque por fuera sin contexto. La app no reemplaza la evaluación de un kinesiólogo.
