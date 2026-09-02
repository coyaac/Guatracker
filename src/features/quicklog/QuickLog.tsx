import { useState } from 'react'
import { addFood, addWater, saveSleep, todayISO } from '../../db/repositories'
import type { SleepLog } from '../../db/schema'

// Botón de registro rápido: grande (≥44px), feedback inmediato al tocar.
const quick =
  'min-h-[52px] rounded-xl px-4 py-2 font-display text-lg font-semibold tracking-wide text-bg transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100'

export function QuickLog(): React.ReactElement {
  const [panel, setPanel] = useState<'none' | 'snack' | 'sleep'>('none')

  return (
    <section aria-label="Registro rápido" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2.5">
        <button className={quick} style={{ background: 'var(--color-dim-hydration)' }} onClick={() => void addWater(250)}>
          + Agua
        </button>
        <button
          className="min-h-[52px] rounded-xl border border-line px-4 py-2 font-display text-lg font-semibold tracking-wide text-ink-2 transition hover:bg-raised active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100"
          onClick={() => void addWater(-250)}
          aria-label="Deshacer último vaso de agua"
        >
          − Deshacer
        </button>
        <button className={quick} style={{ background: 'var(--color-dim-nutrition)' }} onClick={() => void addFood('fastfood')}>
          + Comida rápida
        </button>
        <button
          className={quick}
          style={{ background: 'var(--color-dim-snacking)' }}
          onClick={() => setPanel(panel === 'snack' ? 'none' : 'snack')}
          aria-expanded={panel === 'snack'}
        >
          + Picoteo
        </button>
        <button
          className={`${quick} col-span-2`}
          style={{ background: 'var(--color-dim-sleep)' }}
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
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-surface p-3">
      {opts.map((o) => (
        <button
          key={o.kind}
          className="min-h-[44px] rounded-lg border border-line px-2 py-2 text-sm font-medium text-ink transition hover:border-dim-snacking hover:text-dim-snacking focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

  const input = 'rounded-lg border border-line bg-raised px-2 py-1.5 text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void saveSleep(todayISO(), bedtime, wakeTime, quality)
        onDone()
      }}
    >
      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Me acosté
        <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className={input} required />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Desperté
        <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className={input} required />
      </label>
      <fieldset>
        <legend className="mb-1.5 text-sm text-ink-2">Calidad</legend>
        <div className="grid grid-cols-3 gap-2">
          {(['bad', 'ok', 'good'] as const).map((q) => (
            <label
              key={q}
              className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-sm transition ${
                quality === q ? 'border-dim-sleep text-dim-sleep' : 'border-line text-ink-2'
              }`}
            >
              <input type="radio" name="quality" className="sr-only" checked={quality === q} onChange={() => setQuality(q)} />
              {q === 'bad' ? 'Mala' : q === 'ok' ? 'Regular' : 'Buena'}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        className="min-h-[48px] rounded-xl font-display text-lg font-semibold tracking-wide text-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{ background: 'var(--color-dim-sleep)' }}
      >
        Guardar sueño
      </button>
    </form>
  )
}
