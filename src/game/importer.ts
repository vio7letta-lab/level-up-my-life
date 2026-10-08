/**
 * План импорта: что произойдёт с каждой задачей из источника — ещё ДО изменения игры.
 * Его показывает предпросмотр, и по нему же работает importTasks() в движке,
 * поэтому «что видишь в предпросмотре» = «что произойдёт».
 *
 * Правила синхронизации (заметка — источник задач, RPG — система их выполнения):
 * - задача появилась в заметке → новая задача в RPG;
 * - задача пропала из заметки → в RPG ничего не происходит (никаких автоудалений);
 * - текст задачи поменяли → это та же задача (см. similarity), дубль не создаётся;
 * - активная задача отмечена ✓ → закрывается с полной наградой ровно один раз;
 * - задача уже ✓ при первой встрече → архив без XP.
 */
import type { GameState, Quest } from '../types'
import { normalize, type ParsedTask } from './notesParser'
import { isEditable } from './today'

export type ImportAction =
  /** новая задача → Inbox (или сразу в план, если в тексте есть дата) */
  | 'new'
  /** уже ✓ при первой встрече → архив без XP */
  | 'archive'
  /** была активной в RPG, в заметке стала ✓ → закрыть с наградой (один раз) */
  | 'complete'
  /** текст в заметке изменился — это существующая задача; обновим привязку, дубль не создадим */
  | 'renamed'
  /** уже есть — ничего не меняется */
  | 'duplicate'

export interface ImportPlanItem {
  task: ParsedTask
  action: ImportAction
  /** существующая задача в RPG (для complete / renamed / duplicate) */
  existing?: Quest
  /** для renamed: задача ещё и отмечена ✓ → закрыть с наградой */
  complete?: boolean
  /** для renamed: текст тот же, задачу просто перенесли под другой заголовок заметки */
  moved?: boolean
}

/** Задача из источника с этим fingerprint (основным или прежним) */
export function findBySourceId(quests: Quest[], fingerprint: string): Quest | undefined {
  return quests.find((q) => q.sourceId === fingerprint || q.sourceAliases?.includes(fingerprint))
}

// Служебные слова не делают задачи похожими: «Написать Владе про рекламу» ≠ «Написать Лере про рекламу»
const STOP = new Set(['и', 'в', 'во', 'на', 'с', 'со', 'к', 'по', 'у', 'о', 'об', 'про', 'для', 'до', 'за', 'от', 'а', 'но', 'не', 'же', 'что', 'как'])

const tokens = (text: string) => normalize(text).split(' ').filter((t) => t && !STOP.has(t))

function bigramDice(a: string, b: string): number {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const grams = (s: string) => {
    const m = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1)
    return m
  }
  const ga = grams(a)
  const gb = grams(b)
  let shared = 0
  for (const [g, n] of ga) shared += Math.min(n, gb.get(g) ?? 0)
  return (2 * shared) / (a.length - 1 + b.length - 1)
}

/**
 * Насколько два слова — «одно и то же»: опечатка, окончание.
 * Разные числа — разные задачи («Лаба 1» ≠ «Лаба 2»): лучше лишняя задача, чем потерянная.
 */
function tokenMatch(a: string, b: string): number {
  if (a === b) return 1
  if (/\d/.test(a) || /\d/.test(b)) return 0
  return bigramDice(a, b) >= 0.6 ? 1 : 0
}

/**
 * Похожесть двух формулировок задачи (0..1). Сравниваются значимые слова:
 * порядок слов не важен, опечатки и окончания прощаются, замена «кому» — нет.
 */
