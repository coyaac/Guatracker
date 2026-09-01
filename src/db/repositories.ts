import { isoWeekOf, sleepHours, todayISO } from '../domain/dates'
import type { ISODate } from '../domain/dates'
import { DEFAULT_GOALS, type Goals } from '../domain/goals'
import { db, type AppSettings, type FoodEvent, type SleepLog } from './schema'

const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`

// ---- Ajustes / onboarding ----

export const SETTINGS_DEFAULT: AppSettings = {
  id: 'app',
  goals: DEFAULT_GOALS,
  onboarded: false,
  theme: 'system',
}

export const getSettings = (): Promise<AppSettings | undefined> => db.settings.get('app')

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

// re-export para conveniencia de la UI
export { isoWeekOf, todayISO }
export const currentWeek = (): string => isoWeekOf(todayISO())
