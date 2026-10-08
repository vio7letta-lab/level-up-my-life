import type { ISODate } from '../types'
import { addDays, toISODate } from './dates'

/** Задача, распознанная во внешнем тексте (заметка Apple Notes и т.п.) */
export interface ParsedTask {
  title: string
  /** заголовок, под которым стояла задача: «Учёба», «Работа»… */
  context?: string
  done: boolean
  dueDate?: ISODate
  /** стабильный id: одинаковый для одной и той же задачи при повторном импорте */
  fingerprint: string
}

// «- [ ]» / «- [x]» — задачи в формате Markdown (Obsidian, GitHub, многие таск-менеджеры)
const OPEN_MARKER = /^(?:[-*•]\s*)?\[\s?\]\s*|^[○◦◯⚪□☐▢⬜•·▪▫\-–—*]\s*/
const DONE_MARKER = /^(?:[-*•]\s*)?\[[xXхХ✓]\]\s*|^[✓✔☑✅☒✗]\s*/

/** Нормализация для fingerprint: регистр, ё/е, пунктуация и лишние пробелы не важны */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** FNV-1a — короткий стабильный хеш строки (две разные «соли» → 64 бита, коллизии практически исключены) */
function fnv1a(text: string, seed: number): string {
  let h = seed >>> 0
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}

export function fingerprint(title: string, context?: string): string {
  const key = `${normalize(context ?? '')}|${normalize(title)}`
  return `n_${fnv1a(key, 0x811c9dc5)}${fnv1a(key, 0x2f1a3c5d)}`
}

const MONTHS = ['январ', 'феврал', 'март', 'апрел', 'ма[йя]', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр']
const MONTH_RE = new RegExp(`(?:до\\s+)?(\\d{1,2})\\s+(${MONTHS.join('|')})[а-я]*`, 'i')
const NUMERIC_RE = /(?:до\s+)?(?<![\d.])(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?![\d.])/
const RELATIVE_RE = /(?<![а-яё])(?:до\s+)?(сегодня|завтра|послезавтра)(?![а-яё])/i

function makeDate(day: number, month: number, year: number | undefined, today: Date): ISODate | undefined {
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined
  let y = year ?? today.getFullYear()
  if (y < 100) y += 2000
  const d = new Date(y, month - 1, day)
  if (d.getMonth() !== month - 1) return undefined // 31.02 и т.п.
  // «15.01» в октябре без года — скорее всего, следующий январь
  if (year === undefined && d.getTime() < today.getTime() - 120 * 86_400_000) d.setFullYear(y + 1)
  return toISODate(d)
}

/** Ищет дату в строке и возвращает её вместе с текстом без даты */
export function extractDate(text: string, today: Date): { title: string; dueDate?: ISODate } {
  const cut = (m: RegExpMatchArray) => (text.slice(0, m.index) + text.slice(m.index! + m[0].length)).replace(/\s{2,}/g, ' ').replace(/^[\s,—–-]+|[\s,—–:-]+$/g, '')

  const rel = text.match(RELATIVE_RE)
  if (rel) {
    const shift = { сегодня: 0, завтра: 1, послезавтра: 2 }[rel[1].toLowerCase() as 'сегодня']
    return { title: cut(rel), dueDate: addDays(toISODate(today), shift) }
  }
  const named = text.match(MONTH_RE)
  if (named) {
    const month = MONTHS.findIndex((m) => new RegExp(`^${m}`, 'i').test(named[2])) + 1
    const date = makeDate(Number(named[1]), month, undefined, today)
    if (date) return { title: cut(named), dueDate: date }
  }
  const num = text.match(NUMERIC_RE)
  if (num) {
    const date = makeDate(Number(num[1]), Number(num[2]), num[3] ? Number(num[3]) : undefined, today)
    if (date) return { title: cut(num), dueDate: date }
  }
  return { title: text }
}

/**
 * Разбор текста заметки:
 * - строки с ○ □ ☐ ◦ • - [ ] — открытые задачи; с ✓ ✔ ☑ [x] — выполненные;
 * - строка без маркера, под которой идут задачи с маркерами, — заголовок-контекст;
 * - строка, заканчивающаяся на «:», — заголовок;
 * - остальные строки без маркера — обычные задачи;
 * - пустые строки и «...» пропускаются; повторы внутри текста схлопываются.
 */
export function parseNotes(text: string, today: Date): ParsedTask[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, ' ').trim())
    .map((l) => (/^[.…\s]*$/.test(l) ? '' : l))

  const marked = (l: string) => OPEN_MARKER.test(l) || DONE_MARKER.test(l)
  const nextNonEmpty = (i: number) => lines.slice(i + 1).find((l) => l !== '')

  const out: ParsedTask[] = []
  const seen = new Set<string>()
  let context: string | undefined

  lines.forEach((line, i) => {
    if (!line) return
    let done = false
    let body = line

    if (DONE_MARKER.test(line)) {
      done = true
      body = line.replace(DONE_MARKER, '')
    } else if (OPEN_MARKER.test(line)) {
      body = line.replace(OPEN_MARKER, '')
    } else {
      const next = nextNonEmpty(i)
      const isHeading = line.endsWith(':') || (next !== undefined && marked(next) && line.length <= 60)
      if (isHeading) {
        context = line.replace(/:$/, '').trim() || undefined
        return
      }
    }

    const { title, dueDate } = extractDate(body.trim(), today)
    if (!title) return
    const fp = fingerprint(title, context)
    if (seen.has(fp)) return
    seen.add(fp)
    out.push({ title, context, done, dueDate, fingerprint: fp })
  })

  return out
}
