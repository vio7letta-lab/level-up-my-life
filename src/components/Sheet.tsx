import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Нижняя панель — основной способ ввода на телефоне.
 * Рендерится в <body>: у glass-карточек есть backdrop-filter, внутри них fixed не работает.
 */
export function Sheet({ open, onClose, title, subtitle, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[92dvh] w-full max-w-xl animate-rise overflow-y-auto rounded-t-[32px] border border-line bg-bg pb-safe shadow-2xl">
        <div className="sticky top-0 z-10 bg-bg/95 px-5 pt-3 pb-3 backdrop-blur">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-track" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-[28px] leading-tight font-semibold">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-strong text-muted" aria-label="Закрыть">
              ✕
            </button>
          </div>
        </div>
        <div className="px-5 pt-2 pb-6">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
