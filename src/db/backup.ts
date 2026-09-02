import { z } from 'zod'
import { db, USER_TABLES } from './schema'

// ── Esquemas de validación (RNF-23): toda entrada importada se valida antes de escribir. ──

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha YYYY-MM-DD inválida')

const foodSchema = z.object({
  id: z.string(),
  date: isoDate,
  time: z.string().optional(),
  category: z.enum(['meal', 'snack']),
  meal: z.enum(['desayuno', 'almuerzo', 'once', 'cena']).optional(),
  quality: z.enum(['fast', 'real']).optional(),
  snackKind: z.enum(['dulce', 'salado', 'sugary']).optional(),
  name: z.string().optional(),
  quantity: z.number().optional(),
  createdAt: z.number(),
})
const daySchema = z.object({ date: isoDate, waterMl: z.number(), realMealsLogged: z.boolean(), zeroDrinks: z.number(), note: z.string().optional() })
const sleepSchema = z.object({ date: isoDate, bedtime: z.string(), wakeTime: z.string(), hours: z.number(), quality: z.enum(['bad', 'ok', 'good']) })
const bodySchema = z.object({ date: isoDate }).catchall(z.unknown()) // medidas opcionales varias
const photoFileSchema = z.object({ id: z.string(), dataUrl: z.string().startsWith('data:') })

// Tablas cuyo contenido no es crítico validar campo a campo: se aceptan como registros.
const looseArray = z.array(z.record(z.string(), z.unknown()))

const BackupSchema = z.object({
  app: z.literal('guatracker'),
  schema: z.number(),
  exportedAt: z.number(),
  data: z.object({
    food: z.array(foodSchema).optional(),
    days: z.array(daySchema).optional(),
    sleep: z.array(sleepSchema).optional(),
    body: z.array(bodySchema).optional(),
    workouts: looseArray.optional(),
    exercises: looseArray.optional(),
    routines: looseArray.optional(),
    summaries: looseArray.optional(),
    settings: looseArray.optional(),
    photos: z.array(photoFileSchema).optional(),
  }),
})

export type Backup = z.infer<typeof BackupSchema>

/** Valida (sin tocar la BD). Lanza ZodError si el JSON está corrupto o es ajeno. */
export const parseBackup = (json: unknown): Backup => BackupSchema.parse(json)

// ── Conversión de fotos ──

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ── Exportar (RF-902) ──

export async function exportBackup(): Promise<Blob> {
  const data: Record<string, unknown> = {}
  for (const t of USER_TABLES) {
    if (t === 'photos') continue
    data[t] = await db.table(t).toArray()
  }
  const photos = await db.photos.toArray()
  data.photos = await Promise.all(photos.map(async (p) => ({ id: p.id, dataUrl: await blobToDataUrl(p.blob) })))

  const doc = { app: 'guatracker', schema: 5, exportedAt: Date.now(), data }
  return new Blob([JSON.stringify(doc)], { type: 'application/json' })
}

// ── Importar (RF-903): reemplazar todo o fusionar por clave. ──

export async function importBackup(json: unknown, mode: 'replace' | 'merge'): Promise<void> {
  const { data } = parseBackup(json) // lanza si es inválido, antes de tocar nada

  await db.transaction('rw', db.tables, async () => {
    if (mode === 'replace') {
      for (const t of USER_TABLES) await db.table(t).clear()
    }
    for (const t of USER_TABLES) {
      if (t === 'photos') continue
      const rows = (data as Record<string, unknown[]>)[t]
      if (rows?.length) await db.table(t).bulkPut(rows)
    }
    if (data.photos?.length) {
      const photos = data.photos.map((p) => ({ id: p.id, blob: dataUrlToBlob(p.dataUrl) }))
      await db.photos.bulkPut(photos)
    }
  })
}

// ── Borrar todo (RF-904) ──

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const t of USER_TABLES) await db.table(t).clear()
  })
}
