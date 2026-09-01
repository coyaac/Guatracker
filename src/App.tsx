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
  if (settings === undefined) return <p className="p-6 text-slate-500">Cargando…</p>
  if (!settings?.onboarded) return <Onboarding />

  return (
    <div className="min-h-full">
      {view === 'dashboard' ? <Dashboard /> : <Settings />}

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        {(['dashboard', 'settings'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-current={view === v ? 'page' : undefined}
            className={`min-h-[44px] flex-1 py-3 text-sm font-medium ${view === v ? 'text-sky-600' : 'text-slate-500'}`}
          >
            {v === 'dashboard' ? 'Inicio' : 'Ajustes'}
          </button>
        ))}
      </nav>
    </div>
  )
}
