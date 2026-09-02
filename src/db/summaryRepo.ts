import { format, parseISO, startOfISOWeek, subDays } from 'date-fns'
import { isoWeekOf, todayISO, type ISODate, type ISOWeek } from '../domain/dates'
import { weeklyDimensions } from '../domain/scoring'
import { buildSummary, type WeeklySummary } from '../domain/summary'
import { currentStreak } from '../domain/streaks'
import { weekReport } from './aggregate'
import { getSettings } from './repositories'
import { db } from './schema'

const iso = (d: Date): ISODate => format(d, 'yyyy-MM-dd')

/** Construye (sin guardar) el resumen de la semana que contiene a `anchor`.
 *  Para una semana cerrada, pasar su domingo. */
export async function buildSummaryForAnchor(anchor: ISODate): Promise<WeeklySummary> {
  const goals = (await getSettings()).goals
  const cur = await weekReport(anchor)
  const prev = await weekReport(iso(subDays(parseISO(anchor), 7)))
  return buildSummary({
    week: isoWeekOf(anchor),
    dimensions: weeklyDimensions(cur.agg, goals),
    prevDimensions: prev.daysWithRecords > 0 ? weeklyDimensions(prev.agg, goals) : null,
    daysWithRecords: cur.daysWithRecords,
    avgBedtime: cur.avgBedtime,
  })
}

export async function generateAndStore(anchor: ISODate): Promise<WeeklySummary> {
  const s = await buildSummaryForAnchor(anchor)
  await db.summaries.put(s)
  return s
}

export const getSummary = (week: ISOWeek): Promise<WeeklySummary | undefined> => db.summaries.get(week)

export const listSummaries = (): Promise<WeeklySummary[]> =>
  db.summaries.orderBy('week').reverse().toArray()

/** Domingo de la última semana cerrada respecto de hoy. */
export const lastClosedSunday = (today: ISODate = todayISO()): ISODate =>
  iso(subDays(startOfISOWeek(parseISO(today)), 1))

/** Genera el resumen de la semana recién cerrada si aún no existe (RF-701, en lugar
 *  de un cron: se genera al abrir la app la primera vez tras cerrarse la semana). */
export async function ensureLastWeekSummary(today: ISODate = todayISO()): Promise<void> {
  const anchor = lastClosedSunday(today)
  const week = isoWeekOf(anchor)
  if (!(await db.summaries.get(week))) await generateAndStore(anchor)
}

// ── Rachas (RF-405/605) ──

export interface Streaks {
  sleepNights: number // noches consecutivas con ≥ meta de horas
  recordDays: number // días consecutivos con algún registro
}

export async function computeStreaks(today: ISODate = todayISO()): Promise<Streaks> {
  const goals = (await getSettings()).goals
  const from = iso(subDays(parseISO(today), 120)) // ventana suficiente para una racha
  const [sleep, food, days, workouts] = await Promise.all([
    db.sleep.where('date').between(from, today, true, true).toArray(),
    db.food.where('date').between(from, today, true, true).toArray(),
    db.days.where('date').between(from, today, true, true).toArray(),
    db.workouts.where('date').between(from, today, true, true).toArray(),
  ])

  const goodSleep = new Set(sleep.filter((s) => s.hours >= goals.sleepHours).map((s) => s.date))

  const recorded = new Set<ISODate>()
  food.forEach((f) => recorded.add(f.date))
  days.forEach((d) => d.waterMl > 0 && recorded.add(d.date))
  sleep.forEach((s) => recorded.add(s.date))
  workouts.forEach((w) => recorded.add(w.date))

  return {
    sleepNights: currentStreak(goodSleep, today),
    recordDays: currentStreak(recorded, today),
  }
}
