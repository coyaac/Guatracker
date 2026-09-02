import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSettings } from './db/repositories'
import { Onboarding } from './features/onboarding/Onboarding'
import { Dashboard } from './features/dashboard/Dashboard'
import { Settings } from './features/settings/Settings'

type View = 'dashboard' | 'settings'

export default function App(): React.ReactElement {
  const settings = useLiveQuery(getSettings)
  const [view, setView] = useState<View>('dashboard')

  // useLiveQuery: undefined = cargando; luego la fila 'app' o su ausencia.
  if (settings === undefined) return <p className="p-6 text-ink-3">Cargando…</p>
  if (!settings?.onboarded) return <Onboarding />

  return (
    <div className="min-h-full">
      {view === 'dashboard' ? <Dashboard /> : <Settings />}

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-line bg-surface/95 backdrop-blur">
        {(['dashboard', 'settings'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-current={view === v ? 'page' : undefined}
            className={`min-h-[52px] flex-1 py-3 font-display text-sm font-semibold uppercase tracking-wide transition ${
              view === v ? 'text-accent-soft' : 'text-ink-3'
            }`}
          >
            {v === 'dashboard' ? 'Inicio' : 'Ajustes'}
          </button>
        ))}
      </nav>
    </div>
  )
}
