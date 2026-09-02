import { DIMENSION_WEIGHTS, type Dimension, type Goals } from './goals'

const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, n))

// ---- Entradas agregadas por la capa de datos (dominio puro, sin Dexie) ----

export interface SleepNight {
  hours: number
  bedtime: string // "HH:mm"
}

export interface WeekAggregate {
  fastFood: number // comidas rápidas de la semana
  snackSweet: number
  snackSalty: number
  sugaryDrinks: number
  waterByDay: number[] // ml de cada día transcurrido (0 los días sin registro)
  strengthSessions: number
  swimSessions: number
  sleepNights: SleepNight[] // solo las noches registradas
  daysElapsed: number // 1..7
}

export interface DayAggregate {
  waterMl: number
  fastFood: number
  snacks: number // dulces + salados + azucaradas del día
  sleepHours: number | null
  hadWorkout: boolean
  hasAnyRecord: boolean
}

// ---- Dimensiones (0–100) ----

export function nutritionScore(fastFood: number, goal: number): number {
  const over = fastFood - goal
  if (over <= 0) return 100
  if (over === 1) return 60
  if (over === 2) return 30
  return 0
}

export function snackingScore(
  sweet: number,
  salty: number,
  sugary: number,
  goal: number,
): number {
  const n = sweet + salty + sugary * 2 // cada bebida azucarada cuenta doble
  return clamp(100 - 20 * Math.max(0, n - goal))
}

export function hydrationScore(waterByDay: number[], metaMl: number): number {
  if (waterByDay.length === 0 || metaMl <= 0) return 0
  const sum = waterByDay.reduce((acc, ml) => acc + Math.min(ml / metaMl, 1) * 100, 0)
  return clamp(sum / waterByDay.length)
}

export function trainingScore(
  strength: number,
  swim: number,
  metaStrength: number,
  metaSwim: number,
): number {
  const part = (done: number, meta: number): number => (meta <= 0 ? 1 : Math.min(done, meta) / meta)
  return clamp((part(strength, metaStrength) * 0.6 + part(swim, metaSwim) * 0.4) * 100)
}

/** minutos desde el mediodía; horas < 12 se tratan como madrugada (día siguiente). */
const minutesSinceNoon = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h < 12 ? h + 24 : h) * 60 + m
}

export function bedtimeScore(bedtime: string, limit: string): number {
  const late = minutesSinceNoon(bedtime) - minutesSinceNoon(limit)
  if (late <= 0) return 100
  return clamp(100 - 10 * Math.floor(late / 30))
}

function hoursScore(hours: number, meta: number): number {
  if (hours >= meta) return 100
  if (hours <= meta - 2) return 0
  return ((hours - (meta - 2)) / 2) * 100
}

/** Promedia sobre `daysElapsed`; las noches sin registro cuentan como 0 (§7.2). */
export function sleepScore(
  nights: SleepNight[],
  daysElapsed: number,
  goals: Goals,
): number {
  if (daysElapsed <= 0) return 0
  const sum = nights.reduce(
    (acc, n) => acc + hoursScore(n.hours, goals.sleepHours) * 0.7 + bedtimeScore(n.bedtime, goals.bedtimeLimit) * 0.3,
    0,
  )
  return clamp(sum / daysElapsed)
}

// ---- Índice semanal ----

export function weeklyDimensions(agg: WeekAggregate, goals: Goals): Record<Dimension, number> {
  return {
    nutrition: nutritionScore(agg.fastFood, goals.fastFoodPerWeek),
    snacking: snackingScore(agg.snackSweet, agg.snackSalty, agg.sugaryDrinks, goals.sweetSnacksPerWeek),
    hydration: hydrationScore(agg.waterByDay, goals.waterMlPerDay),
    training: trainingScore(agg.strengthSessions, agg.swimSessions, goals.strengthPerWeek, goals.swimPerWeek),
    sleep: sleepScore(agg.sleepNights, agg.daysElapsed, goals),
  }
}

export function indexFromDimensions(dims: Record<Dimension, number>): number {
  const total = (Object.keys(dims) as Dimension[]).reduce(
    (acc, d) => acc + dims[d] * DIMENSION_WEIGHTS[d],
    0,
  )
  return Math.round(total / 100)
}

export const weeklyIndex = (agg: WeekAggregate, goals: Goals): number =>
  indexFromDimensions(weeklyDimensions(agg, goals))

// ---- Rangos de color (§7.2). El texto acompaña siempre al color (RNF-18). ----

export type Tier = 'excelente' | 'bien' | 'a medias' | 'flojo'

export function indexTier(score: number): Tier {
  if (score >= 85) return 'excelente'
  if (score >= 70) return 'bien'
  if (score >= 50) return 'a medias'
  return 'flojo'
}

// ---- Índice diario (heatmap mensual, §7.3) ----
// Devuelve null cuando el día no tiene ningún registro ("sin datos", gris — nunca 0).

export function dailyIndex(day: DayAggregate, goals: Goals): number | null {
  if (!day.hasAnyRecord) return null
  const agua = Math.min(day.waterMl / goals.waterMlPerDay, 1) * 25
  const sinComidaRapida = day.fastFood === 0 ? 20 : 0
  const picoteoOk = day.snacks <= 1 ? 15 : 0
  const sueno = day.sleepHours !== null && day.sleepHours >= goals.sleepHours ? 25 : 0
  const entreno = day.hadWorkout ? 15 : 0
  return Math.round(agua + sinComidaRapida + picoteoOk + sueno + entreno)
}
