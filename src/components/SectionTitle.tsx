import type { ReactNode } from 'react'

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="eyebrow">{children}</h2>
      {aside && <span className="text-xs text-faint">{aside}</span>}
    </div>
  )
}
