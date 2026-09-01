import { useState } from 'react'
import { addFood, addWater, saveSleep, todayISO } from '../../db/repositories'
import type { SleepLog } from '../../db/schema'

const btn =
  'min-h-[44px] rounded-xl px-4 py-2 font-medium text-white transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'

export function QuickLog(): React.ReactElement {
  const [panel, setPanel] = useState<'none' | 'snack' | 'sleep'>('none')

  return (
    <section aria-label="Registro rápido" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <button className={`${btn} bg-sky-600 hover:bg-sky-500`} onClick={() => void addWater(250)}>
          + Agua (1 vaso)
        </button>
        <button
          className={`${btn} bg-slate-500 hover:bg-slate-400`}
          onClick={() => void addWater(-250)}
          aria-label="Deshacer último vaso de agua"
        >
          − Deshacer agua
        </button>
        <button className={`${btn} bg-rose-600 hover:bg-rose-500`} onClick={() => void addFood('fastfood')}>
          + Comida rápida
        </button>
        <button
          className={`${btn} bg-amber-600 hover:bg-amber-500`}
          onClick={() => setPanel(panel === 'snack' ? 'none' : 'snack')}
          aria-expanded={panel === 'snack'}
        >
          + Picoteo
        </button>
        <button
          className={`${btn} col-span-2 bg-indigo-600 hover:bg-indigo-500`}
          onClick={() => setPanel(panel === 'sleep' ? 'none' : 'sleep')}
          aria-expanded={panel === 'sleep'}
        >
          + Sueño de anoche
        </button>
      </div>

      {panel === 'snack' && <SnackPicker onDone={() => setPanel('none')} />}
      {panel === 'sleep' && <SleepForm onDone={() => setPanel('none')} />}
    </section>
  )
}

function SnackPicker({ onDone }: { onDone: () => void }): React.ReactElement {
  const opts: { kind: Parameters<typeof addFood>[0]; label: string }[] = [
    { kind: 'snack_sweet', label: 'Dulce' },
    { kind: 'snack_salty', label: 'Salado' },
    { kind: 'sugary_drink', label: 'Bebida azucarada' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-900">
      {opts.map((o) => (
        <button
          key={o.kind}
          className="min-h-[44px] rounded-lg bg-amber-600 px-2 py-2 text-sm font-medium text-white hover:bg-amber-500"
          onClick={() => {
            void addFood(o.kind)
            onDone()
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SleepForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [bedtime, setBedtime] = useState('01:30')
  const [wakeTime, setWakeTime] = useState('09:00')
  const [quality, setQuality] = useState<SleepLog['quality']>('ok')

  return (
    <form
      className="flex flex-col gap-3 rounded-xl bg-slate-100 p-4 dark:bg-slate-900"
      onSubmit={(e) => {
        e.preventDefault()
        void saveSleep(todayISO(), bedtime, wakeTime, quality)
        onDone()
      }}
    >
      <label className="flex items-center justify-between gap-2 text-sm">
        Me acosté
        <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        Desperté
        <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" required />
      </label>
      <fieldset className="flex gap-2">
        <legend className="mb-1 text-sm">Calidad</legend>
        {(['bad', 'ok', 'good'] as const).map((q) => (
          <label key={q} className={`flex-1 cursor-pointer rounded-lg border px-2 py-2 text-center text-sm ${quality === q ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-300 dark:border-slate-700'}`}>
            <input type="radio" name="quality" className="sr-only" checked={quality === q} onChange={() => setQuality(q)} />
            {q === 'bad' ? 'Mala' : q === 'ok' ? 'Regular' : 'Buena'}
          </label>
        ))}
      </fieldset>
      <button type="submit" className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500">
        Guardar sueño
      </button>
    </form>
  )
}
