import Dexie, { type Table } from 'dexie'
import type { ISODate, ISOWeek } from '../domain/dates'
import type { Goals } from '../domain/goals'
import type { WeeklySummary } from '../domain/summary'

// Entidades de §7.1. Fase 1: food, days, sleep, settings. Fase 2 agrega
// workouts, exercises, body con una nueva versión de Dexie — las migraciones
// son aditivas y jamás destruyen datos (RNF-10).

export type Meal = 'desayuno' | 'almuerzo' | 'once' | 'cena'
export type SnackKind = 'dulce' | 'salado' | 'sugary'

export interface FoodEvent {
  id: string
  date: ISODate
  time?: string
  category: 'meal' | 'snack'
  meal?: Meal // solo category='meal'
  quality?: 'fast' | 'real' // rápida vs real — solo category='meal'
  snackKind?: SnackKind // solo category='snack' (sugary cuenta doble en el puntaje)
  name?: string // "completos", "chocolate", etc.
  quantity?: number // por defecto 1
  createdAt: number
}

export interface DayLog {
  date: ISODate // clave primaria — un registro por día, sin duplicados
  waterMl: number
  realMealsLogged: boolean
  zeroDrinks: number
  note?: string
}

export interface SleepLog {
  date: ISODate // clave primaria = fecha del DESPERTAR; put() reemplaza
  bedtime: string
  wakeTime: string
  hours: number
  quality: 'bad' | 'ok' | 'good'
}

// ── Fase 2 ──

export type MuscleGroup = 'core' | 'back' | 'chest' | 'shoulders' | 'legs' | 'glutes' | 'arms'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  metric: 'reps' | 'time'
  safeForScoliosis: boolean
  cue: string
  warning?: string // se muestra si safeForScoliosis === false
  isCustom: boolean
}

export interface ExerciseSet {
  exerciseId: string
  reps?: number
  weightKg?: number
  seconds?: number // isométricos (plancha)
}

export interface Workout {
  id: string
  date: ISODate
  type: 'swim' | 'strength' | 'walk' | 'other'
  durationMin: number
  rpe?: number // 1–10
  sets?: ExerciseSet[] // solo en 'strength'
  note?: string
  createdAt: number
}

export interface BodyMetric {
  date: ISODate // clave primaria — 1 registro/día, el nuevo reemplaza
  weightKg?: number
  waistCm?: number
  abdomenCm?: number
  hipCm?: number
  chestCm?: number
  armCm?: number
  photoBlobId?: string // Fase 4
}

// Plantilla de rutina (RF-308): nombre + ejercicios; los pesos se ajustan al registrar.
export interface Routine {
  id: string
  name: string
  exerciseIds: string[]
}

// Foto de progreso (RF-503): Blob guardado local, nunca sube a ningún servidor.
export interface Photo {
  id: string
  blob: Blob
}

// Ajustes + perfil como fila única (id fijo 'app').
export interface AppSettings {
  id: 'app'
  goals: Goals
  onboarded: boolean
  heightCm?: number
  initialWeightKg?: number
  theme: 'light' | 'dark' | 'system'
  reminders?: { sleep: boolean; water: boolean; bedtime: boolean } // RF-905, off por defecto
}

class BitacoraDB extends Dexie {
  food!: Table<FoodEvent, string>
  days!: Table<DayLog, ISODate>
  sleep!: Table<SleepLog, ISODate>
  settings!: Table<AppSettings, string>
  workouts!: Table<Workout, string>
  exercises!: Table<Exercise, string>
  body!: Table<BodyMetric, ISODate>
  routines!: Table<Routine, string>
  summaries!: Table<WeeklySummary, ISOWeek>
  photos!: Table<Photo, string>

  constructor() {
    super('bitacora')
    this.version(1).stores({
      food: 'id, date, kind',
      days: 'date',
      sleep: 'date',
      settings: 'id',
    })
    // v2 (Fase 2): aditiva, no toca las tablas de v1.
    this.version(2).stores({
      workouts: 'id, date, type',
      exercises: 'id, muscleGroup',
      body: 'date',
    })
    // v3 (Fase 2): plantillas de rutina.
    this.version(3).stores({
      routines: 'id',
    })
    // v4 (Fase 3): resúmenes semanales, indexados por semana ISO.
    this.version(4).stores({
      summaries: 'week',
    })
    // v5 (Fase 4): fotos de progreso (Blob).
    this.version(5).stores({
      photos: 'id',
    })
    // v6: nuevo modelo de comida (category/meal/quality/snackKind/name/quantity).
    // Migra las filas viejas (kind → nuevos campos) sin perder datos.
    this.version(6)
      .stores({ food: 'id, date, category' })
      .upgrade(async (tx) => {
        await tx
          .table('food')
          .toCollection()
          .modify((f: Record<string, unknown>) => {
            switch (f.kind) {
              case 'fastfood':
                f.category = 'meal'
                f.quality = 'fast'
                break
              case 'snack_sweet':
                f.category = 'snack'
                f.snackKind = 'dulce'
                break
              case 'snack_salty':
                f.category = 'snack'
                f.snackKind = 'salado'
                break
              case 'sugary_drink':
                f.category = 'snack'
                f.snackKind = 'sugary'
                break
            }
            delete f.kind
            if (f.note && !f.name) {
              f.name = f.note
              delete f.note
            }
            f.quantity ??= 1
          })
      })
  }
}

/** Todas las tablas de datos del usuario, en orden. Fuente única para respaldo/borrado. */
export const USER_TABLES = ['food', 'days', 'sleep', 'workouts', 'exercises', 'body', 'routines', 'summaries', 'photos', 'settings'] as const

export const db = new BitacoraDB()
