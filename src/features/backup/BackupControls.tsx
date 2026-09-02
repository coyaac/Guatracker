import { useRef, useState } from 'react'
import { exportBackup, importBackup, wipeAll } from '../../db/backup'
import { todayISO } from '../../db/repositories'

const btn =
  'min-h-[44px] rounded-xl border border-line px-4 py-2 font-display text-base font-semibold tracking-wide text-ink transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

export function ExportButton(): React.ReactElement {
  const [done, setDone] = useState(false)
  const download = async (): Promise<void> => {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guatracker-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDone(true)
  }
  return (
    <div className="flex flex-col gap-1">
      <button className={btn} onClick={() => void download()}>Exportar mis datos (.json)</button>
      {done && <p role="status" className="text-sm text-ok">Respaldo descargado.</p>}
    </div>
  )
}

/** Importar un respaldo. `onImported` permite avanzar el onboarding tras traer datos. */
export function ImportButton({ onImported }: { onImported?: () => void }): React.ReactElement {
  const fileRef = useRef<HTMLInputElement>(null)
  const [json, setJson] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File): Promise<void> => {
    setError(null)
    try {
      setJson(JSON.parse(await file.text()))
    } catch {
      setError('El archivo no es un JSON válido.')
    }
  }

  const doImport = async (mode: 'replace' | 'merge'): Promise<void> => {
    try {
      await importBackup(json, mode)
      setJson(null)
      onImported?.()
    } catch {
      setError('El respaldo está corrupto o no es de Guatracker. No se tocó ningún dato.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])}
      />
      {!json ? (
        <button className={btn} onClick={() => fileRef.current?.click()}>Importar respaldo (.json)</button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <p className="text-sm text-ink-2">¿Cómo quieres traer los datos?</p>
          <div className="grid grid-cols-2 gap-2">
            <button className={btn} onClick={() => void doImport('merge')}>Fusionar</button>
            <button className={btn} onClick={() => void doImport('replace')}>Reemplazar todo</button>
          </div>
          <button className="text-sm text-ink-3" onClick={() => setJson(null)}>Cancelar</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}

export function WipeButton(): React.ReactElement {
  const [confirming, setConfirming] = useState(false)
  const [word, setWord] = useState('')
  return (
    <div className="flex flex-col gap-2">
      {!confirming ? (
        <button className={`${btn} border-danger text-danger`} onClick={() => setConfirming(true)}>Borrar todos mis datos</button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-danger bg-surface p-3">
          <p className="text-sm text-ink-2">Esto borra todo y no se puede deshacer. Escribe <strong className="text-ink">BORRAR</strong> para confirmar.</p>
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="rounded-lg border border-line bg-raised px-3 py-2 text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <div className="grid grid-cols-2 gap-2">
            <button className="text-sm text-ink-3" onClick={() => { setConfirming(false); setWord('') }}>Cancelar</button>
            <button
              disabled={word !== 'BORRAR'}
              className="min-h-[44px] rounded-xl bg-danger font-display font-semibold text-bg disabled:opacity-40"
              onClick={() => { void wipeAll(); setConfirming(false); setWord('') }}
            >
              Borrar todo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
