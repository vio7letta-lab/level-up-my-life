export const money = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`

/** 1234.5 → «1 234,5»: XP и GOLD могут быть с половинкой после «Сделано частично» */
export const num = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

/** plural(5, ['день', 'дня', 'дней']) → 'дней' */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return forms[2]
  if (b > 1 && b < 5) return forms[1]
  if (b === 1) return forms[0]
  return forms[2]
}

export const days = (n: number) => `${n} ${plural(n, ['день', 'дня', 'дней'])}`
