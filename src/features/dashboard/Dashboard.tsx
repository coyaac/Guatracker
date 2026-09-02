import { useLiveQuery } from 'dexie-react-hooks'
import { dayAggregate, weekAggregate } from '../../db/aggregate'
import { getSettings, listFoodByDate, todayISO } from '../../db/repositories'
import { computeStreaks } from '../../db/summaryRepo'
import { indexTier, weeklyDimensions, weeklyIndex, type Tier } from '../../domain/scoring'
import type { FoodEvent, Meal } from '../../db/schema'
import { Ring } from '../../components/Ring'
import { Wordmark } from '../../components/Logo'
import { QuickLog } from '../quicklog/QuickLog'

const TIER_COLOR: Record<Tier, string> = {
  excelente: 'var(--color-tier-excelente)',
  bien: 'var(--color-tier-bien)',
  'a medias': 'var(--color-tier-medias)',
  flojo: 'var(--color-tier-flojo)',
}
const MEAL_LABEL: Record<Meal, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once', cena: 'Cena' }

export function Dashboard(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const week = useLiveQuery(() => weekAggregate())
  const day = useLiveQuery(() => dayAggregate())
  const streaks = useLiveQuery(() => computeStreaks())
  const todayFood = useLiveQuery(() => listFoodByDate(todayISO()))

  if (!settings || !week || !day || !todayFood) return <p className="p-6 text-ink-3">Cargando…</p>

  const goals = settings.goals
  const dims = weeklyDimensions(week, goals)
  const index = weeklyIndex(week, goals)
  const tier = indexTier(index)
  const tierColor = TIER_COLOR[tier]
  const hasData = week.sleepNights.length > 0 || week.waterByDay.some((w) => w > 0) || week.fastFood > 0 || todayFood.length > 0

  const missing = whatIsMissing(day, goals)
  const weeklySnacks = week.snackSweet + week.snackSalty + week.sugaryDrinks

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 px-4 pt-4 pb-24">
      <Wordmark size={20} />

      <header className="text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Índice de adherencia · esta semana</p>
        <p className="font-display text-7xl font-semibold leading-none tnum" style={{ color: tierColor }}>{index}</p>
        <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide" style={{ color: tierColor }}>{tier}</p>
        {!hasData && <p className="mt-1 text-sm text-ink-2">Aún sin datos. Registra algo para empezar.</p>}
      </header>

      {missing.length > 0 && (
        <section aria-label="Qué falta hoy" className="rounded-xl border border-line bg-surface p-4">
          <h2 className="mb-2 font-display text-base font-semibold uppercase tracking-wide text-ink-2">Qué falta hoy</h2>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {missing.map((m) => (<li key={m} className="flex gap-2"><span aria-hidden className="text-accent-soft">›</span>{m}</li>))}
          </ul>
        </section>
      )}

      <QuickLog />

      <FoodCard food={todayFood} weeklyFast={week.fastFood} fastGoal={goals.fastFoodPerWeek} />
      <SnackCard food={todayFood} weeklySnacks={weeklySnacks} snackGoal={goals.sweetSnacksPerWeek} />

      <section aria-label="Esta semana" className="grid grid-cols-2 gap-4">
        <Ring value={dims.training} label="Entrenamiento" color="var(--color-dim-training)" />
        <Ring value={dims.sleep} label="Sueño" color="var(--color-dim-sleep)" />
      </section>

      {streaks && (streaks.recordDays > 0 || streaks.sleepNights > 0) && (
        <section aria-label="Rachas" className="grid grid-cols-2 gap-3">
          <StreakChip emoji="🔥" value={streaks.recordDays} unit={streaks.recordDays === 1 ? 'día registrado' : 'días registrados'} />
          <StreakChip emoji="🌙" value={streaks.sleepNights} unit={streaks.sleepNights === 1 ? 'noche ≥7 h' : 'noches ≥7 h'} />
        </section>
      )}
    </div>
  )
}

