import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { generateAndStore, listSummaries } from '../../db/summaryRepo'
import { todayISO } from '../../db/repositories'
import { indexTier, type Tier } from '../../domain/scoring'
import type { Dimension } from '../../domain/goals'
import type { WeeklySummary } from '../../domain/summary'

const DIM_LABEL: Record<Dimension, string> = {
  nutrition: 'Alim.',
  snacking: 'Picoteo',
  hydration: 'Hidrat.',
  training: 'Entren.',
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

export function Summary(): React.ReactElement {
  const summaries = useLiveQuery(listSummaries)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  if (!summaries) return <p className="p-6 text-ink-3">Cargando…</p>

  const current = summaries.find((s) => s.week === selectedWeek) ?? summaries[0] ?? null

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Resumen</h1>
        <button
          onClick={() => void generateAndStore(todayISO())}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-accent-soft transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Actualizar esta semana
        </button>
      </div>

      {!current ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-center text-sm text-ink-3">
          Aún no hay resúmenes. Registra unos días y aquí verás tu semana.
        </p>
      ) : (
        <SummaryCard summary={current} />
      )}

      {summaries.length > 1 && (
        <section aria-label="Historial de resúmenes" className="flex flex-col gap-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-2">Historial</h2>
          <div className="flex flex-wrap gap-2">
            {summaries.map((s) => (
              <button
                key={s.week}
                onClick={() => setSelectedWeek(s.week)}
                aria-current={current?.week === s.week ? 'true' : undefined}
                className={`rounded-lg border px-3 py-1.5 text-sm tnum transition ${
                  current?.week === s.week ? 'border-accent text-accent-soft' : 'border-line text-ink-2'
                }`}
              >
                {s.week} · {s.score}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({ summary }: { summary: WeeklySummary }): React.ReactElement {
  const tierColor = TIER_COLOR[indexTier(summary.score)]
  const d = summary.deltaVsPreviousWeek
  const arrow = d > 0 ? '↑' : d < 0 ? '↓' : '='
  const arrowColor = d > 0 ? 'var(--color-ok)' : d < 0 ? 'var(--color-danger)' : 'var(--color-ink-3)'

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-6xl font-semibold leading-none tnum" style={{ color: tierColor }}>
          {summary.score}
        </span>
        <span className="font-display text-lg font-semibold tnum" style={{ color: arrowColor }}>
          {arrow} {d !== 0 && `${Math.abs(d)}`}
        </span>
        <span className="ml-auto text-sm text-ink-3 tnum">{summary.week}</span>
      </div>

      {/* Desglose por dimensión */}
      <div className="grid grid-cols-5 gap-1.5">
        {(Object.keys(DIM_LABEL) as Dimension[]).map((dim) => (
          <div key={dim} className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end rounded bg-raised">
              <div className="w-full rounded" style={{ height: `${summary.dimensions[dim]}%`, background: DIM_COLOR[dim] }} />
            </div>
            <span className="font-display text-sm font-semibold tnum text-ink">{summary.dimensions[dim]}</span>
            <span className="text-[10px] text-ink-3">{DIM_LABEL[dim]}</span>
          </div>
        ))}
      </div>

      {summary.lowData ? (
        <p className="rounded-lg bg-raised p-3 text-sm text-ink-2">{summary.action}</p>
      ) : (
        <>
          <List title="Vas bien en" color="var(--color-ok)" items={summary.strengths} />
          <List title="Para mejorar" color="var(--color-warn)" items={summary.weaknesses} />
          <div className="rounded-xl border-l-4 p-3" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-raised)' }}>
            <p className="mb-1 font-display text-sm font-semibold uppercase tracking-wide text-accent-soft">Tu acción de la semana</p>
            <p className="text-sm text-ink">{summary.action}</p>
          </div>
        </>
      )}
    </div>
  )
}

function List({ title, color, items }: { title: string; color: string; items: string[] }): React.ReactElement | null {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="mb-1.5 font-display text-sm font-semibold uppercase tracking-wide text-ink-2">{title}</h3>
      <ul className="flex flex-col gap-1 text-sm text-ink">
        {items.map((t) => (
          <li key={t} className="flex gap-2">
            <span aria-hidden style={{ color }}>•</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
