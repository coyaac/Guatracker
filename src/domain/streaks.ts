import { format, parseISO, subDays } from 'date-fns'
import type { ISODate } from './dates'

const fmt = (d: Date): ISODate => format(d, 'yyyy-MM-dd')

/** Racha actual: días calendario consecutivos que califican, contando hacia atrás
 *  desde hoy. Si hoy aún no califica pero ayer sí, arranca en ayer (para que la
 *  racha no se reinicie solo porque todavía no registras el día en curso).
 *  Sin mensajes negativos al cortarse (RF-405/605): devuelve 0 y ya. */
export function currentStreak(qualifying: Set<ISODate>, today: ISODate): number {
  let d = parseISO(today)
  if (!qualifying.has(fmt(d))) {
    d = subDays(d, 1)
    if (!qualifying.has(fmt(d))) return 0
  }
  let streak = 0
  while (qualifying.has(fmt(d))) {
    streak++
    d = subDays(d, 1)
  }
  return streak
}
