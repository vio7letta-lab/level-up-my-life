import type { ReactNode } from 'react'

export function ScreenHeader({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: ReactNode }) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-none font-semibold tracking-tight">{title}</h1>
      </div>
      {aside}
    </header>
  )
}
