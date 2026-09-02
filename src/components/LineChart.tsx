import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { MetricPoint } from '../domain/body'

interface LineChartProps {
  points: MetricPoint[] // puntos diarios (segundo plano)
  line?: MetricPoint[] // media móvil (primer plano), opcional
  color: string // color CSS de la línea principal
  unit?: string
  height?: number
}

/** Gráfico de línea en SVG puro (RF-504/505). Sin librería, sin gridlines pesadas.
 *  Puntos diarios tenues + línea de media móvil al frente. Escala a su ancho. */
export function LineChart({ points, line, color, unit = '', height = 160 }: LineChartProps): React.ReactElement {
  if (points.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-3">Sin datos todavía.</p>
  }

  const W = 320
  const H = height
  const pad = { t: 12, r: 12, b: 20, l: 34 }
  const all = [...points, ...(line ?? [])]
  const values = all.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const first = points[0].date
  const spanDays = Math.max(1, differenceInCalendarDays(parseISO(points[points.length - 1].date), parseISO(first)))

  const x = (d: string): number =>
    pad.l + (differenceInCalendarDays(parseISO(d), parseISO(first)) / spanDays) * (W - pad.l - pad.r)
  const y = (v: number): number => pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b)

  const path = (pts: MetricPoint[]): string =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Gráfico, de ${min}${unit} a ${max}${unit}`} className="overflow-visible">
      {/* ejes discretos: solo min y max en el eje Y */}
      {[max, min].map((v) => (
        <text key={v} x={pad.l - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-ink-3 text-[9px] tnum">
          {v}
        </text>
      ))}
      {/* puntos diarios en segundo plano */}
      {points.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={1.8} className="fill-ink-3 opacity-50" />
      ))}
      {/* media móvil (o la propia serie) al frente */}
      <path d={path(line ?? points)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
