import { useState } from 'react'
import { Summary } from '../summary/Summary'
import { Month } from '../month/Month'

/** Contenedor de análisis: resumen semanal y vista mensual bajo un toggle,
 *  para no saturar la barra de navegación. */
export function Insights(): React.ReactElement {
  const [tab, setTab] = useState<'week' | 'month'>('week')

  return (
    <div>
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-line">
          {(['week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-current={tab === t ? 'page' : undefined}
              className={`py-2 font-display text-sm font-semibold uppercase tracking-wide transition ${
                tab === t ? 'bg-raised text-accent-soft' : 'text-ink-3'
              }`}
            >
              {t === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>
      {tab === 'week' ? <Summary /> : <Month />}
    </div>
  )
}
