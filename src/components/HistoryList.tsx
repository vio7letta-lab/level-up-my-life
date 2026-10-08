import { statDef } from '../config/stats'
import { formatDate } from '../game/dates'
import type { HistoryEntry } from '../types'

const ICON: Record<HistoryEntry['type'], string> = {
  quest: '✓',
  income: '💰',
  milestone: '🎯',
  boss: '⚔️',
  achievement: '🏆',
  level: '⭐',
}

/** История: дата → действие → результат → XP → характеристика */
export function HistoryList({ entries, limit }: { entries: HistoryEntry[]; limit?: number }) {
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
  if (!sorted.length) return <p className="px-1 text-sm text-muted">Здесь появится всё, что ты реально сделала.</p>

  const groups = new Map<string, HistoryEntry[]>()
  for (const e of sorted) groups.set(e.date, [...(groups.get(e.date) ?? []), e])

  return (
    <div className="space-y-6">
      {[...groups].map(([date, items]) => (
        <section key={date}>
          <h3 className="eyebrow mb-2 px-1">{formatDate(date)}</h3>
          <ul className="glass divide-y divide-line rounded-3xl">
            {items.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-strong text-sm">{ICON[e.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug font-medium">{e.title}</p>
                  {e.result && <p className="mt-0.5 text-sm text-muted">{e.result}</p>}
                </div>
                <div className="shrink-0 text-right text-sm">
                  {e.xp > 0 && <p className="font-semibold text-accent">+{e.xp} XP</p>}
                  {e.stat && e.statXp ? (
                    <p className="text-xs text-muted">
                      {statDef(e.stat).label} +{e.statXp}
                    </p>
                  ) : e.gold > 0 ? (
                    <p className="text-xs text-muted">+{e.gold} gold</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
