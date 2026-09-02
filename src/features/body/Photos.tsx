import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getPhoto, listBodyMetrics, savePhoto, saveBodyMetric, todayISO } from '../../db/repositories'
import type { BodyMetric } from '../../db/schema'

/** Carga un Blob de foto por id y lo muestra con un object URL (revocado al desmontar). */
function PhotoImg({ id, className }: { id: string; className?: string }): React.ReactElement {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let objUrl: string | undefined
    void getPhoto(id).then((p) => {
      if (p) {
        objUrl = URL.createObjectURL(p.blob)
        setUrl(objUrl)
      }
    })
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl)
    }
  }, [id])
  return url ? (
    <img src={url} alt="Foto de progreso" className={className} />
  ) : (
    <div className={`${className ?? ''} bg-raised`} />
  )
}

export function Photos(): React.ReactElement {
  const rows = useLiveQuery(listBodyMetrics)
  const fileRef = useRef<HTMLInputElement>(null)
  const [a, setA] = useState('')
  const [b, setB] = useState('')

  const withPhotos = (rows ?? []).filter((r): r is BodyMetric & { photoBlobId: string } => Boolean(r.photoBlobId))

  const onFile = async (file: File): Promise<void> => {
    const id = await savePhoto(file)
    await saveBodyMetric(todayISO(), { photoBlobId: id })
  }

  const find = (date: string): (BodyMetric & { photoBlobId: string }) | undefined => withPhotos.find((r) => r.date === date)

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink">Fotos de progreso</h2>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-accent-soft transition hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          + Foto de hoy
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])} />
      </div>
      <p className="text-xs text-ink-3">Se guardan solo en este dispositivo. Nunca suben a ningún servidor.</p>

      {withPhotos.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-center text-sm text-ink-3">Aún no hay fotos.</p>
      ) : (
        <>
          {/* Comparador lado a lado (RF-507) */}
          <div className="grid grid-cols-2 gap-2">
            {[{ v: a, set: setA }, { v: b, set: setB }].map((sel, i) => (
              <select
                key={i}
                value={sel.v}
                onChange={(e) => sel.set(e.target.value)}
                className="rounded-lg border border-line bg-raised px-2 py-1.5 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">{i === 0 ? 'Antes…' : 'Después…'}</option>
                {withPhotos.map((r) => (
                  <option key={r.date} value={r.date}>{r.date}{r.weightKg ? ` · ${r.weightKg} kg` : ''}</option>
                ))}
              </select>
            ))}
          </div>
          {(a || b) && (
            <div className="grid grid-cols-2 gap-2">
              {[a, b].map((date, i) => {
                const row = find(date)
                return (
                  <figure key={i} className="flex flex-col gap-1">
                    {row ? <PhotoImg id={row.photoBlobId} className="aspect-[3/4] w-full rounded-lg object-cover" /> : <div className="aspect-[3/4] w-full rounded-lg border border-dashed border-line" />}
                    <figcaption className="text-center text-xs text-ink-3 tnum">{row ? `${row.date}${row.weightKg ? ` · ${row.weightKg} kg` : ''}` : '—'}</figcaption>
                  </figure>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
