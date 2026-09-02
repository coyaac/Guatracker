import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { addWorkout, getSettings, listExercises } from '../../db/repositories'
import { weekAggregate } from '../../db/aggregate'
import type { Exercise, ExerciseSet } from '../../db/schema'

type Draft = { exercise: Exercise; sets: ExerciseSet[] }

const primaryBtn =
  'min-h-[48px] rounded-xl bg-accent px-4 font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100'
const numInput = 'w-16 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

export function Training(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const week = useLiveQuery(() => weekAggregate())
  const exercises = useLiveQuery(listExercises)
  const [mode, setMode] = useState<'none' | 'swim' | 'strength'>('none')

  if (!settings || !week || !exercises) return <p className="p-6 text-ink-3">Cargando…</p>
  const g = settings.goals

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-6 pb-24">
      <h1 className="font-display text-3xl font-semibold text-ink">Entrenamiento</h1>

      <section aria-label="Progreso de la semana" className="grid grid-cols-2 gap-3">
        <Counter label="Fuerza" done={week.strengthSessions} goal={g.strengthPerWeek} color="var(--color-dim-training)" />
        <Counter label="Natación" done={week.swimSessions} goal={g.swimPerWeek} color="var(--color-dim-hydration)" />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button className={primaryBtn} onClick={() => setMode(mode === 'swim' ? 'none' : 'swim')} aria-expanded={mode === 'swim'}>
          + Natación
        </button>
        <button className={primaryBtn} onClick={() => setMode(mode === 'strength' ? 'none' : 'strength')} aria-expanded={mode === 'strength'}>
          + Fuerza
        </button>
      </div>

      {mode === 'swim' && <SwimForm onDone={() => setMode('none')} />}
      {mode === 'strength' && <StrengthForm exercises={exercises} onDone={() => setMode('none')} />}
    </div>
  )
}

function Counter({ label, done, goal, color }: { label: string; done: number; goal: number; color: string }): React.ReactElement {
  const met = done >= goal
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-2">{label}</p>
      <p className="font-display text-4xl font-semibold tnum" style={{ color }}>
        {done}
        <span className="text-lg text-ink-3"> / {goal}</span>
      </p>
      <p className="text-xs" style={{ color: met ? 'var(--color-ok)' : 'var(--color-ink-3)' }}>
        {met ? '✓ meta cumplida' : `faltan ${goal - done}`}
      </p>
    </div>
  )
}

function SwimForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [durationMin, setDurationMin] = useState('90')
  const [rpe, setRpe] = useState('6')
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void addWorkout({ type: 'swim', durationMin: Number(durationMin) || 0, rpe: Number(rpe) || undefined })
        onDone()
      }}
    >
      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Duración (min)
        <input type="number" inputMode="numeric" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className={numInput + ' w-20'} required />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm text-ink-2">
        Esfuerzo percibido (RPE 1–10)
        <input type="number" inputMode="numeric" min={1} max={10} value={rpe} onChange={(e) => setRpe(e.target.value)} className={numInput} />
      </label>
      <button type="submit" className={primaryBtn}>Guardar natación</button>
    </form>
  )
}

function StrengthForm({ exercises, onDone }: { exercises: Exercise[]; onDone: () => void }): React.ReactElement {
  const [session, setSession] = useState<Draft[]>([])

  const add = (ex: Exercise): void => {
    if (!ex.safeForScoliosis) {
      const ok = confirm(`⚠️ ${ex.warning ?? 'Ejercicio no recomendado con escoliosis.'}\n\n¿Registrarlo de todos modos?`)
      if (!ok) return
    }
    setSession((s) => [...s, { exercise: ex, sets: [ex.metric === 'time' ? { exerciseId: ex.id, seconds: 30 } : { exerciseId: ex.id, reps: 10 }] }])
  }

  const updateSet = (di: number, si: number, patch: Partial<ExerciseSet>): void => {
    setSession((s) => s.map((d, i) => (i === di ? { ...d, sets: d.sets.map((set, j) => (j === si ? { ...set, ...patch } : set)) } : d)))
  }
  const addSet = (di: number): void => {
    setSession((s) => s.map((d, i) => (i === di ? { ...d, sets: [...d.sets, { ...d.sets[d.sets.length - 1] }] } : d)))
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      {/* Biblioteca */}
      <div>
        <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-2">Biblioteca</p>
        <div className="flex flex-col gap-1.5">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => add(ex)}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm text-ink transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <span>{ex.name}</span>
              {!ex.safeForScoliosis && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase" style={{ color: 'var(--color-warn)', border: '1px solid var(--color-warn)' }}>
                  ⚠ escoliosis
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sesión en curso */}
      {session.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-2">Esta sesión</p>
          {session.map((d, di) => (
            <div key={`${d.exercise.id}-${di}`} className="rounded-lg bg-raised p-3">
              <p className="mb-2 text-sm font-medium text-ink">{d.exercise.name}</p>
              {d.sets.map((set, si) => (
                <div key={si} className="mb-1.5 flex items-center gap-2 text-sm text-ink-2">
                  <span className="text-ink-3">#{si + 1}</span>
                  {d.exercise.metric === 'time' ? (
                    <label className="flex items-center gap-1">
                      <input type="number" value={set.seconds ?? ''} onChange={(e) => updateSet(di, si, { seconds: Number(e.target.value) })} className={numInput} /> s
                    </label>
                  ) : (
                    <>
                      <label className="flex items-center gap-1">
                        <input type="number" value={set.reps ?? ''} onChange={(e) => updateSet(di, si, { reps: Number(e.target.value) })} className={numInput} /> reps
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="number" step="0.5" value={set.weightKg ?? ''} onChange={(e) => updateSet(di, si, { weightKg: Number(e.target.value) })} className={numInput} /> kg
                      </label>
                    </>
                  )}
                </div>
              ))}
              <button onClick={() => addSet(di)} className="text-xs text-accent-soft">+ serie</button>
            </div>
          ))}
        </div>
      )}

      <button
        className={primaryBtn}
        disabled={session.length === 0}
        onClick={() => {
          void addWorkout({ type: 'strength', durationMin: 0, sets: session.flatMap((d) => d.sets) })
          onDone()
        }}
      >
        Guardar sesión
      </button>
    </div>
  )
}
