import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getBodyMetric, listBodyMetrics, saveBodyMetric, todayISO } from '../../db/repositories'
import { changeSince, changeSinceStart, movingAverage, type MetricPoint } from '../../domain/body'
import type { BodyMetric } from '../../db/schema'
import { LineChart } from '../../components/LineChart'
import { Photos } from './Photos'

const MEASURES: { key: keyof BodyMetric; label: string }[] = [
  { key: 'waistCm', label: 'Cintura (cm)' },
  { key: 'abdomenCm', label: 'Abdomen (cm)' },
  { key: 'hipCm', label: 'Cadera (cm)' },
  { key: 'chestCm', label: 'Pecho (cm)' },
  { key: 'armCm', label: 'Brazo (cm)' },
]

const seriesOf = (rows: BodyMetric[], key: keyof BodyMetric): MetricPoint[] =>
  rows
    .filter((r) => typeof r[key] === 'number')
    .map((r) => ({ date: r.date, value: r[key] as number }))

const fmt = (n: number | null, unit: string): string =>
  n === null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)} ${unit}`

export function Body(): React.ReactElement {
  const rows = useLiveQuery(listBodyMetrics)
  const today = useLiveQuery(() => getBodyMetric(todayISO()))

  if (!rows) return <p className="p-6 text-ink-3">Cargando…</p>

  const weight = seriesOf(rows, 'weightKg')
  const waist = seriesOf(rows, 'waistCm')
  const weightMA = movingAverage(weight, 7)

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-24">
      <h1 className="font-display text-3xl font-semibold text-ink">Peso y medidas</h1>

      {/* Cintura primero: en este caso pesa más que la báscula (RF-505). */}
      <Chart title="Cintura" note="La métrica más relevante — puede bajar aunque el peso no se mueva." color="var(--color-dim-hydration)" points={waist} unit=" cm" />

      <section className="flex flex-col gap-2">
        <ChartHeader title="Peso" note="Línea = media móvil de 7 días; puntos = registros diarios." />
        <div className="rounded-xl border border-line bg-surface p-3">
          <LineChart points={weight} line={weightMA} color="var(--color-accent-soft)" unit=" kg" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Delta label="vs. hace 4 semanas" value={fmt(changeSince(weight, 28), 'kg')} />
          <Delta label="desde el inicio" value={fmt(changeSinceStart(weight), 'kg')} />
        </div>
      </section>

      <BodyForm existing={today} />
      <Photos />
    </div>
  )
}

function Chart({ title, note, color, points, unit }: { title: string; note: string; color: string; points: MetricPoint[]; unit: string }): React.ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <ChartHeader title={title} note={note} />
      <div className="rounded-xl border border-line bg-surface p-3">
        <LineChart points={points} color={color} unit={unit} />
      </div>
    </section>
  )
}

function ChartHeader({ title, note }: { title: string; note: string }): React.ReactElement {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <p className="text-xs text-ink-3">{note}</p>
    </div>
  )
}

function Delta({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="font-display text-2xl font-semibold text-ink tnum">{value}</p>
    </div>
  )
}

function BodyForm({ existing }: { existing: BodyMetric | undefined }): React.ReactElement {
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const val = (key: keyof BodyMetric): string => draft[key] ?? (existing?.[key]?.toString() ?? '')
  const input = 'w-24 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

  const save = (): void => {
    const patch: Partial<BodyMetric> = {}
    const weight = draft.weightKg ?? existing?.weightKg?.toString()
    if (weight) patch.weightKg = Number(weight)
    for (const m of MEASURES) {
      const v = draft[m.key] ?? existing?.[m.key]?.toString()
      if (v) patch[m.key] = Number(v) as never
    }
    void saveBodyMetric(todayISO(), patch)
    setSaved(true)
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
      <h2 className="font-display text-xl font-semibold text-ink">Registrar hoy</h2>
      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Peso (kg)
        <input type="number" inputMode="decimal" step="0.1" value={val('weightKg')} onChange={(e) => { setDraft({ ...draft, weightKg: e.target.value }); setSaved(false) }} className={input} />
      </label>
      {MEASURES.map((m) => (
        <label key={m.key} className="flex items-center justify-between gap-2 text-sm text-ink-2">
          {m.label}
          <input type="number" inputMode="decimal" step="0.1" value={val(m.key)} onChange={(e) => { setDraft({ ...draft, [m.key]: e.target.value }); setSaved(false) }} className={input} />
        </label>
      ))}
      <button
        onClick={save}
        className="min-h-[48px] rounded-xl bg-accent font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100"
      >
        Guardar
      </button>
      {saved && <p role="status" className="text-center text-sm text-ok">Guardado.</p>}
    </section>
  )
}