export function similarity(a: string, b: string): number {
  const ta = tokens(a)
  const tb = tokens(b)
  if (!ta.length || !tb.length) return 0
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  const used = new Set<number>()
  let matched = 0
  for (const t of short) {
    let best = 0
    let bestIdx = -1
    long.forEach((u, i) => {
      if (used.has(i)) return
      const m = tokenMatch(t, u)
      if (m > best) (best = m), (bestIdx = i)
    })
    if (bestIdx >= 0) used.add(bestIdx)
    matched += best
  }
  // «Лабы ПАХТ» → «Лабы ПАХТ сдать в пятницу»: старая формулировка целиком внутри новой
  // (но не если добавилось число: «Лаба ВМС» → «Лаба ВМС 2» — скорее новая задача)
  const extraHasNumber = long.some((t, i) => !used.has(i) && /\d/.test(t))
  if (short.length >= 2 && matched === short.length && !extraHasNumber) return 0.9
  return matched / long.length
}

/** Порог «это та же задача, просто текст поправили» */
export const RENAME_THRESHOLD = 0.75

export interface PlanOptions {
  /** fingerprints, которые пользователь в предпросмотре пометил «это новая задача» */
  forceNew?: ReadonlySet<string>
}

export function planImport(state: GameState, parsed: ParsedTask[], options: PlanOptions = {}): ImportPlanItem[] {
  const present = new Set(parsed.map((p) => p.fingerprint))
  const claimed = new Set<string>()

  // 1. Точные совпадения по fingerprint (основному или прежнему)
  const items: (ImportPlanItem | null)[] = parsed.map((p) => {
    const existing = findBySourceId(state.quests, p.fingerprint)
    if (!existing) return null
    claimed.add(existing.id)
    if (p.done && isEditable(existing)) return { task: p, action: 'complete', existing }
    return { task: p, action: 'duplicate', existing }
  })

  // 2. Кандидаты на «текст изменили»: АКТИВНЫЕ задачи из этого источника, которых больше нет в заметке.
  //    Выполненные и архивные не кандидаты — иначе повторяющаяся задача («Лаба ВМС» после сданной «Лаба ВМС»)
  //    молча приклеилась бы к старой и потерялась.
  const missing = state.quests.filter(
    (q) => q.source === 'notes' && q.sourceId && isEditable(q) && !present.has(q.sourceId) && !q.sourceAliases?.some((a) => present.has(a)),
  )

  // 2a. Тот же текст под другим заголовком — задачу перенесли в другой раздел заметки.
  //     Совпадение по тексту точное, поэтому подходят и выполненные/архивные задачи.
  const anyMissing = state.quests.filter(
    (q) => q.source === 'notes' && q.sourceId && !present.has(q.sourceId) && !q.sourceAliases?.some((a) => present.has(a)),
  )
  parsed.forEach((p, i) => {
    if (items[i]) return
    const key = normalize(p.title)
    const moved = anyMissing.find((q) => !claimed.has(q.id) && normalize(q.sourceTitle ?? q.title) === key)
    if (!moved) return
    claimed.add(moved.id)
    items[i] = { task: p, action: 'renamed', existing: moved, moved: true, complete: p.done && isEditable(moved) }
  })

  return parsed.map((p, i) => {
    const exact = items[i]
    if (exact) return exact

    let best: Quest | undefined
    let bestScore = 0
    for (const q of options.forceNew?.has(p.fingerprint) ? [] : missing) {
      if (claimed.has(q.id) || normalize(q.context ?? '') !== normalize(p.context ?? '')) continue
      const score = Math.max(similarity(q.sourceTitle ?? q.title, p.title), similarity(q.title, p.title))
      if (score > bestScore) (best = q), (bestScore = score)
    }
    if (best && bestScore >= RENAME_THRESHOLD) {
      claimed.add(best.id)
      return { task: p, action: 'renamed', existing: best, complete: p.done }
    }
    return { task: p, action: p.done ? 'archive' : 'new' }
  })
}

/** Сводка для предпросмотра */
export function countPlan(plan: ImportPlanItem[]) {
  const by = (a: ImportAction) => plan.filter((x) => x.action === a).length
  return {
    found: plan.length,
    new: by('new'),
    existing: by('duplicate') + by('renamed'),
    renamed: by('renamed'),
    complete: by('complete') + plan.filter((x) => x.action === 'renamed' && x.complete).length,
    archive: by('archive'),
  }
}
