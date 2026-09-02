import { useState } from 'react'
import { addMeal, addSnack, saveSleep } from '../../db/repositories'
import type { ISODate } from '../../domain/dates'
import type { Meal, SleepLog, SnackKind } from '../../db/schema'
import { Sheet } from '../../components/Sheet'

const field = 'w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
const saveBtn = 'mt-2 min-h-[52px] w-full rounded-xl bg-accent font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100'

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string; color?: string }[] }): React.ReactElement {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => {
        const active = value === o.v
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={active}
            className="min-h-[44px] rounded-lg border px-2 py-2 text-sm font-medium transition"
            style={active
              ? { borderColor: o.color ?? 'var(--color-accent)', color: o.color ?? 'var(--color-accent-soft)', background: 'color-mix(in srgb, currentColor 12%, transparent)' }
              : { borderColor: 'var(--color-line)', color: 'var(--color-ink-2)' }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Quantity({ value, onChange }: { value: number; onChange: (n: number) => void }): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Menos" className="h-11 w-11 rounded-lg border border-line text-xl text-ink">−</button>
      <span className="min-w-8 text-center font-display text-2xl font-semibold tnum text-ink">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Más" className="h-11 w-11 rounded-lg border border-line text-xl text-ink">+</button>
    </div>
  )
}

const defaultMeal = (): Meal => {
  const h = new Date().getHours()
  return h < 11 ? 'desayuno' : h < 16 ? 'almuerzo' : h < 20 ? 'once' : 'cena'
}

export function MealSheet({ date, onClose }: { date: ISODate; onClose: () => void }): React.ReactElement {
  const [meal, setMeal] = useState<Meal>(defaultMeal())
  const [quality, setQuality] = useState<'fast' | 'real'>('real')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)

  return (
    <Sheet title="Agregar comida" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Group label="¿Qué comida?">
          <Seg value={meal} onChange={setMeal} options={[{ v: 'desayuno', label: 'Desayuno' }, { v: 'almuerzo', label: 'Almuerzo' }, { v: 'once', label: 'Once' }, { v: 'cena', label: 'Cena' }]} />
        </Group>
        <Group label="¿Cómo fue?">
          <Seg value={quality} onChange={setQuality} options={[{ v: 'fast', label: '🍔 Rápida', color: 'var(--color-dim-nutrition)' }, { v: 'real', label: '🍳 Real', color: 'var(--color-ok)' }]} />
        </Group>
        <Group label="¿Qué comiste? (opcional)">
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="completos, ensalada, sushi…" />
        </Group>
        <Group label="Cantidad">
          <Quantity value={quantity} onChange={setQuantity} />
        </Group>
        <button className={saveBtn} onClick={() => { void addMeal({ meal, quality, name, quantity, date }); onClose() }}>Guardar</button>
      </div>
    </Sheet>
  )
}

export function SnackSheet({ date, onClose }: { date: ISODate; onClose: () => void }): React.ReactElement {
  const [snackKind, setSnackKind] = useState<SnackKind>('dulce')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)

  return (
    <Sheet title="Agregar picoteo" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Group label="¿Qué tipo?">
          <Seg value={snackKind} onChange={setSnackKind} options={[{ v: 'dulce', label: 'Dulce' }, { v: 'salado', label: 'Salado' }, { v: 'sugary', label: 'Bebida azucarada' }]} />
        </Group>
        <Group label="¿Qué fue? (opcional)">
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="chocolate, papas fritas, bebida…" />
        </Group>
        <Group label="Cantidad">
          <Quantity value={quantity} onChange={setQuantity} />
        </Group>
        <button className={saveBtn} onClick={() => { void addSnack({ snackKind, name, quantity, date }); onClose() }}>Guardar</button>
      </div>
    </Sheet>
  )
}

export function SleepSheet({ date, onClose }: { date: ISODate; onClose: () => void }): React.ReactElement {
  const [bedtime, setBedtime] = useState('01:30')
  const [wakeTime, setWakeTime] = useState('09:00')
  const [quality, setQuality] = useState<SleepLog['quality']>('ok')

  return (
    <Sheet title="Sueño de anoche" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
          Me acosté
          <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="rounded-lg border border-line bg-raised px-2 py-1.5 text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
          Desperté
          <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="rounded-lg border border-line bg-raised px-2 py-1.5 text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" />
        </label>
        <Group label="Calidad">
          <Seg value={quality} onChange={setQuality} options={[{ v: 'bad', label: 'Mala' }, { v: 'ok', label: 'Regular' }, { v: 'good', label: 'Buena' }]} />
        </Group>
        <button className={saveBtn} onClick={() => { void saveSleep(date, bedtime, wakeTime, quality); onClose() }}>Guardar sueño</button>
      </div>
    </Sheet>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink-2">{label}</span>
      {children}
    </div>
  )
}
