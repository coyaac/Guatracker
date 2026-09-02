import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings, saveSettings } from '../../db/repositories'
import type { Goals } from '../../domain/goals'
import type { ThemePref } from '../../app/theme'
import { requestNotificationPermission } from '../../app/reminders'
import { ExportButton, ImportButton, WipeButton } from '../backup/BackupControls'

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

      {/* Tema (RF-906) */}
      <Section title="Apariencia">
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-line">
          {(['light', 'dark', 'system'] as ThemePref[]).map((t) => (
            <button
              key={t}
              onClick={() => void saveSettings({ theme: t })}
              aria-current={settings.theme === t ? 'true' : undefined}
              className={`py-2.5 text-sm font-medium transition ${settings.theme === t ? 'bg-raised text-accent-soft' : 'text-ink-3'}`}
            >
              {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
            </button>
          ))}
        </div>
      </Section>

      {/* Recordatorios (RF-905) */}
      <Section title="Recordatorios">
        <p className="text-xs text-ink-3">Locales y opcionales. Llegan mientras la app está abierta; nada sale de tu dispositivo.</p>
        <Reminder label="Registrar el sueño (mañana)" k="sleep" settings={settings} />
        <Reminder label="Beber agua (tarde)" k="water" settings={settings} />
        <Reminder label="Hora de dormir (30 min antes de tu meta)" k="bedtime" settings={settings} />
      </Section>

      {/* Datos (RF-902..904) */}
      <Section title="Mis datos">
        <p className="text-xs text-ink-3">Respalda cada tanto: si limpias el navegador o cambias de celular, el .json te devuelve todo.</p>
        <ExportButton />
        <ImportButton />
        <WipeButton />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section className="mt-2 flex flex-col gap-3">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function Reminder({ label, k, settings }: { label: string; k: 'sleep' | 'water' | 'bedtime'; settings: { reminders?: { sleep: boolean; water: boolean; bedtime: boolean } } }): React.ReactElement {
  const on = settings.reminders?.[k] ?? false
  const toggle = async (): Promise<void> => {
    const next = !on
    if (next && !(await requestNotificationPermission())) return // sin permiso, no activa
    const base = settings.reminders ?? { sleep: false, water: false, bedtime: false }
    await saveSettings({ reminders: { ...base, [k]: next } })
  }
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-ink-2">
      {label}
      <button
        role="switch"
        aria-checked={on}
        onClick={() => void toggle()}
        className={`h-6 w-11 flex-none rounded-full p-0.5 transition ${on ? 'bg-accent' : 'bg-line'}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-bg transition ${on ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  )
}
