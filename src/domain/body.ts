import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { ISODate } from './dates'

export interface MetricPoint {
  date: ISODate
  value: number
}

const dayDiff = (a: ISODate, b: ISODate): number =>
  differenceInCalendarDays(parseISO(a), parseISO(b))

/** Media móvil de ventana de `windowDays` días calendario, en primer plano del
 *  gráfico (RF-504). Puntos ordenados por fecha asc; ventana trailing [d-w+1, d].
 *  ponytail: O(n²) por filtro; con años de datos de peso (≤365 puntos) sobra. */
export function movingAverage(points: MetricPoint[], windowDays = 7): MetricPoint[] {
  return points.map((p) => {
    const inWindow = points.filter((q) => {
      const d = dayDiff(p.date, q.date)
      return d >= 0 && d <= windowDays - 1
    })
    const avg = inWindow.reduce((s, q) => s + q.value, 0) / inWindow.length
    return { date: p.date, value: Math.round(avg * 10) / 10 }
  })
}

export const latest = (points: MetricPoint[]): MetricPoint | null =>
  points.length === 0 ? null : points[points.length - 1]

/** Variación del último valor respecto del valor de hace al menos `sinceDays`
 *  días (el punto más reciente que sea así de antiguo). null si no hay referencia. */
export function changeSince(points: MetricPoint[], sinceDays: number): number | null {
  const last = latest(points)
  if (!last) return null
  let ref: MetricPoint | undefined
  for (const p of points) {
    if (dayDiff(last.date, p.date) >= sinceDays) ref = p // asc → queda el más nuevo que califica
  }
  return ref ? Math.round((last.value - ref.value) * 10) / 10 : null
}

/** Variación desde el primer registro (RF-506). */
export function changeSinceStart(points: MetricPoint[]): number | null {
  const last = latest(points)
  if (!last || points.length < 2) return null
  return Math.round((last.value - points[0].value) * 10) / 10
}
