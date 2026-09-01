import { useLiveQuery } from 'dexie-react-hooks'
import { dayAggregate, weekAggregate } from '../../db/aggregate'
import { getSettings } from '../../db/repositories'
import { indexTier, weeklyDimensions, weeklyIndex } from '../../domain/scoring'
import type { Dimension } from '../../domain/goals'
import { Ring } from '../../components/Ring'
import { QuickLog } from '../quicklog/QuickLog'

const DIM_LABEL: Record<Dimension, string> = {
  nutrition: 'Alimentación',
  snacking: 'Picoteo',
  hydration: 'Hidratación',
  training: 'Entrenamiento',
  sleep: 'Sueño',
}

const TIER_CLASS: Record<ReturnType<typeof indexTier>, string> = {
  excelente: 'text-emerald-600 dark:text-emerald-400',
  bien: 'text-sky-600 dark:text-sky-400',
  'a medias': 'text-amber-600 dark:text-amber-400',
  flojo: 'text-rose-600 dark:text-rose-400',
}

export function Dashboard(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const week = useLiveQuery(() => weekAggregate())
  const day = useLiveQuery(() => dayAggregate())

  if (!settings || !week || !day) {
    return <p className="p-6 text-slate-500">Cargando…</p>
  }

  const goals = settings.goals
  const dims = weeklyDimensions(week, goals)
  const index = weeklyIndex(week, goals)
  const tier = indexTier(index)
  const hasData = week.sleepNights.length > 0 || week.waterByDay.some((w) => w > 0) || week.fastFood > 0

  const missing = whatIsMissing(day, goals)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-4 pb-24">
      <header className="text-center">
        <p className="text-sm text-slate-500">Índice de adherencia semanal</p>
        <p className={`text-6xl font-bold tabular-nums ${TIER_CLASS[tier]}`}>{index}</p>
        <p className={`text-sm font-medium ${TIER_CLASS[tier]}`}>
          {tier} {!hasData && '· aún sin datos esta semana'}
        </p>
      </header>

      <section aria-label="Dimensiones de la semana" className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {(Object.keys(dims) as Dimension[]).map((d) => (
          <Ring key={d} value={dims[d]} label={DIM_LABEL[d]} />
        ))}
      </section>

      {missing.length > 0 && (
        <section aria-label="Qué falta hoy" className="rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold">Qué falta hoy</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      <QuickLog />
    </div>
  )
}

function whatIsMissing(
  day: Awaited<ReturnType<typeof dayAggregate>>,
  goals: { waterMlPerDay: number },
): string[] {
  const out: string[] = []
  const vasos = Math.ceil((goals.waterMlPerDay - day.waterMl) / 250)
  if (vasos > 0) out.push(`Te faltan ${vasos} ${vasos === 1 ? 'vaso' : 'vasos'} de agua.`)
  if (day.sleepHours === null) out.push('No has registrado el sueño de anoche.')
  return out
}
