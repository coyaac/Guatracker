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

export function Settings(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const [saved, setSaved] = useState(false)
  const [draft, setDraft] = useState<Goals | null>(null)

  if (!settings) return <p className="p-6 text-slate-500">Cargando…</p>
  const goals = draft ?? settings.goals

  const set = (patch: Partial<Goals>): void => {
    setDraft({ ...goals, ...patch })
    setSaved(false)
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-bold">Ajustes · Metas</h1>

      {NUMERIC_FIELDS.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-2 text-sm">
          {f.label}
          <input
            type="number"
            inputMode="decimal"
            step={f.step ?? 1}
            value={goals[f.key] as number}
            onChange={(e) => set({ [f.key]: Number(e.target.value) } as Partial<Goals>)}
            className="w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-800"
          />
        </label>
      ))}

      <label className="flex items-center justify-between gap-2 text-sm">
        Hora límite de acostarse
        <input
          type="time"
          value={goals.bedtimeLimit}
          onChange={(e) => set({ bedtimeLimit: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
        />
      </label>

      <fieldset className="flex items-center justify-between gap-2 text-sm">
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
              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-800"
            />
          ))}
        </div>
      </fieldset>

      <button
        className="min-h-[44px] rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500"
        onClick={() => {
          if (draft) void saveSettings({ goals: draft })
          setSaved(true)
        }}
      >
        Guardar metas
      </button>
      {saved && <p role="status" className="text-center text-sm text-emerald-600">Metas guardadas.</p>}
    </div>
  )
}
