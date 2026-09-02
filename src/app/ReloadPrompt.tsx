import { useRegisterSW } from 'virtual:pwa-register/react'

/** Aviso de "actualizar" al detectar una versión nueva del service worker (RNF-06).
 *  Registra el SW (immediate) y, cuando hay update, ofrece recargar. */
export function ReloadPrompt(): React.ReactElement | null {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true })

  if (!needRefresh) return null

  return (
    <div role="alert" className="fixed inset-x-0 bottom-16 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-line bg-raised p-3 shadow-lg">
      <span className="flex-1 text-sm text-ink">Hay una versión nueva de Guatracker.</span>
      <button onClick={() => setNeedRefresh(false)} className="text-sm text-ink-3">Ahora no</button>
      <button
        onClick={() => void updateServiceWorker(true)}
        className="min-h-[40px] rounded-lg bg-accent px-3 font-display text-sm font-semibold text-bg"
      >
        Actualizar
      </button>
    </div>
  )
}
