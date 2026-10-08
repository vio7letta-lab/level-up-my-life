import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// text-base (16px) — иначе iPhone приближает страницу при фокусе на поле
const control =
  'w-full rounded-2xl border border-line bg-surface px-4 text-base text-text placeholder:text-faint outline-none transition focus:border-accent'

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-sm font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block px-1 text-xs text-faint">{hint}</span>}
    </label>
  )
}

export const TextInput = ({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`${control} h-12 ${className}`} {...p} />
)

export const TextArea = ({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`${control} min-h-24 py-3 leading-relaxed ${className}`} {...p} />
)

export const Select = ({ className = '', ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`${control} h-12 appearance-none ${className}`} {...p} />
)

interface ChoiceProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  columns?: number
}

/** Крупные кнопки выбора вместо мелких радиокнопок */
export function Choice<T extends string>({ value, onChange, options, columns = 2 }: ChoiceProps<T>) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-12 rounded-2xl border px-3 py-2 text-sm font-medium transition ${
            value === o.value ? 'border-accent bg-accent-soft text-text' : 'border-line bg-surface text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
