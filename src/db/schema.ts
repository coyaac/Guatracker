import Dexie, { type Table } from 'dexie'
import type { ISODate } from '../domain/dates'
import type { Goals } from '../domain/goals'

// Entidades de §7.1. Fase 1: food, days, sleep, settings. Fase 2 agrega
// workouts, exercises, body con una nueva versión de Dexie — las migraciones
// son aditivas y jamás destruyen datos (RNF-10).

export interface FoodEvent {
  id: string
  date: ISODate
  time?: string
  kind: 'fastfood' | 'snack_sweet' | 'snack_salty' | 'sugary_drink'
  note?: string
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

// Ajustes + perfil como fila única (id fijo 'app').
export interface AppSettings {
  id: 'app'
  goals: Goals
  onboarded: boolean
  heightCm?: number
  initialWeightKg?: number
  theme: 'light' | 'dark' | 'system'
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
  }
}

export const db = new BitacoraDB()
