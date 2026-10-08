import { displayStreak } from '../game/streak'
import { levelInfo, levelTitle } from '../game/levels'
import { useGame } from '../store/GameContext'
import { days, num } from '../utils/format'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'

export function LevelCard() {
  const { state, today } = useGame()
  const info = levelInfo(state.profile.totalXp)
  const streak = displayStreak(state.streak, today)

  return (
    <Card className="animate-rise">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Level</p>
          <p className="text-6xl leading-none font-semibold tracking-tight">{info.level}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">{levelTitle(info.level)}</p>
          <p className="text-sm text-muted">{num(state.profile.totalXp)} XP всего</p>
        </div>
      </div>
      <ProgressBar value={info.progress} className="mt-5" />
      <p className="mt-2 text-xs text-muted">
        {info.xpInLevel} / {info.xpForLevel} XP · до Level {info.level + 1} осталось {info.xpToNext} XP
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-surface-strong px-3 py-1.5" title="Дней подряд с реальными действиями">
          🔥 {days(streak)}
        </span>
        {state.streak.shields > 0 && (
          <span className="rounded-full bg-surface-strong px-3 py-1.5" title="Щит закрывает один пропущенный день">
            🛡 {state.streak.shields}
          </span>
        )}
        <span className="rounded-full bg-surface-strong px-3 py-1.5">✦ {num(state.profile.gold)} gold</span>
      </div>
    </Card>
  )
}
