import type { AppSettings } from '../db/schema'

export const canNotify = (): boolean => 'Notification' in window

export async function requestNotificationPermission(): Promise<boolean> {
  if (!canNotify()) return false
  if (Notification.permission === 'granted') return true
  return (await Notification.requestPermission()) === 'granted'
}

/** ms hasta la próxima ocurrencia local de "HH:mm" (hoy o mañana). */
function msUntil(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const t = new Date()
  t.setHours(h, m, 0, 0)
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1)
  return t.getTime() - now.getTime()
}

const shiftEarlier = (hhmm: string, min: number): string => {
  const [h, m] = hhmm.split(':').map(Number)
  let total = h * 60 + m - min
  if (total < 0) total += 24 * 60
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Programa los recordatorios habilitados mientras la app está abierta.
 *  ponytail: solo en primer plano — la entrega en background necesita push remoto,
 *  que está fuera de alcance (RF-905: "sin push remoto"). Devuelve limpieza. */
export function startReminders(settings: AppSettings): () => void {
  const r = settings.reminders
  if (!r || !canNotify() || Notification.permission !== 'granted') return () => {}

  const timers: number[] = []
  const schedule = (hhmm: string, title: string, body: string): void => {
    const fire = (): void => {
      new Notification(title, { body })
      timers.push(window.setTimeout(fire, 24 * 60 * 60 * 1000)) // repetir al día siguiente
    }
    timers.push(window.setTimeout(fire, msUntil(hhmm)))
  }

  if (r.sleep) schedule('09:00', 'Guatracker', 'Registra tu sueño de anoche 🌙')
  if (r.water) schedule('16:00', 'Guatracker', '¿Vas al día con el agua? 💧')
  if (r.bedtime) schedule(shiftEarlier(settings.goals.bedtimeLimit, 30), 'Guatracker', `Hora de ir cerrando el día. Tu meta es acostarte antes de las ${settings.goals.bedtimeLimit} 🌙`)

  return () => timers.forEach((t) => clearTimeout(t))
}
