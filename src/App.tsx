import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from './db/repositories'
import { Onboarding } from './features/onboarding/Onboarding'
import { Dashboard } from './features/dashboard/Dashboard'
import { Training } from './features/training/Training'
import { Body } from './features/body/Body'
import { DayView } from './features/day/DayView'
import { Insights } from './features/insights/Insights'
import { Settings } from './features/settings/Settings'

type View = 'dashboard' | 'training' | 'body' | 'day' | 'insights' | 'settings'

const TABS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Inicio' },
  { id: 'training', label: 'Entreno' },
  { id: 'body', label: 'Cuerpo' },
  { id: 'day', label: 'Día' },
  { id: 'insights', label: 'Resumen' },
  { id: 'settings', label: 'Ajustes' },
]

export default function App(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const [view, setView] = useState<View>('dashboard')

  // useLiveQuery: undefined = cargando; luego la fila 'app' o su ausencia.
  if (settings === undefined) return <p className="p-6 text-ink-3">Cargando…</p>
  if (!settings.onboarded) return <Onboarding />

  return (
    <div className="min-h-full">
      {view === 'dashboard' && <Dashboard />}
      {view === 'training' && <Training />}
      {view === 'body' && <Body />}
      {view === 'day' && <DayView />}
      {view === 'insights' && <Insights />}
      {view === 'settings' && <Settings />}

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-line bg-surface/95 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            aria-current={view === t.id ? 'page' : undefined}
            className={`min-h-[52px] flex-1 py-3 font-display text-sm font-semibold uppercase tracking-wide transition ${
              view === t.id ? 'text-accent-soft' : 'text-ink-3'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
