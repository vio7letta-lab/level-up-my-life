import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { SectionTitle } from '../components/SectionTitle'
import { APP } from '../config/app'
import { STATS } from '../config/stats'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function HomeScreen() {
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-7">
      <header className="animate-rise">
        <p className="eyebrow mb-1 first-letter:uppercase">{today}</p>
        <h1 className="font-display text-[44px] leading-none font-semibold tracking-tight">
          {greeting()},<br />
          <span className="text-accent italic">{APP.playerName}</span>
        </h1>
      </header>

      {/* Уровень и XP — данные появятся на Этапе 1 */}
      <Card className="animate-rise">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Level</p>
            <p className="text-6xl leading-none font-semibold tracking-tight">1</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Начало</p>
            <p className="text-sm text-muted">0 XP</p>
          </div>
        </div>
        <ProgressBar value={0} className="mt-5" />
        <div className="mt-4 flex gap-2 text-sm">
          <span className="rounded-full bg-surface-strong px-3 py-1.5">🔥 0 дней</span>
          <span className="rounded-full bg-surface-strong px-3 py-1.5">✦ 0 gold</span>
        </div>
      </Card>

      <div>
        <SectionTitle>⚔️ Main Quest</SectionTitle>
        <Card>
          <EmptyState icon="⚔️" title="Главный квест дня">
            Каждое утро здесь будет одно главное реальное действие — ближайший шаг к твоей самой важной цели.
          </EmptyState>
        </Card>
      </div>

      <div>
        <SectionTitle aside="0 / 0">Today’s Quests</SectionTitle>
        <Card>
          <EmptyState icon="✓" title="Квесты дня">
            5–6 реальных задач по направлениям. Закрываешь — указываешь результат — получаешь XP.
          </EmptyState>
        </Card>
      </div>

      <div>
        <SectionTitle>Current Goals</SectionTitle>
        <Card>
          <EmptyState icon="🎯" title="Большие цели">
            Например, «100 000 ₽ в месяц» — с шагами, процентом и реальными цифрами.
          </EmptyState>
        </Card>
      </div>

      <div>
        <SectionTitle>Character Stats</SectionTitle>
        <Card>
          <ul className="grid grid-cols-2 gap-x-5 gap-y-4">
            {STATS.map((s) => (
              <li key={s.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>
                    {s.emoji} <span className="font-medium">{s.label}</span>
                  </span>
                  <span className="text-faint">0</span>
                </div>
                <ProgressBar value={0} tint={s.tint} className="h-1.5" />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <SectionTitle>Current Boss</SectionTitle>
        <Card>
          <EmptyState icon="🐉" title="Прокрастинация · 100 HP">
            Каждое реальное действие снимает HP. Босс никуда не торопится и никого не ругает.
          </EmptyState>
        </Card>
      </div>

      <div>
        <SectionTitle>Recent Achievements</SectionTitle>
        <Card>
          <EmptyState icon="🏆" title="First Step">
            Первое достижение откроется после первой выполненной задачи.
          </EmptyState>
        </Card>
      </div>
    </div>
  )
}
