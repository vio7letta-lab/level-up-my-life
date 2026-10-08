import type { ISODate } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Календарный день в локальном времени устройства: 'YYYY-MM-DD' */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Номер дня от эпохи — для детерминированной ротации квестов */
export function dayNumber(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Сколько дней от a до b (b − a) */
export function daysBetween(a: ISODate, b: ISODate): number {
  return dayNumber(b) - dayNumber(a)
}

export function addDays(date: ISODate, days: number): ISODate {
  const [y, m, d] = date.split('-').map(Number)
  return toISODate(new Date(y, m - 1, d + days))
}

/** 'YYYY-MM' */
export const monthOf = (date: ISODate) => date.slice(0, 7)

export function formatDate(date: ISODate): string {
  const [y, m, d] = date.split('-')
  return `${d}.${m}.${y}`
}
