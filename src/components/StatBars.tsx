import { STATS } from '../config/stats'
import { statLevelInfo } from '../game/levels'
import { useGame } from '../store/GameContext'
import { ProgressBar } from './ProgressBar'

/** Характеристики: compact — сетка 2×N для Home, иначе — подробный список */
export function StatBars({ compact = false }: { compact?: boolean }) {
  const { state } = useGame()

  if (compact) {
    return (
      <ul className="grid grid-cols-2 gap-x-5 gap-y-4">
        {STATS.map((s) => {
          const info = statLevelInfo(state.profile.statXp[s.key])
          return (
            <li key={s.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span>
                  {s.emoji} <span className="font-medium">{s.label}</span>
                </span>
                <span className="text-faint">Lv {info.level}</span>
              </div>
              <ProgressBar value={info.progress} tint={s.tint} className="h-1.5" />
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <ul className="space-y-5">
      {STATS.map((s) => {
        const xp = state.profile.statXp[s.key]
        const info = statLevelInfo(xp)
        return (
          <li key={s.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[15px]">
                {s.emoji} <span className="font-medium">{s.label}</span>
              </span>
              <span className="text-sm text-muted">
                Lv {info.level} <span className="text-faint">· {xp} XP</span>
              </span>
            </div>
            <ProgressBar value={info.progress} tint={s.tint} />
            <p className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
              <span>{s.description}</span>
              <span className="shrink-0 text-faint">
                {info.xpInLevel}/{info.xpForLevel}
              </span>
            </p>
          </li>
        )
      })}
    </ul>
  )
}
