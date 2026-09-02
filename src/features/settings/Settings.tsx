import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, saveSettings } from '../../db/repositories'
import type { Goals } from '../../domain/goals'

const NUMERIC_FIELDS: { key: keyof Goals; label: string; step?: number }[] = [
  { key: 'fastFoodPerWeek', label: 'Comida rápida / semana' },
  { key: 'sweetSnacksPerWeek', label: 'Picoteo dulce / semana' },
  { key: 'waterMlPerDay', label: 'Agua (ml) / día', step: 250 },
  { key: 'sugaryDrinksPerWeek', label: 'Bebidas azucaradas / semana' },
  { key: 'strengthPerWeek', label: 'Sesiones de fuerza / semana' },
  { key: 'swimPerWeek', label: 'Natación / semana' },
  { key: 'sleepHours', label: 'Horas de sueño / noche', step: 0.5 },
]

const input = 'w-28 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

export function Settings(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<Goals | null>(null)

  if (!settings) return <p className="p-6 text-ink-3">Cargando…</p>
  const goals = draft ?? settings.goals

  const set = (patch: Partial<Goals>): void => {
    setDraft({ ...goals, ...patch })
    setSaved(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-6 pb-24">
      <h1 className="font-display text-3xl font-semibold text-ink">Ajustes · Metas</h1>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        {NUMERIC_FIELDS.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-2 text-sm text-ink-2">
            {f.label}
            <input
              type="number"
              inputMode="decimal"
              step={f.step ?? 1}
              value={goals[f.key] as number}
              onChange={(e) => set({ [f.key]: Number(e.target.value) } as Partial<Goals>)}
              className={input}
            />
          </label>
        ))}

        <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
          Hora límite de acostarse
          <input
            type="time"
            value={goals.bedtimeLimit}
            onChange={(e) => set({ bedtimeLimit: e.target.value })}
            className="rounded-lg border border-line bg-raised px-2 py-1.5 text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>

        <fieldset className="flex items-center justify-between gap-2 text-sm text-ink-2">
          <legend className="float-left">Rango de peso (kg)</legend>
          <div className="flex gap-2">
            {[0, 1].map((i) => (
              <input
                key={i}
                type="number"
                inputMode="decimal"
                value={goals.weightRangeKg[i]}
                onChange={(e) => {
                  const next: [number, number] = [...goals.weightRangeKg]
                  next[i] = Number(e.target.value)
                  set({ weightRangeKg: next })
                }}
                className="w-20 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
            ))}
          </div>
        </fieldset>
      </div>

      <button
        className="min-h-[52px] rounded-xl bg-accent px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100"
        onClick={() => {
          if (draft) void saveSettings({ goals: draft })
          setSaved(true)
        }}
      >
        Guardar metas
      </button>
      {saved && <p role="status" className="text-center text-sm text-ok">Metas guardadas.</p>}
    </div>
  )
}
