import type { Goal, GameState, ISODate, Quest } from '../types'
import { monthOf } from './dates'

export const isCompleted = (q: Quest) => q.status === 'done' || q.status === 'partial'

export function monthlyIncome(state: GameState, today: ISODate): number {
  const month = monthOf(today)
  return state.income.filter((i) => monthOf(i.date) === month).reduce((sum, i) => sum + i.amount, 0)
}

export const linkedQuests = (state: GameState, goalId: string) => state.quests.filter((q) => q.goalId === goalId)

/** Текущее значение цели — всегда из реальных данных */
export function goalCurrent(state: GameState, goal: Goal, today: ISODate): number {
  switch (goal.metric.source) {
    case 'income':
      return monthlyIncome(state, today)
    case 'quests':
      return linkedQuests(state, goal.id).filter(isCompleted).length
    case 'manual':
      return goal.metric.manualValue ?? 0
    case 'milestones':
      return goal.milestones.filter((m) => m.doneAt).length
  }
}

export function goalTarget(goal: Goal): number {
  return goal.metric.source === 'milestones' ? Math.max(1, goal.milestones.length) : goal.metric.target
}

/** 0..1 */
export function goalProgress(state: GameState, goal: Goal, today: ISODate): number {
  const target = goalTarget(goal)
  return target > 0 ? Math.min(1, goalCurrent(state, goal, today) / target) : 0
}
