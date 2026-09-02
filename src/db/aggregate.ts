import { todayISO, weekDatesUpTo, type ISODate } from '../domain/dates'
import type { Goals } from '../domain/goals'
import { averageBedtime } from '../domain/summary'
import { dailyIndex, type DayAggregate, type WeekAggregate } from '../domain/scoring'
import { db } from './schema'

export interface WeekReport {
  agg: WeekAggregate
  daysWithRecords: number // días con algún registro (para el umbral <3 del resumen)
  avgBedtime: string | null
}

/** Reporte de la semana que contiene a `anchor` (lunes→anchor). Para una semana
 *  cerrada, pasar su domingo → los 7 días. Una sola pasada de consultas. */
export async function weekReport(anchor: ISODate = todayISO()): Promise<WeekReport> {
  const dates = weekDatesUpTo(anchor)
  const start = dates[0]
  const end = dates[dates.length - 1]

  const [food, days, sleep, workouts] = await Promise.all([
    db.food.where('date').between(start, end, true, true).toArray(),
    db.days.where('date').between(start, end, true, true).toArray(),
    db.sleep.where('date').between(start, end, true, true).toArray(),
    db.workouts.where('date').between(start, end, true, true).toArray(),
  ])

  const water = new Map(days.map((d) => [d.date, d.waterMl]))
  const count = (k: string): number => food.filter((f) => f.kind === k).length

  const withRecords = new Set<ISODate>()
  food.forEach((f) => withRecords.add(f.date))
  days.forEach((d) => d.waterMl > 0 && withRecords.add(d.date))
  sleep.forEach((s) => withRecords.add(s.date))
  workouts.forEach((w) => withRecords.add(w.date))

  const agg: WeekAggregate = {
    fastFood: count('fastfood'),
    snackSweet: count('snack_sweet'),
    snackSalty: count('snack_salty'),
    sugaryDrinks: count('sugary_drink'),
    waterByDay: dates.map((d) => water.get(d) ?? 0),
    strengthSessions: workouts.filter((w) => w.type === 'strength').length,
    swimSessions: workouts.filter((w) => w.type === 'swim').length,
    sleepNights: sleep.map((s) => ({ hours: s.hours, bedtime: s.bedtime })),
    daysElapsed: dates.length,
  }

  return { agg, daysWithRecords: withRecords.size, avgBedtime: averageBedtime(sleep.map((s) => s.bedtime)) }
}

export const weekAggregate = async (anchor: ISODate = todayISO()): Promise<WeekAggregate> =>
  (await weekReport(anchor)).agg

/** Índice diario (§7.3) de cada día CON registro del mes `YYYY-MM`, para el heatmap.
 *  Los días ausentes del mapa son "sin datos" (gris), nunca 0. */
export async function monthDailyIndices(month: string, goals: Goals): Promise<Map<ISODate, number | null>> {
  const start = `${month}-01`
  const end = `${month}-31` // rango string sobre YYYY-MM-DD; seguro aunque el mes tenga <31 días
  const [food, days, sleep, workouts] = await Promise.all([
    db.food.where('date').between(start, end, true, true).toArray(),
    db.days.where('date').between(start, end, true, true).toArray(),
    db.sleep.where('date').between(start, end, true, true).toArray(),
    db.workouts.where('date').between(start, end, true, true).toArray(),
  ])

  const byDate = new Map<ISODate, DayAggregate>()
  const at = (d: ISODate): DayAggregate => {
    let a = byDate.get(d)
    if (!a) {
      a = { waterMl: 0, fastFood: 0, snacks: 0, sleepHours: null, hadWorkout: false, hasAnyRecord: false }
      byDate.set(d, a)
    }
    return a
  }
  food.forEach((f) => {
    const a = at(f.date)
    a.hasAnyRecord = true
    if (f.kind === 'fastfood') a.fastFood++
    else a.snacks++
  })
  days.forEach((d) => {
    const a = at(d.date)
    a.waterMl = d.waterMl
    if (d.waterMl > 0) a.hasAnyRecord = true
  })
  sleep.forEach((s) => {
    const a = at(s.date)
    a.sleepHours = s.hours
    a.hasAnyRecord = true
  })
  workouts.forEach((w) => {
    const a = at(w.date)
    a.hadWorkout = true
    a.hasAnyRecord = true
  })

  const out = new Map<ISODate, number | null>()
  byDate.forEach((a, d) => out.set(d, dailyIndex(a, goals)))
  return out
}

/** Agregado de un solo día (índice diario / "qué falta hoy"). */
export async function dayAggregate(date: ISODate = todayISO()): Promise<DayAggregate> {
  const [food, day, sleep, workouts] = await Promise.all([
    db.food.where('date').equals(date).toArray(),
    db.days.get(date),
    db.sleep.get(date),
    db.workouts.where('date').equals(date).toArray(),
  ])

  return {
    waterMl: day?.waterMl ?? 0,
    fastFood: food.filter((f) => f.kind === 'fastfood').length,
    snacks: food.filter((f) => f.kind !== 'fastfood').length,
    sleepHours: sleep?.hours ?? null,
    hadWorkout: workouts.length > 0,
    hasAnyRecord: food.length > 0 || day !== undefined || sleep !== undefined || workouts.length > 0,
  }
}
