import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addWorkout,
  deleteRoutine,
  exerciseHistory,
  getSettings,
  listExercises,
  listRoutines,
  saveRoutine,
} from '../../db/repositories'
import { weekAggregate } from '../../db/aggregate'
import type { Exercise, ExerciseSet, Routine } from '../../db/schema'
import type { MetricPoint } from '../../domain/body'
import { LineChart } from '../../components/LineChart'

type Draft = { exercise: Exercise; sets: ExerciseSet[] }

const primaryBtn =
  'min-h-[48px] rounded-xl bg-accent px-4 font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-45 motion-reduce:active:scale-100'
const numInput = 'w-16 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

const defaultSet = (ex: Exercise): ExerciseSet =>
  ex.metric === 'time' ? { exerciseId: ex.id, seconds: 30 } : { exerciseId: ex.id, reps: 10 }

export function Training(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const week = useLiveQuery(() => weekAggregate())
  const exercises = useLiveQuery(listExercises)
  const routines = useLiveQuery(listRoutines)
  const [mode, setMode] = useState<'none' | 'swim' | 'strength'>('none')

  if (!settings || !week || !exercises || !routines) return <p className="p-6 text-ink-3">Cargando…</p>
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
      {mode === 'strength' && <StrengthForm exercises={exercises} routines={routines} onDone={() => setMode('none')} />}

      <Progression exercises={exercises} />
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

function StrengthForm({ exercises, routines, onDone }: { exercises: Exercise[]; routines: Routine[]; onDone: () => void }): React.ReactElement {
  const [session, setSession] = useState<Draft[]>([])
  const [naming, setNaming] = useState(false)
  const [tplName, setTplName] = useState('')
  const [pending, setPending] = useState<Exercise | null>(null) // ejercicio no seguro esperando confirmación

  const byId = (id: string): Exercise | undefined => exercises.find((e) => e.id === id)

  const addToSession = (ex: Exercise): void => setSession((s) => [...s, { exercise: ex, sets: [defaultSet(ex)] }])

  const add = (ex: Exercise): void => {
    if (ex.safeForScoliosis) addToSession(ex)
    else setPending(ex) // RF-306: requiere confirmación adicional
  }

  const loadRoutine = (r: Routine): void => {
    const drafts = r.exerciseIds.map(byId).filter((e): e is Exercise => Boolean(e)).map((ex) => ({ exercise: ex, sets: [defaultSet(ex)] }))
    setSession(drafts)
  }

  const updateSet = (di: number, si: number, patch: Partial<ExerciseSet>): void => {
    setSession((s) => s.map((d, i) => (i === di ? { ...d, sets: d.sets.map((set, j) => (j === si ? { ...set, ...patch } : set)) } : d)))
  }
  const addSet = (di: number): void => {
    setSession((s) => s.map((d, i) => (i === di ? { ...d, sets: [...d.sets, { ...d.sets[d.sets.length - 1] }] } : d)))
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4">
      {/* Plantillas guardadas (RF-308) */}
      {routines.length > 0 && (
        <div>
          <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-2">Plantillas</p>
          <div className="flex flex-wrap gap-2">
            {routines.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1 rounded-lg border border-line pl-3">
                <button onClick={() => loadRoutine(r)} className="py-1.5 text-sm text-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                  {r.name}
                </button>
                <button onClick={() => void deleteRoutine(r.id)} aria-label={`Eliminar plantilla ${r.name}`} className="px-2 py-1.5 text-ink-3 hover:text-danger">
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Banner de advertencia para ejercicio no seguro con escoliosis (RF-306) */}
      {pending && (
        <div role="alertdialog" aria-label="Advertencia de escoliosis" className="flex flex-col gap-3 rounded-xl border-l-4 p-4" style={{ borderColor: 'var(--color-warn)', background: 'var(--color-raised)' }}>
          <div>
            <p className="font-display text-base font-semibold" style={{ color: 'var(--color-warn)' }}>⚠ {pending.name} — no recomendado con escoliosis</p>
            <p className="mt-1 text-sm text-ink-2">{pending.warning ?? 'Este ejercicio puede no ser seguro con tu escoliosis. Valídalo con tu kinesiólogo.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPending(null)} className="min-h-[44px] rounded-lg border border-line text-sm font-medium text-ink">Mejor no</button>
            <button
              onClick={() => { addToSession(pending); setPending(null) }}
              className="min-h-[44px] rounded-lg text-sm font-semibold text-bg"
              style={{ background: 'var(--color-warn)' }}
            >
              Registrar igual
            </button>
          </div>
        </div>
      )}

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

          {/* Guardar como plantilla (input inline, sin prompt bloqueante) */}
          {naming ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={tplName}
                onChange={(e) => setTplName(e.target.value)}
                placeholder="Nombre de la plantilla"
                className="flex-1 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              />
              <button
                onClick={() => {
                  if (tplName.trim()) void saveRoutine(tplName.trim(), session.map((d) => d.exercise.id))
                  setNaming(false)
                  setTplName('')
                }}
                className="rounded-lg border border-accent px-3 text-sm text-accent-soft"
              >
                Guardar
              </button>
            </div>
          ) : (
            <button onClick={() => setNaming(true)} className="self-start text-sm text-accent-soft">
              ☆ Guardar sesión como plantilla
            </button>
          )}
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

/** Progresión de carga de un ejercicio (RF-309). */
function Progression({ exercises }: { exercises: Exercise[] }): React.ReactElement {
  const [id, setId] = useState('')
  const history = useLiveQuery(() => (id ? exerciseHistory(id) : Promise.resolve([])), [id])
  const ex = exercises.find((e) => e.id === id)

  // De más antiguo a más nuevo, tomando el valor de la métrica del ejercicio.
  const points: MetricPoint[] = (history ?? [])
    .slice()
    .reverse()
    .map((h) => ({ date: h.date, value: (ex?.metric === 'time' ? h.set.seconds : h.set.weightKg) ?? 0 }))
    .filter((p) => p.value > 0)

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-xl font-semibold text-ink">Progresión de carga</h2>
      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="rounded-lg border border-line bg-raised px-3 py-2 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <option value="">Elige un ejercicio…</option>
        {exercises.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>
      {id && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <LineChart points={points} color="var(--color-dim-training)" unit={ex?.metric === 'time' ? ' s' : ' kg'} />
        </div>
      )}
    </section>
  )
}
