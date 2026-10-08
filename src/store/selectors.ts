import { addDays, monthOf } from '../game/dates'
import { MIN_REAL_TASKS } from '../game/daily'
import { questXp } from '../game/engine'
import { isCompleted } from '../game/goals'
import { completedOn, isActive, isBacklog, isInbox, isOverdue, isPlannedFor } from '../game/today'
import type { GameState, ISODate, Quest } from '../types'

/** Приоритет задачи в Today: главное → в работе → просрочено → связано с целью → «тяжелее» */
export function priority(q: Quest, today: ISODate): number {
  return (
    (q.isMain ? 1000 : 0) +
    (q.status === 'in_progress' ? 500 : 0) +
    (isOverdue(q, today) ? 200 : 0) +
    (q.goalId ? 100 : 0) +
    (q.source !== 'generated' ? 50 : 0) +
    questXp(q)
  )
}

/**
 * Today: что реально нужно сделать сегодня.
 * mains — главные, active — остальные по приоритету, done / skipped — уже отмеченные сегодня.
 */
export function todayQuests(s: GameState, today: ISODate) {
  // Шаблонные квесты — только добор. Как только реальных задач на сегодня набралось
  // MIN_REAL_TASKS (включая уже сделанные), нетронутые шаблонные (кроме главного) скрываются.
  const real = s.quests.filter((q) => q.source !== 'generated' && ((isActive(q) && isPlannedFor(q, today)) || completedOn(q, today))).length
  const hideTemplates = real >= MIN_REAL_TASKS
  const planned = s.quests.filter((q) => isPlannedFor(q, today) && !(hideTemplates && q.source === 'generated' && q.status === 'open' && !q.isMain))
  const byPriority = (a: Quest, b: Quest) => priority(b, today) - priority(a, today)
  const active = planned.filter(isActive).sort(byPriority)
  const done = s.quests.filter((q) => completedOn(q, today))
  const skipped = planned.filter((q) => q.status === 'skipped')
  return {
    mains: active.filter((q) => q.isMain),
    active: active.filter((q) => !q.isMain),
    done,
    skipped,
    total: active.length + done.length + skipped.length,
    completed: done.length,
    /** сколько XP ещё можно получить сегодня */
    xpAvailable: active.reduce((sum, q) => sum + questXp(q), 0),
  }
}

/**
 * Короткий список для Home: главный квест + до 4 задач, по одной из разных направлений,
 * чтобы главный экран не превращался в список из 30 пунктов.
 */
export function homeQuests(s: GameState, today: ISODate, limit = 4) {
  const { mains, active } = todayQuests(s, today)
  const picked: Quest[] = []
  const usedStats = new Set<string>()
  for (const q of active) if (picked.length < limit && !usedStats.has(q.stat)) (picked.push(q), usedStats.add(q.stat))
  for (const q of active) if (picked.length < limit && !picked.includes(q)) picked.push(q)
  picked.sort((a, b) => priority(b, today) - priority(a, today))
  return { mains, picked, hidden: active.length - picked.length }
}

export const inboxTasks = (s: GameState) => s.quests.filter(isInbox).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

/** Backlog по группам: завтра, запланировано на даты, без даты */
export function backlogTasks(s: GameState, today: ISODate) {
  const list = s.quests.filter((q) => isBacklog(q, today))
  const tomorrow = addDays(today, 1)
  return {
    tomorrow: list.filter((q) => q.dueDate === tomorrow),
    later: list.filter((q) => q.dueDate && q.dueDate > tomorrow).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!)),
    undated: list.filter((q) => !q.dueDate),
    count: list.length,
  }
}

export const completedQuests = (s: GameState) => s.quests.filter(isCompleted)

/** «Рабочие действия» — выполненные квесты направления «Деньги / работа» */
export const workActions = (s: GameState) => completedQuests(s).filter((q) => q.area === 'work' || q.stat === 'career' || q.stat === 'finance')

/** XP по дням за последние n дней (включая сегодня) */
export function xpByDay(s: GameState, today: ISODate, days = 7): { date: ISODate; xp: number }[] {
  const out = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i - days + 1), xp: 0 }))
  const idx = new Map(out.map((d, i) => [d.date, i]))
  for (const h of s.history) {
    const i = idx.get(h.date)
    if (i !== undefined) out[i].xp += h.xp
  }
  return out
}

export const totalIncome = (s: GameState) => s.income.reduce((sum, i) => sum + i.amount, 0)

export const incomeThisMonth = (s: GameState, today: ISODate) =>
  s.income.filter((i) => monthOf(i.date) === monthOf(today)).sort((a, b) => b.date.localeCompare(a.date))
