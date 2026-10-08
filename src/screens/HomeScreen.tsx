import { AchievementGrid } from '../components/AchievementGrid'
import { BossCard } from '../components/BossCard'
import { Card } from '../components/Card'
import { GoalCard } from '../components/GoalCard'
import { LevelCard } from '../components/LevelCard'
import { ProgressBar } from '../components/ProgressBar'
import { QuestCard } from '../components/QuestCard'
import { SectionTitle } from '../components/SectionTitle'
import { StatBars } from '../components/StatBars'
import { goalProgress } from '../game/goals'
import { useGame } from '../store/GameContext'
import { todayQuests } from '../store/selectors'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function HomeScreen({ onOpenGoal }: { onOpenGoal: (id?: string) => void }) {
  const { state, today } = useGame()
  const { mains, others, all, completed } = todayQuests(state, today)
  const date = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const goals = state.goals
    .filter((g) => !g.completedAt)
    .sort((a, b) => goalProgress(state, b, today) - goalProgress(state, a, today))
    .slice(0, 3)

  return (
    <div className="space-y-7">
      <header className="animate-rise">
        <p className="eyebrow mb-1 first-letter:uppercase">{date}</p>
        <h1 className="font-display text-[44px] leading-none font-semibold tracking-tight">
          {greeting()},<br />
          <span className="text-accent italic">{state.profile.name}</span>
        </h1>
      </header>

      <LevelCard />

      <Card className="py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Today’s progress</span>
          <span className="text-muted">
            {completed} / {all.length}
          </span>
        </div>
        <ProgressBar value={all.length ? completed / all.length : 0} className="mt-2.5" />
        {completed === all.length && all.length > 0 && <p className="mt-2 text-sm text-accent">Все квесты дня закрыты. Остальное время — твоё ✨</p>}
      </Card>

      {mains.length > 0 && (
        <div>
          <SectionTitle>⚔️ Main Quest</SectionTitle>
          <div className="space-y-3">
            {mains.map((q) => (
              <QuestCard key={q.id} quest={q} compact />
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle aside="сделай → вернись → зафиксируй">Today’s Quests</SectionTitle>
        <div className="space-y-3">
          {others.map((q) => (
            <QuestCard key={q.id} quest={q} compact />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle aside={<button onClick={() => onOpenGoal()} className="text-accent">все цели →</button>}>Current Goals</SectionTitle>
        <div className="space-y-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onOpen={() => onOpenGoal(g.id)} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Character Stats</SectionTitle>
        <Card>
          <StatBars compact />
        </Card>
      </div>

      <div>
        <SectionTitle>Current Boss</SectionTitle>
        <BossCard />
      </div>

      <div>
        <SectionTitle>Recent Achievements</SectionTitle>
        <Card>
          <AchievementGrid onlyUnlocked limit={3} />
        </Card>
      </div>
    </div>
  )
}
