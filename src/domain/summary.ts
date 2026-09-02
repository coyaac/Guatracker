import type { ISOWeek } from './dates'
import type { Dimension } from './goals'
import { indexFromDimensions } from './scoring'

export interface WeeklySummary {
  week: ISOWeek
  score: number
  dimensions: Record<Dimension, number>
  deltaVsPreviousWeek: number
  strengths: string[] // 2–3
  weaknesses: string[] // 2–3
  action: string // exactamente 1
  generatedAt: number
  lowData?: boolean // <3 días con registro
}

export interface SummaryInput {
  week: ISOWeek
  dimensions: Record<Dimension, number>
  prevDimensions: Record<Dimension, number> | null
  daysWithRecords: number
  avgBedtime: string | null // promedio de la semana, para la acción de sueño
}

const LABEL: Record<Dimension, string> = {
  nutrition: 'Alimentación',
  snacking: 'Picoteo',
  hydration: 'Hidratación',
  training: 'Entrenamiento',
  sleep: 'Sueño',
}

// Empates de la acción única: sleep > training > nutrition > snacking > hydration (§7.4).
const PRIORITY: Dimension[] = ['sleep', 'training', 'nutrition', 'snacking', 'hydration']

const ALL = Object.keys(LABEL) as Dimension[]

/** Promedio de horas de acostarse "HH:mm" tratando la madrugada como día siguiente. */
export function averageBedtime(bedtimes: string[]): string | null {
  if (bedtimes.length === 0) return null
  const mins = bedtimes.map((b) => {
    const [h, m] = b.split(':').map(Number)
    return (h < 12 ? h + 24 : h) * 60 + m
  })
  const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) % (24 * 60)
  return toHHMM(avg)
}

const toHHMM = (totalMin: number): string =>
  `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`

function shiftEarlier(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  let total = h * 60 + m - minutes
  if (total < 0) total += 24 * 60
  return toHHMM(total)
}

function actionFor(d: Dimension, avgBedtime: string | null): string {
  switch (d) {
    case 'sleep':
      return avgBedtime
        ? `Esta semana adelanta la hora de acostarte 30 minutos respecto de tu promedio actual (${avgBedtime} → ${shiftEarlier(avgBedtime, 30)}). Solo eso.`
        : 'Esta semana intenta acostarte 30 minutos antes de lo habitual. Solo eso.'
    case 'nutrition':
      return 'Elige de antemano el día de comida rápida de esta semana y déjalo agendado. Los otros días, comida real.'
    case 'snacking':
      return 'Saca los dulces del escritorio. Deja fruta o frutos secos a la vista en su lugar.'
    case 'hydration':
      return 'Deja la botella de 1 L frente a la pantalla y llénala dos veces al día.'
    case 'training':
      return 'Agenda las 2 sesiones de fuerza como bloques fijos en el calendario, de 30 minutos, antes del miércoles.'
  }
}

/** Resumen semanal determinista (§7.4). Texto factual, sin lenguaje de culpa (RF-707). */
export function buildSummary(input: SummaryInput): WeeklySummary {
  const { week, dimensions, prevDimensions, daysWithRecords, avgBedtime } = input
  const score = indexFromDimensions(dimensions)
  const deltaVsPreviousWeek = prevDimensions ? score - indexFromDimensions(prevDimensions) : 0
  const generatedAt = Date.now()
  const delta = (d: Dimension): number => (prevDimensions ? dimensions[d] - prevDimensions[d] : 0)

  // <3 días → no se genera resumen (§7.4.6).
  if (daysWithRecords < 3) {
    return {
      week,
      score,
      dimensions,
      deltaVsPreviousWeek,
      strengths: [],
      weaknesses: [],
      action: 'Registra al menos 3 días esta semana para tener un resumen útil.',
      generatedAt,
      lowData: true,
    }
  }

  // Fortalezas: puntaje ≥80 o mejora ≥15; desc por puntaje; hasta 3.
  const strong = ALL.filter((d) => dimensions[d] >= 80 || delta(d) >= 15).sort((a, b) => dimensions[b] - dimensions[a]).slice(0, 3)
  const strengths = strong.length
    ? strong.map((d) => strengthText(d, dimensions[d], delta(d)))
    : [`Registraste ${daysWithRecords} de 7 días esta semana.`]

  // Debilidades: puntaje <60 o caída ≥15; asc por puntaje; hasta 3.
  const weak = ALL.filter((d) => dimensions[d] < 60 || delta(d) <= -15).sort((a, b) => dimensions[a] - dimensions[b]).slice(0, 3)
  const weaknesses = weak.map((d) => weaknessText(d, dimensions[d], delta(d)))

  // Acción: dimensión de menor puntaje; empate por prioridad.
  const worst = [...ALL].sort((a, b) => dimensions[a] - dimensions[b] || PRIORITY.indexOf(a) - PRIORITY.indexOf(b))[0]

  return { week, score, dimensions, deltaVsPreviousWeek, strengths, weaknesses, action: actionFor(worst, avgBedtime), generatedAt }
}

function strengthText(d: Dimension, score: number, delta: number): string {
  const base = `${LABEL[d]}: ${score}/100`
  return delta >= 15 ? `${base} (+${delta} vs. la semana pasada)` : base
}

function weaknessText(d: Dimension, score: number, delta: number): string {
  const base = `${LABEL[d]}: ${score}/100`
  return delta <= -15 ? `${base} (−${Math.abs(delta)} vs. la semana pasada)` : base
}
