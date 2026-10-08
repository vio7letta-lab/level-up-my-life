import { addDays, monthOf } from '../game/dates'
import { isCompleted } from '../game/goals'
import type { GameState, ISODate, Quest } from '../types'

export const questsOn = (s: GameState, date: ISODate) => s.quests.filter((q) => q.date === date)

/** Квесты дня: главный отдельно, остальные — открытые сверху */
export function todayQuests(s: GameState, today: ISODate) {
  const list = questsOn(s, today)
  const order = (q: Quest) => (q.status === 'open' ? 0 : q.status === 'skipped' ? 1 : 2)
  return {
    main: list.find((q) => q.isMain),
    others: list.filter((q) => !q.isMain).sort((a, b) => order(a) - order(b)),
    all: list,
    completed: list.filter(isCompleted).length,
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
