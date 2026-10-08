import { ACHIEVEMENTS } from '../config/achievements'
import { formatDate, toISODate } from '../game/dates'
import { useGame } from '../store/GameContext'

/** onlyUnlocked — последние полученные (для Home); иначе все, закрытые — приглушены */
export function AchievementGrid({ onlyUnlocked = false, limit }: { onlyUnlocked?: boolean; limit?: number }) {
  const { state } = useGame()
  const unlocked = new Map(state.achievements.map((a) => [a.id, a.unlockedAt]))
  let list = ACHIEVEMENTS.map((a) => ({ ...a, at: unlocked.get(a.id) }))
  if (onlyUnlocked) list = list.filter((a) => a.at).sort((a, b) => b.at!.localeCompare(a.at!))
  list = list.slice(0, limit)

  if (!list.length) return <p className="text-sm text-muted">Первое достижение — First Step — откроется после первого выполненного квеста.</p>

  return (
    <ul className="space-y-3">
      {list.map((a) => (
        <li key={a.id} className={`flex items-center gap-4 ${a.at ? '' : 'opacity-45'}`}>
          <span className={`grid size-11 shrink-0 place-items-center rounded-2xl text-xl ${a.at ? 'bg-accent-soft' : 'bg-surface-strong grayscale'}`}>
            {a.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{a.title}</span>
            <span className="block text-sm text-muted">{a.description}</span>
          </span>
          {a.at && <span className="shrink-0 text-xs text-faint">{formatDate(toISODate(new Date(a.at)))}</span>}
        </li>
      ))}
    </ul>
  )
}
