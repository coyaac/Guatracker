import { useEffect } from 'react'

/** Panel deslizante desde abajo con fondo oscuro (bottom sheet, diseño §8).
 *  Reemplaza los formularios que antes se encimaban en la pantalla. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }): React.ReactElement {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 pb-8">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
