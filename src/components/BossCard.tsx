import { useGame } from '../store/GameContext'
import { Card } from './Card'
import { ProgressBar } from './ProgressBar'

export function BossCard() {
  const { state } = useGame()
  const boss = state.boss
  if (!boss) return null
  const damaged = boss.maxHp - boss.hp

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl">{boss.emoji}</div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Boss #{boss.index + 1}</p>
          <h3 className="font-display text-2xl leading-tight font-semibold">{boss.name}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">{boss.hp}</p>
          <p className="text-xs text-muted">из {boss.maxHp} HP</p>
        </div>
      </div>
      <ProgressBar value={boss.hp / boss.maxHp} tint="linear-gradient(90deg, #8f78d6, #e0a9c4)" className="mt-4" />
      <p className="mt-3 text-sm leading-relaxed text-muted">{boss.description}</p>
      <p className="mt-2 text-xs text-faint">
        {damaged > 0 ? `Уже нанесено ${damaged} урона. ` : ''}Маленький квест −5 HP · обычный −10 · главный −20. Награда: +{boss.reward.xp} XP
      </p>
    </Card>
  )
}
