import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addWater, getSettings, todayISO } from '../../db/repositories'
import { db } from '../../db/schema'
import type { ISODate } from '../../domain/dates'
import { Ring } from '../../components/Ring'
import { MealSheet, SnackSheet, SleepSheet } from './sheets'

const bigBtn =
  'min-h-[52px] rounded-xl px-4 py-2 font-display text-lg font-semibold tracking-wide text-bg transition active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100'

/** `date` opcional para registro retroactivo (RF-106); por defecto hoy. */
export function QuickLog({ date = todayISO() }: { date?: ISODate }): React.ReactElement {
  const [sheet, setSheet] = useState<'none' | 'meal' | 'snack' | 'sleep'>('none')
  const settings = useLiveQuery(getSettings)
  const day = useLiveQuery(() => db.days.get(date), [date])

  const goal = settings?.goals.waterMlPerDay ?? 2000
  const ml = day?.waterMl ?? 0
  const pct = Math.round((ml / goal) * 100)

  return (
    <section aria-label="Registro rápido" className="flex flex-col gap-3">
      {/* Agua: anillo diario (llega a 100% en la meta, muestra sobre-% si tomas más) + −/+ */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
        <Ring value={Math.min(pct, 100)} centerText={`${pct}%`} label="Agua hoy" color="var(--color-dim-hydration)" size={72} />
        <div className="flex-1">
          <p className="font-display text-2xl font-semibold tnum text-ink">
            {ml} <span className="text-base text-ink-3">/ {goal} ml</span>
          </p>
          <p className="text-xs text-ink-3">{pct >= 100 ? '¡Meta cumplida! 💧' : `Te faltan ${Math.ceil((goal - ml) / 250)} vasos`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void addWater(-250, date)} aria-label="Quitar un vaso de agua" className="h-12 w-12 rounded-xl border border-line text-2xl text-ink-2 active:scale-95">−</button>
          <button onClick={() => void addWater(250, date)} aria-label="Agregar un vaso de agua" className="h-12 w-12 rounded-xl text-2xl text-bg active:scale-95" style={{ background: 'var(--color-dim-hydration)' }}>+</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button className={bigBtn} style={{ background: 'var(--color-dim-nutrition)' }} onClick={() => setSheet('meal')}>+ Comida</button>
        <button className={bigBtn} style={{ background: 'var(--color-dim-snacking)' }} onClick={() => setSheet('snack')}>+ Picoteo</button>
        <button className={`${bigBtn} col-span-2`} style={{ background: 'var(--color-dim-sleep)' }} onClick={() => setSheet('sleep')}>+ Sueño de anoche</button>
      </div>

      {sheet === 'meal' && <MealSheet date={date} onClose={() => setSheet('none')} />}
      {sheet === 'snack' && <SnackSheet date={date} onClose={() => setSheet('none')} />}
      {sheet === 'sleep' && <SleepSheet date={date} onClose={() => setSheet('none')} />}
    </section>
  )
}
