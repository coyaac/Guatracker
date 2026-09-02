import { isoWeekOf, sleepHours, todayISO } from '../domain/dates'
import type { ISODate } from '../domain/dates'
import { DEFAULT_GOALS, type Goals } from '../domain/goals'
import { EXERCISE_SEED } from '../data/exercises.seed'
import {
  db,
  type AppSettings,
  type BodyMetric,
  type Exercise,
  type ExerciseSet,
  type FoodEvent,
  type Photo,
  type Routine,
  type SleepLog,
  type Workout,
} from './schema'

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

// ---- Ajustes / onboarding ----

export const SETTINGS_DEFAULT: AppSettings = {
  id: 'app',
  goals: DEFAULT_GOALS,
  onboarded: false,
  theme: 'system',
}

// Devuelve SETTINGS_DEFAULT (onboarded:false) cuando aún no hay fila, para que
// useLiveQuery pueda distinguir "cargando" (undefined) de "sin onboarding".
export const getSettings = async (): Promise<AppSettings> =>
  (await db.settings.get('app')) ?? SETTINGS_DEFAULT

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = (await getSettings()) ?? SETTINGS_DEFAULT
  await db.settings.put({ ...current, ...patch, id: 'app' })
}

export async function completeOnboarding(input: {
  goals: Goals
  heightCm?: number
  initialWeightKg?: number
}): Promise<void> {
  await saveSettings({ ...input, onboarded: true })
}

// ---- Comida / picoteo ----

export function addFood(kind: FoodEvent['kind'], note?: string, date: ISODate = todayISO()): Promise<string> {
  const ev: FoodEvent = {
    id: uid(),
    date,
    time: new Date().toTimeString().slice(0, 5),
    kind,
    note,
    createdAt: Date.now(),
  }
  return db.food.add(ev)
}

export const deleteFood = (id: string): Promise<void> => db.food.delete(id)

// ---- Agua (RF-201/202) ----

export async function addWater(deltaMl: number, date: ISODate = todayISO()): Promise<void> {
  await db.transaction('rw', db.days, async () => {
    const day = await db.days.get(date)
    const waterMl = Math.max(0, (day?.waterMl ?? 0) + deltaMl) // deshacer no baja de 0
    await db.days.put({
      date,
      waterMl,
      realMealsLogged: day?.realMealsLogged ?? false,
      zeroDrinks: day?.zeroDrinks ?? 0,
      note: day?.note,
    })
  })
}

// ---- Sueño (RF-401..403) ----

export function saveSleep(
  date: ISODate,
  bedtime: string,
  wakeTime: string,
  quality: SleepLog['quality'],
): Promise<ISODate> {
  return db.sleep.put({ date, bedtime, wakeTime, hours: sleepHours(bedtime, wakeTime), quality })
}

// ---- Ejercicios (biblioteca) ----

export async function ensureExerciseSeed(): Promise<void> {
  const n = await db.exercises.count()
  if (n === 0) await db.exercises.bulkAdd(EXERCISE_SEED)
}

export const listExercises = (): Promise<Exercise[]> => db.exercises.orderBy('muscleGroup').toArray()

// ---- Entrenamiento (RF-301..309) ----

export function addWorkout(input: {
  type: Workout['type']
  durationMin: number
  rpe?: number
  sets?: ExerciseSet[]
  note?: string
  date?: ISODate
}): Promise<string> {
  const w: Workout = {
    id: uid(),
    date: input.date ?? todayISO(),
    type: input.type,
    durationMin: input.durationMin,
    rpe: input.rpe,
    sets: input.sets,
    note: input.note,
    createdAt: Date.now(),
  }
  return db.workouts.add(w)
}

export const deleteWorkout = (id: string): Promise<void> => db.workouts.delete(id)

/** Historial de un ejercicio, más reciente primero (RF-309). */
export async function exerciseHistory(
  exerciseId: string,
): Promise<{ date: ISODate; set: ExerciseSet }[]> {
  const workouts = await db.workouts.where('type').equals('strength').toArray()
  return workouts
    .flatMap((w) => (w.sets ?? []).filter((s) => s.exerciseId === exerciseId).map((set) => ({ date: w.date, set })))
    .sort((a, b) => b.date.localeCompare(a.date))
}

// ---- Peso y medidas (RF-501..506) ----

/** Guarda/actualiza el registro del día, fusionando con lo ya escrito (1/día). */
export async function saveBodyMetric(date: ISODate, patch: Partial<BodyMetric>): Promise<void> {
  const current = await db.body.get(date)
  await db.body.put({ ...current, ...patch, date })
}

export const getBodyMetric = (date: ISODate): Promise<BodyMetric | undefined> => db.body.get(date)

/** Todos los registros corporales ordenados por fecha asc (para gráficos). */
export const listBodyMetrics = (): Promise<BodyMetric[]> => db.body.orderBy('date').toArray()

// ---- Fotos de progreso (RF-503), guardadas como Blob local ----

export async function savePhoto(blob: Blob): Promise<string> {
  const id = uid()
  await db.photos.add({ id, blob })
  return id
}
export const getPhoto = (id: string): Promise<Photo | undefined> => db.photos.get(id)

// ---- Plantillas de rutina (RF-308) ----

export function saveRoutine(name: string, exerciseIds: string[]): Promise<string> {
  return db.routines.add({ id: uid(), name, exerciseIds })
}

export const listRoutines = (): Promise<Routine[]> => db.routines.toArray()
export const deleteRoutine = (id: string): Promise<void> => db.routines.delete(id)

// ---- Consultas y borrado por día (editar/eliminar, RF-105) ----

export const listFoodByDate = (date: ISODate): Promise<FoodEvent[]> =>
  db.food.where('date').equals(date).toArray()

export const listWorkoutsByDate = (date: ISODate): Promise<Workout[]> =>
  db.workouts.where('date').equals(date).toArray()

export const getSleep = (date: ISODate): Promise<SleepLog | undefined> => db.sleep.get(date)
export const deleteSleep = (date: ISODate): Promise<void> => db.sleep.delete(date)

// re-export para conveniencia de la UI
export { isoWeekOf, todayISO }
export const currentWeek = (): string => isoWeekOf(todayISO())
