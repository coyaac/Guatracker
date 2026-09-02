import { useState } from 'react'
import { completeOnboarding, saveSettings } from '../../db/repositories'
import { DEFAULT_GOALS } from '../../domain/goals'
import { ImportButton } from '../backup/BackupControls'

const MEDICAL_WARNING =
  'Esta app es una herramienta de registro personal, no da consejo médico. Con escoliosis de 32°, valida tu rutina de fuerza con un kinesiólogo o traumatólogo antes de empezar.'

const primaryBtn =
  'min-h-[52px] rounded-xl bg-accent px-4 py-3 font-display text-lg font-semibold tracking-wide text-bg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:active:scale-100'

function Wordmark({ size = 44 }: { size?: number }): React.ReactElement {
  return (
    <div className="font-display font-semibold leading-none tracking-tight" style={{ fontSize: size }}>
      <span className="text-accent">Gua</span>
      <span className="text-ink">tracker</span>
    </div>
  )
}

export function Onboarding(): React.ReactElement {
  const [step, setStep] = useState<'choose' | 'form'>('choose')

  if (step === 'choose') {
    return (
      <Screen>
        <Wordmark size={52} />
        <p className="text-lg text-ink-2">Tu bitácora de hábitos, 100% en este dispositivo.</p>
        <div className="mt-4 flex flex-col gap-3">
          <button className={primaryBtn} onClick={() => setStep('form')}>
            Empezar de cero
          </button>
          <ImportButton onImported={() => void saveSettings({ onboarded: true })} />
        </div>
        <p className="mt-1 text-sm text-ink-3">
          ¿Cambiaste de celular? Trae tu respaldo .json y recuperas todo.
        </p>
      </Screen>
    )
  }

  return <OnboardingForm />
}

function OnboardingForm(): React.ReactElement {
  const [heightCm, setHeightCm] = useState('180')
  const [initialWeightKg, setInitialWeightKg] = useState('75')

  const input = 'w-24 rounded-lg border border-line bg-raised px-2 py-1.5 text-right text-ink tnum focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'

  return (
    <Screen>
      <h1 className="font-display text-3xl font-semibold text-ink">Antes de empezar</h1>

      <div role="note" className="rounded-xl border-l-4 border-warn bg-surface p-4 text-sm text-ink-2">
        {MEDICAL_WARNING}
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          void completeOnboarding({
            goals: DEFAULT_GOALS,
            heightCm: Number(heightCm) || undefined,
            initialWeightKg: Number(initialWeightKg) || undefined,
          })
        }}
      >
        <label className="flex items-center justify-between gap-2 text-ink-2">
          Estatura (cm)
          <input type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={input} />
        </label>
        <label className="flex items-center justify-between gap-2 text-ink-2">
          Peso inicial (kg)
          <input type="number" inputMode="decimal" step="0.1" value={initialWeightKg} onChange={(e) => setInitialWeightKg(e.target.value)} className={input} />
        </label>

        <p className="text-sm text-ink-3">
          Se cargan tus metas por defecto (agua 2 L, ≤1 comida rápida, ≥7 h de sueño…). Las puedes ajustar cuando quieras en Ajustes.
        </p>

        <button type="submit" className={primaryBtn}>
          Confirmar y empezar
        </button>
      </form>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">{children}</div>
}
