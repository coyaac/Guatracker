import { todayISO, weekDatesUpTo, type ISODate } from '../domain/dates'
import type { DayAggregate, WeekAggregate } from '../domain/scoring'
import { db } from './schema'

/** Arma el agregado de la semana en curso (lunes→hoy) para el scoring del dominio.
 *  Fuerza/natación quedan en 0 hasta la Fase 2. */
export async function weekAggregate(today: ISODate = todayISO()): Promise<WeekAggregate> {
  const dates = weekDatesUpTo(today)
  const start = dates[0]
  const end = dates[dates.length - 1]

  const [food, days, sleep] = await Promise.all([
    db.food.where('date').between(start, end, true, true).toArray(),
    db.days.where('date').between(start, end, true, true).toArray(),
    db.sleep.where('date').between(start, end, true, true).toArray(),
  ])

  const water = new Map(days.map((d) => [d.date, d.waterMl]))
  const count = (k: string): number => food.filter((f) => f.kind === k).length

  return {
    fastFood: count('fastfood'),
    snackSweet: count('snack_sweet'),
    snackSalty: count('snack_salty'),
    sugaryDrinks: count('sugary_drink'),
    waterByDay: dates.map((d) => water.get(d) ?? 0),
    strengthSessions: 0,
    swimSessions: 0,
    sleepNights: sleep.map((s) => ({ hours: s.hours, bedtime: s.bedtime })),
    daysElapsed: dates.length,
  }
}

/** Agregado de un solo día (índice diario / "qué falta hoy"). */
export async function dayAggregate(date: ISODate = todayISO()): Promise<DayAggregate> {
  const [food, day, sleep] = await Promise.all([
    db.food.where('date').equals(date).toArray(),
    db.days.get(date),
    db.sleep.get(date),
  ])

  return {
    waterMl: day?.waterMl ?? 0,
    fastFood: food.filter((f) => f.kind === 'fastfood').length,
    snacks: food.filter((f) => f.kind !== 'fastfood').length,
    sleepHours: sleep?.hours ?? null,
    hadWorkout: false, // Fase 2
    hasAnyRecord: food.length > 0 || day !== undefined || sleep !== undefined,
  }
}
