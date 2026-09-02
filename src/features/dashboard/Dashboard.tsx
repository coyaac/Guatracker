import { useLiveQuery } from 'dexie-react-hooks'
import { dayAggregate, weekAggregate } from '../../db/aggregate'
import { getSettings } from '../../db/repositories'
import { computeStreaks } from '../../db/summaryRepo'
import { indexTier, weeklyDimensions, weeklyIndex, type Tier } from '../../domain/scoring'
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

const DIM_COLOR: Record<Dimension, string> = {
  nutrition: 'var(--color-dim-nutrition)',
  snacking: 'var(--color-dim-snacking)',
  hydration: 'var(--color-dim-hydration)',
  training: 'var(--color-dim-training)',
  sleep: 'var(--color-dim-sleep)',
}

const TIER_COLOR: Record<Tier, string> = {
  excelente: 'var(--color-tier-excelente)',
  bien: 'var(--color-tier-bien)',
  'a medias': 'var(--color-tier-medias)',
  flojo: 'var(--color-tier-flojo)',
}

export function Dashboard(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const week = useLiveQuery(() => weekAggregate())
  const day = useLiveQuery(() => dayAggregate())
  const streaks = useLiveQuery(() => computeStreaks())

  if (!settings || !week || !day) {
    return <p className="p-6 text-ink-3">Cargando…</p>
  }

  const goals = settings.goals
  const dims = weeklyDimensions(week, goals)
  const index = weeklyIndex(week, goals)
  const tier = indexTier(index)
  const tierColor = TIER_COLOR[tier]
  const hasData = week.sleepNights.length > 0 || week.waterByDay.some((w) => w > 0) || week.fastFood > 0

  const missing = whatIsMissing(day, goals)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-7 px-4 pt-6 pb-24">
      <header className="text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Índice de adherencia · esta semana
        </p>
        <p className="font-display text-8xl font-semibold leading-none tnum" style={{ color: tierColor }}>
          {index}
        </p>
        <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide" style={{ color: tierColor }}>
          {tier}
        </p>
        {!hasData && <p className="mt-1 text-sm text-ink-2">Aún sin datos esta semana. Registra algo para empezar.</p>}
      </header>

      <section aria-label="Dimensiones de la semana" className="grid grid-cols-5 gap-1">
        {(Object.keys(dims) as Dimension[]).map((d) => (
          <Ring key={d} value={dims[d]} label={DIM_LABEL[d]} color={DIM_COLOR[d]} />
        ))}
      </section>

      {streaks && (streaks.recordDays > 0 || streaks.sleepNights > 0) && (
        <section aria-label="Rachas" className="grid grid-cols-2 gap-3">
          <StreakChip emoji="🔥" value={streaks.recordDays} unit={streaks.recordDays === 1 ? 'día registrado' : 'días registrados'} />
          <StreakChip emoji="🌙" value={streaks.sleepNights} unit={streaks.sleepNights === 1 ? 'noche ≥7 h' : 'noches ≥7 h'} />
        </section>
      )}

      {missing.length > 0 && (
        <section aria-label="Qué falta hoy" className="rounded-xl border border-line bg-surface p-4">
          <h2 className="mb-2 font-display text-base font-semibold uppercase tracking-wide text-ink-2">Qué falta hoy</h2>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {missing.map((m) => (
              <li key={m} className="flex gap-2">
                <span aria-hidden className="text-accent-soft">›</span>
                {m}
              </li>
            ))}
          </ul>
        </section>
      )}

      <QuickLog />
    </div>
  )
}

function StreakChip({ emoji, value, unit }: { emoji: string; value: number; unit: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span aria-hidden className="text-2xl">{emoji}</span>
      <div>
        <p className="font-display text-3xl font-semibold leading-none tnum text-ink">{value}</p>
        <p className="text-xs text-ink-3">{unit}</p>
      </div>
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
