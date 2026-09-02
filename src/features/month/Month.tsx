import { useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import { monthDailyIndices } from '../../db/aggregate'
import { getSettings, listFoodByDate, listWorkoutsByDate, getSleep } from '../../db/repositories'
import { db } from '../../db/schema'
import { indexTier } from '../../domain/scoring'
import type { ISODate } from '../../domain/dates'

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

const TIER_COLOR: Record<string, string> = {
  excelente: 'var(--color-tier-excelente)',
  bien: 'var(--color-tier-bien)',
  'a medias': 'var(--color-tier-medias)',
  flojo: 'var(--color-tier-flojo)',
}

const cellColor = (idx: number | null | undefined): string =>
  idx === null || idx === undefined ? 'var(--color-raised)' : TIER_COLOR[indexTier(idx)]

const monthKey = (d: Date): string => format(d, 'yyyy-MM')

/** Promedio de índice de los días CON dato de un mes (para comparar meses). */
const monthAvg = (m: Map<ISODate, number | null>): number | null => {
  const vals = [...m.values()].filter((v): v is number => v !== null)
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

export function Month(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState<ISODate | null>(null)

  const month = monthKey(cursor)
  const prevMonth = monthKey(subMonths(cursor, 1))
  const indices = useLiveQuery(() => (settings ? monthDailyIndices(month, settings.goals) : Promise.resolve(new Map<ISODate, number | null>())), [month, settings?.goals])
  const prevIndices = useLiveQuery(() => (settings ? monthDailyIndices(prevMonth, settings.goals) : Promise.resolve(new Map<ISODate, number | null>())), [prevMonth, settings?.goals])

  if (!settings || !indices || !prevIndices) return <p className="p-6 text-ink-3">Cargando…</p>

  const first = startOfMonth(cursor)
  const daysInMonth = eachDayOfInterval({ start: first, end: endOfMonth(cursor) })
  const leadPad = (getDay(first) + 6) % 7 // lunes primero

  const avg = monthAvg(indices)
  const prevAvg = monthAvg(prevIndices)
  const delta = avg !== null && prevAvg !== null ? avg - prevAvg : null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={() => { setCursor(subMonths(cursor, 1)); setSelected(null) }} aria-label="Mes anterior" className="rounded-lg border border-line px-3 py-1.5 text-ink-2 hover:border-accent">‹</button>
        <h1 className="font-display text-2xl font-semibold text-ink first-letter:uppercase">{format(cursor, 'MMMM yyyy', { locale: es })}</h1>
        <button onClick={() => { setCursor(addMonths(cursor, 1)); setSelected(null) }} aria-label="Mes siguiente" className="rounded-lg border border-line px-3 py-1.5 text-ink-2 hover:border-accent">›</button>
      </div>

      {/* Comparación con el mes anterior (RF-803) */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <span className="text-ink-2">Promedio del mes</span>
        <span className="font-display text-2xl font-semibold tnum text-ink">{avg ?? '—'}</span>
        {delta !== null && (
          <span className="tnum" style={{ color: delta > 0 ? 'var(--color-ok)' : delta < 0 ? 'var(--color-danger)' : 'var(--color-ink-3)' }}>
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {delta !== 0 && Math.abs(delta)} vs. mes anterior
          </span>
        )}
      </div>

      {/* Heatmap */}
      <div>
        <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[10px] text-ink-3">
          {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadPad }, (_, i) => <span key={`pad-${i}`} />)}
          {daysInMonth.map((day) => {
            const date = format(day, 'yyyy-MM-dd')
            const idx = indices.get(date)
            const noData = idx === null || idx === undefined
            return (
              <button
                key={date}
                onClick={() => setSelected(date)}
                aria-label={`${format(day, "d 'de' MMMM", { locale: es })}: ${noData ? 'sin datos' : idx}`}
                className={`aspect-square rounded-md text-[11px] font-semibold tnum transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${selected === date ? 'ring-2 ring-accent' : ''}`}
                style={{ background: cellColor(idx), color: noData ? 'var(--color-ink-3)' : 'var(--color-bg)' }}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-ink-3">Gris = sin datos ese día (distinto de un día con índice 0).</p>
      </div>

      {selected && <DayDetail date={selected} index={indices.get(selected) ?? null} />}
    </div>
  )
}

function DayDetail({ date, index }: { date: ISODate; index: number | null }): React.ReactElement {
  const food = useLiveQuery(() => listFoodByDate(date), [date])
  const workouts = useLiveQuery(() => listWorkoutsByDate(date), [date])
  const sleep = useLiveQuery(() => getSleep(date), [date])
  const day = useLiveQuery(() => db.days.get(date), [date])

  const nice = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })
  const lines: string[] = []
  if (day?.waterMl) lines.push(`Agua · ${day.waterMl} ml`)
  if (sleep) lines.push(`Sueño · ${sleep.hours} h`)
  food?.forEach((f) => lines.push(f.category === 'meal' ? `Comida ${f.quality === 'fast' ? 'rápida' : 'real'}` : 'Picoteo'))
  workouts?.forEach((w) => lines.push(w.type === 'swim' ? 'Natación' : w.type === 'strength' ? 'Fuerza' : 'Entreno'))

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink first-letter:uppercase">{nice}</h2>
        <span className="font-display text-2xl font-semibold tnum text-ink">{index ?? '—'}</span>
      </div>
      {lines.length ? (
        <ul className="flex flex-col gap-1 text-sm text-ink-2">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      ) : (
        <p className="text-sm text-ink-3">Sin registros este día.</p>
      )}
    </section>
  )
}
