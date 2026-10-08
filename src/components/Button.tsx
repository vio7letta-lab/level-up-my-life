import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:brightness-105 active:brightness-95',
  ghost: 'glass text-text hover:bg-surface-strong',
}

/** Кнопка под палец: минимум 48px высотой. */
export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-12 rounded-2xl px-6 text-[15px] font-semibold transition active:scale-[0.98] ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
