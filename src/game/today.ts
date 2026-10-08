import type { ISODate, Quest } from '../types'
import { toISODate } from './dates'

/** Задача ещё в работе (новая или «в работе») */
export const isActive = (q: Quest) => q.status === 'open' || q.status === 'in_progress'

/** Можно менять: пока не выполнена и не в архиве */
export const isEditable = (q?: Quest) => !!q && (isActive(q) || q.status === 'skipped')

/**
 * Запланирована на сегодня. Реальные задачи переносятся, пока не будут сделаны
 * (просроченные остаются в Today), шаблонные квесты живут только свой день.
 */
export function isPlannedFor(q: Quest, today: ISODate): boolean {
  if (q.inbox || !q.dueDate) return false
  return q.source === 'generated' ? q.dueDate === today : q.dueDate <= today
}

export const isOverdue = (q: Quest, today: ISODate) => q.source !== 'generated' && !!q.dueDate && q.dueDate < today && isActive(q)

export const completedOn = (q: Quest, day: ISODate) =>
  (q.status === 'done' || q.status === 'partial') && !!q.completedAt && toISODate(new Date(q.completedAt)) === day

/** Inbox — пришло из импорта и ещё не разобрано */
export const isInbox = (q: Quest) => !!q.inbox && isEditable(q)

/** Backlog — разобрано, но не на сегодня: без даты или на будущее */
export const isBacklog = (q: Quest, today: ISODate) => !q.inbox && isEditable(q) && q.source !== 'generated' && (!q.dueDate || q.dueDate > today)
