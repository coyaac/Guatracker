export type Dimension = 'nutrition' | 'snacking' | 'hydration' | 'training' | 'sleep'

export interface Goals {
  fastFoodPerWeek: number // M1
  sweetSnacksPerWeek: number // M2
  waterMlPerDay: number // M3
  sugaryDrinksPerWeek: number // M4
  strengthPerWeek: number // M5
  swimPerWeek: number // M6
  sleepHours: number // M7
  bedtimeLimit: string // M8, "HH:mm"
  weightRangeKg: [number, number] // M9
}

export const DEFAULT_GOALS: Goals = {
  fastFoodPerWeek: 1,
  sweetSnacksPerWeek: 3,
  waterMlPerDay: 2000,
  sugaryDrinksPerWeek: 0,
  strengthPerWeek: 2,
  swimPerWeek: 1,
  sleepHours: 7,
  bedtimeLimit: '01:30',
  weightRangeKg: [70, 80],
}

/** Pesos por dimensión para el índice semanal (§7.2). Deben sumar 100. */
export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  nutrition: 25,
  snacking: 15,
  hydration: 15,
  training: 25,
  sleep: 20,
}