function FoodCard({ food, weeklyFast, fastGoal }: { food: FoodEvent[]; weeklyFast: number; fastGoal: number }): React.ReactElement {
  const meals = food.filter((f) => f.category === 'meal')
  const fast = meals.filter((m) => m.quality === 'fast').length
  const real = meals.filter((m) => m.quality === 'real').length
  const total = meals.length
  const pctFast = total ? Math.round((fast / total) * 100) : 0
  const overBudget = weeklyFast > fastGoal

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Alimentación</h2>
        <span className="font-display text-4xl font-semibold tnum" style={{ color: 'var(--color-dim-nutrition)' }}>{total}</span>
      </div>

      {total > 0 && (
        <>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-raised">
            <div style={{ width: `${pctFast}%`, background: 'var(--color-dim-nutrition)' }} />
            <div style={{ width: `${100 - pctFast}%`, background: 'var(--color-ok)' }} />
          </div>
          <div className="flex justify-between text-xs text-ink-2">
            <span style={{ color: 'var(--color-dim-nutrition)' }}>🍔 Rápida {fast} · {pctFast}%</span>
            <span style={{ color: 'var(--color-ok)' }}>🍳 Real {real} · {100 - pctFast}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(MEAL_LABEL) as Meal[]).map((m) => <MealChip key={m} meal={m} items={meals.filter((x) => x.meal === m)} />)}
          </div>
        </>
      )}

      <p className="text-xs text-ink-3">
        Comida rápida esta semana: <span className="tnum font-medium" style={{ color: overBudget ? 'var(--color-danger)' : 'var(--color-ink-2)' }}>{weeklyFast} / {fastGoal}</span>
      </p>
    </section>
  )
}

function MealChip({ meal, items }: { meal: Meal; items: FoodEvent[] }): React.ReactElement {
  const hasFast = items.some((i) => i.quality === 'fast')
  const hasReal = items.some((i) => i.quality === 'real')
  const color = items.length === 0 ? 'var(--color-line)' : hasFast && !hasReal ? 'var(--color-dim-nutrition)' : hasReal && !hasFast ? 'var(--color-ok)' : 'var(--color-warn)'
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-line py-2 text-center">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
      <span className="text-[10px] text-ink-3">{MEAL_LABEL[meal]}</span>
    </div>
  )
}

function SnackCard({ food, weeklySnacks, snackGoal }: { food: FoodEvent[]; weeklySnacks: number; snackGoal: number }): React.ReactElement {
  const snacks = food.filter((f) => f.category === 'snack')
  const by = (k: string): number => snacks.filter((s) => s.snackKind === k).length
  const overBudget = weeklySnacks > snackGoal

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Picoteo</h2>
        <span className="font-display text-4xl font-semibold tnum" style={{ color: 'var(--color-dim-snacking)' }}>{snacks.length}</span>
      </div>
      {snacks.length > 0 && (
        <p className="text-sm text-ink-2">Dulce {by('dulce')} · Salado {by('salado')} · Azucarada {by('sugary')}</p>
      )}
      <p className="text-xs text-ink-3">
        Esta semana: <span className="tnum font-medium" style={{ color: overBudget ? 'var(--color-danger)' : 'var(--color-ink-2)' }}>{weeklySnacks} / {snackGoal}</span>
      </p>
    </section>
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

function whatIsMissing(day: Awaited<ReturnType<typeof dayAggregate>>, goals: { waterMlPerDay: number }): string[] {
  const out: string[] = []
  const vasos = Math.ceil((goals.waterMlPerDay - day.waterMl) / 250)
  if (vasos > 0) out.push(`Te faltan ${vasos} ${vasos === 1 ? 'vaso' : 'vasos'} de agua.`)
  if (day.sleepHours === null) out.push('No has registrado el sueño de anoche.')
  return out
}
