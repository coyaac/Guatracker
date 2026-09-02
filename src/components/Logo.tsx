/** Isotipo de Guatracker: cuatro barras de una semana; la cuarta (hoy) en tono
 *  claro del acento. Usa currentColor para las tres primeras (hereda el tema). */
export function LogoMark({ size = 28 }: { size?: number }): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="text-accent">
      <rect x="4" y="16" width="4.6" height="12" rx="2.3" fill="currentColor" />
      <rect x="10.7" y="9" width="4.6" height="19" rx="2.3" fill="currentColor" />
      <rect x="17.4" y="13" width="4.6" height="15" rx="2.3" fill="currentColor" />
      <rect x="24.1" y="20" width="4.6" height="8" rx="2.3" className="fill-accent-soft" />
    </svg>
  )
}

/** Lockup horizontal: isotipo + wordmark "Gua"(acento)"tracker". */
export function Wordmark({ size = 22 }: { size?: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size * 1.4} />
      <span className="font-display font-semibold leading-none tracking-tight" style={{ fontSize: size }}>
        <span className="text-accent">Gua</span>
        <span className="text-ink">tracker</span>
      </span>
    </div>
  )
}
