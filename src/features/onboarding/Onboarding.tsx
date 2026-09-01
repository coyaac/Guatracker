import { useState } from 'react'
import { completeOnboarding } from '../../db/repositories'
import { DEFAULT_GOALS } from '../../domain/goals'

const MEDICAL_WARNING =
  'Esta app es una herramienta de registro personal, no da consejo médico. Con escoliosis de 32°, valida tu rutina de fuerza con un kinesiólogo o traumatólogo antes de empezar.'

export function Onboarding(): React.ReactElement {
  const [step, setStep] = useState<'choose' | 'form'>('choose')

  if (step === 'choose') {
    return (
      <Screen>
        <h1 className="text-2xl font-bold">Bitácora</h1>
        <p className="text-slate-600 dark:text-slate-400">Tu seguimiento de hábitos, 100% en este dispositivo.</p>
        <div className="mt-4 flex flex-col gap-3">
          <button
            className="min-h-[44px] rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500"
            onClick={() => setStep('form')}
          >
            Empezar de cero
          </button>
          <button
            className="min-h-[44px] cursor-not-allowed rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-400 dark:border-slate-700"
            disabled
            title="Disponible en una próxima versión"
          >
            Importar respaldo · próximamente
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          ¿Cambiaste de celular? Pronto podrás traer tu respaldo `.json` desde aquí.
        </p>
      </Screen>
    )
  }

  return <OnboardingForm />
}

function OnboardingForm(): React.ReactElement {
  const [heightCm, setHeightCm] = useState('180')
  const [initialWeightKg, setInitialWeightKg] = useState('75')

  return (
    <Screen>
      <h1 className="text-xl font-bold">Antes de empezar</h1>

      <div role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
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
        <label className="flex items-center justify-between gap-2">
          Estatura (cm)
          <input type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-800" />
        </label>
        <label className="flex items-center justify-between gap-2">
          Peso inicial (kg)
          <input type="number" inputMode="decimal" step="0.1" value={initialWeightKg} onChange={(e) => setInitialWeightKg(e.target.value)} className="w-24 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right dark:border-slate-700 dark:bg-slate-800" />
        </label>

        <p className="text-sm text-slate-600 dark:text-slate-400">
          Se cargan tus metas por defecto (agua 2 L, ≤1 comida rápida, ≥7 h de sueño…). Las puedes ajustar cuando quieras en Ajustes.
        </p>

        <button type="submit" className="min-h-[44px] rounded-xl bg-sky-600 px-4 py-3 font-medium text-white hover:bg-sky-500">
          Confirmar y empezar
        </button>
      </form>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">{children}</div>
}
