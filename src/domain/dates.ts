import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
} from 'date-fns'

export type ISODate = string // "2026-09-01" en hora local America/Santiago
export type ISOWeek = string // "2026-W36", semana ISO lunes–domingo

const TZ = 'America/Santiago'

/** Formatea un instante como YYYY-MM-DD en la zona horaria de Chile.
 *  Usar Intl con timeZone hace que el corte de día (y el cambio de hora / DST)
 *  lo resuelva la plataforma, sin aritmética manual de offsets. */
export function toISODate(instant: Date = new Date()): ISODate {
  // 'en-CA' produce exactamente "YYYY-MM-DD".
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant)
}

export const todayISO = (now: Date = new Date()): ISODate => toISODate(now)

/** 'YYYY-MM-DD' → fecha calendario local (medianoche local), sin corrimiento UTC. */
const parseLocal = (date: ISODate): Date => parseISO(date)

export function isoWeekOf(date: ISODate): ISOWeek {
  const d = parseLocal(date)
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
}

/** Días transcurridos de la semana ISO que contiene a `date`, 1..7 (lunes=1, domingo=7).
 *  Sirve para promediar las dimensiones diarias sobre los días vividos, no sobre 7. */
export function daysElapsedInWeek(date: ISODate): number {
  const d = parseLocal(date)
  return differenceInCalendarDays(d, startOfISOWeek(d)) + 1
}

/** Fechas ISO desde el lunes de la semana de `date` hasta `date` inclusive (1..7 elementos). */
export function weekDatesUpTo(date: ISODate): ISODate[] {
  const monday = startOfISOWeek(parseLocal(date))
  const n = daysElapsedInWeek(date)
  return Array.from({ length: n }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

/** Horas dormidas entre dos horas de reloj "HH:mm", manejando el cruce de medianoche.
 *  Ej: 03:40 → 09:10 = 5,5 h; 23:30 → 07:00 = 7,5 h. Redondea a 1 decimal.
 *  ponytail: usa horas de reloj de pared; la noche del cambio DST queda ±1 h,
 *  dentro del ruido del registro subjetivo — corregir con offset de TZ solo si importa. */
export function sleepHours(bedtime: string, wakeTime: string): number {
  const toMin = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
  }
  let mins = toMin(wakeTime) - toMin(bedtime)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 6)) / 10
}
