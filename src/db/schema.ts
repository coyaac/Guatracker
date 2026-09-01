import Dexie, { type Table } from 'dexie'
import type { ISODate } from '../domain/dates'
import type { Goals } from '../domain/goals'

// Entidades de §7.1 usadas en Fase 1. Las de Fase 2+ (Workout, BodyMetric,
// Exercise, WeeklySummary) se agregan con nuevas versiones de Dexie —
// las migraciones son aditivas y jamás destruyen datos (RNF-10).

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

  constructor() {
    super('bitacora')
    this.version(1).stores({
      food: 'id, date, kind',
      days: 'date',
      sleep: 'date',
      settings: 'id',
    })
  }
}

export const db = new BitacoraDB()
