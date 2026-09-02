interface RingProps {
  value: number // 0–100 (el arco se satura en 100)
  label: string
  color: string // color CSS del progreso (token de dimensión)
  centerText?: string // texto central alternativo (ej. "120%" del agua)
  size?: number
}

/** Anillo de progreso en SVG puro (RF-602). Sin librería: un <circle> con stroke-dasharray. */
export function Ring({ value, label, color, centerText, size = 68 }: RingProps): React.ReactElement {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-ink font-display text-sm font-semibold tnum">
          {centerText ?? Math.round(pct)}
        </text>
      </svg>
      <span className="text-[11px] font-medium text-ink-2">{label}</span>
    </div>
  )
}
