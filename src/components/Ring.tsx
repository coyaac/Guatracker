interface RingProps {
  value: number // 0–100
  label: string
  size?: number
}

/** Anillo de progreso en SVG puro (RF-602). Sin librería: un <circle> con stroke-dasharray. */
export function Ring({ value, label, size = 72 }: RingProps): React.ReactElement {
  const stroke = 7
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-slate-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-sky-500 transition-[stroke-dashoffset] duration-500"
        />
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-current text-sm font-semibold tabular-nums">
          {Math.round(pct)}
        </text>
      </svg>
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}
