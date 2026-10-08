import type { ReactNode } from 'react'

/** Пустое состояние: честно показывает, что здесь появится, без выдуманных данных. */
export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl">{icon}</div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children && <p className="mt-1 text-sm leading-relaxed text-muted">{children}</p>}
      </div>
    </div>
  )
}
