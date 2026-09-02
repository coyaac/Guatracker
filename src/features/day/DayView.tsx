import { useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  deleteFood,
  deleteSleep,
  deleteWorkout,
  getSleep,
  listFoodByDate,
  listWorkoutsByDate,
  todayISO,
} from '../../db/repositories'
import { db } from '../../db/schema'
import type { FoodEvent, Workout } from '../../db/schema'
import type { ISODate } from '../../domain/dates'
import { QuickLog } from '../quicklog/QuickLog'

const MEAL_LABEL = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once', cena: 'Cena' } as const

function foodLabel(f: FoodEvent): string {
  const name = f.name ? ` · ${f.name}` : ''
  const qty = f.quantity && f.quantity > 1 ? ` ×${f.quantity}` : ''
  if (f.category === 'meal') {
    const meal = f.meal ? MEAL_LABEL[f.meal] : 'Comida'
    return `${meal} ${f.quality === 'fast' ? 'rápida' : 'real'}${name}${qty}`
  }
  const kind = f.snackKind === 'dulce' ? 'Picoteo dulce' : f.snackKind === 'salado' ? 'Picoteo salado' : 'Bebida azucarada'
  return `${kind}${name}${qty}`
}

const foodColor = (f: FoodEvent): string =>
  f.category === 'snack' ? 'var(--color-dim-snacking)' : f.quality === 'fast' ? 'var(--color-dim-nutrition)' : 'var(--color-ok)'

const WORKOUT_LABEL: Record<Workout['type'], string> = {
  swim: 'Natación',
  strength: 'Fuerza',
  walk: 'Caminata',
  other: 'Otro',
}

const today = todayISO()
const minDate = format(subDays(parseISO(today), 30), 'yyyy-MM-dd') // retroactivo hasta 30 días (RF-106)

export function DayView(): React.ReactElement {
  const [date, setDate] = useState<ISODate>(today)

  const food = useLiveQuery(() => listFoodByDate(date), [date])
  const workouts = useLiveQuery(() => listWorkoutsByDate(date), [date])
  const sleep = useLiveQuery(() => getSleep(date), [date])
  const day = useLiveQuery(() => db.days.get(date), [date])

  const nice = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })
  const empty = !food?.length && !workouts?.length && !sleep && !day?.waterMl

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-6 pb-24">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Registros</h1>
        <p className="text-sm text-ink-3 first-letter:uppercase">{nice}</p>
      </div>

      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Ver / registrar en otro día
        <input
          type="date"
          value={date}
          min={minDate}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-line bg-raised px-2 py-1.5 text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        />
      </label>

      <section aria-label="Registros del día" className="flex flex-col gap-2">
        {empty && <p className="rounded-xl border border-line bg-surface p-4 text-center text-sm text-ink-3">Sin registros este día.</p>}

        {typeof day?.waterMl === 'number' && day.waterMl > 0 && (
          <Row label={`Agua · ${day.waterMl} ml`} color="var(--color-dim-hydration)" />
        )}
        {sleep && (
          <Row
            label={`Sueño · ${sleep.hours} h (${sleep.bedtime}–${sleep.wakeTime})`}
            color="var(--color-dim-sleep)"
            onDelete={() => void deleteSleep(date)}
          />
        )}
        {food?.map((f) => (
          <Row
            key={f.id}
            label={`${foodLabel(f)}${f.time ? ` · ${f.time}` : ''}`}
            color={foodColor(f)}
            onDelete={() => void deleteFood(f.id)}
          />
        ))}
        {workouts?.map((w) => (
          <Row
            key={w.id}
            label={`${WORKOUT_LABEL[w.type]}${w.durationMin ? ` · ${w.durationMin} min` : ''}${w.sets?.length ? ` · ${w.sets.length} series` : ''}`}
            color="var(--color-dim-training)"
            onDelete={() => void deleteWorkout(w.id)}
          />
        ))}
      </section>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-2">
          {date === today ? 'Registrar hoy' : 'Registrar en este día'}
        </h2>
        <QuickLog date={date} />
      </div>
    </div>
  )
}

function Row({ label, color, onDelete }: { label: string; color: string; onDelete?: () => void }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
      <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
      <span className="flex-1 text-sm text-ink">{label}</span>
      {onDelete && (
        <button
          onClick={onDelete}
          aria-label={`Eliminar ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          ✕
        </button>
      )}
    </div>
  )
}
