import { statDef } from '../config/stats'
import { goalCurrent, goalProgress, goalTarget } from '../game/goals'
import { useGame } from '../store/GameContext'
import type { Goal } from '../types'
import { num } from '../utils/format'
import { ProgressBar } from './ProgressBar'

export function goalValueLabel(current: number, target: number, unit: string) {
  return unit === '₽' ? `${num(current)} ₽ из ${num(target)} ₽` : `${num(current)} из ${num(target)} ${unit}`
}

export function GoalCard({ goal, onOpen }: { goal: Goal; onOpen?: () => void }) {
  const { state, today } = useGame()
  const current = goalCurrent(state, goal, today)
  const target = goalTarget(goal)
  const progress = goalProgress(state, goal, today)
  const nextMilestone = goal.milestones.find((m) => !m.doneAt)

  return (
    <button onClick={onOpen} className="glass block w-full rounded-3xl p-5 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] leading-snug font-semibold">
          {goal.emoji} {goal.title}
        </p>
        <span className="shrink-0 text-lg font-semibold text-accent">{Math.round(progress * 100)}%</span>
      </div>
      <ProgressBar value={progress} tint={statDef(goal.stat).tint} className="mt-4" />
      <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
        <span>{goalValueLabel(current, target, goal.metric.unit)}</span>
        {goal.completedAt ? <span className="text-accent">Достигнута ✨</span> : nextMilestone && <span className="truncate">→ {nextMilestone.title}</span>}
      </div>
    </button>
  )
}
