import { useImportLauncher } from '../app/importLauncher'
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
import { homeQuests, inboxTasks, todayQuests } from '../store/selectors'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function HomeScreen({ onOpenGoal, onOpenQuests }: { onOpenGoal: (id?: string) => void; onOpenQuests: (tab?: 'inbox') => void }) {
  const { state, today } = useGame()
  const t = todayQuests(state, today)
  const { mains, picked, hidden } = homeQuests(state, today)
  const inbox = inboxTasks(state).length
  const { quickImport } = useImportLauncher()
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
            {t.completed} / {t.total}
          </span>
        </div>
        <ProgressBar value={t.total ? t.completed / t.total : 0} className="mt-2.5" />
        {t.completed === t.total && t.total > 0 && <p className="mt-2 text-sm text-accent">Все задачи дня закрыты. Остальное время — твоё ✨</p>}
      </Card>

      <div className="glass flex items-center gap-3 rounded-3xl p-3 pl-4">
        <button onClick={() => onOpenQuests('inbox')} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 text-left">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-lg">📥</span>
          <span className="min-w-0">
            <span className="block font-semibold">{inbox > 0 ? `Inbox · ${inbox}` : 'Inbox пуст'}</span>
            <span className="block truncate text-xs text-muted">{inbox > 0 ? 'Разобрать: сегодня, завтра, позже' : 'Обновила заметку? Импортируй'}</span>
          </span>
        </button>
        <button onClick={quickImport} className="min-h-11 shrink-0 rounded-2xl bg-accent px-4 text-sm font-semibold text-on-accent transition active:scale-95">
          ⚡ Импорт
        </button>
      </div>

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
          {picked.map((q) => (
            <QuestCard key={q.id} quest={q} compact />
          ))}
          {picked.length === 0 && mains.length === 0 && (
            <Card>
              <p className="text-sm text-muted">На сегодня всё. Новые задачи можно взять из Inbox или Backlog.</p>
            </Card>
          )}
        </div>
        {hidden > 0 && (
          <button onClick={() => onOpenQuests()} className="mt-3 min-h-11 w-full text-center text-sm font-medium text-accent">
            ещё {hidden} на сегодня →
          </button>
        )}
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
