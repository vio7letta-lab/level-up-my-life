interface Props {
  /** 0..1 */
  value: number
  tint?: string
  className?: string
}

export function ProgressBar({ value, tint, className = '' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-track ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: tint ?? 'linear-gradient(90deg, var(--accent-strong), var(--accent))',
        }}
      />
    </div>
  )
}
