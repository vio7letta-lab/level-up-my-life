import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { IncomeSheet } from '../components/IncomeSheet'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { StatBars } from '../components/StatBars'
import { addDays, toISODate } from '../game/dates'
import { goalProgress, isCompleted, monthlyIncome } from '../game/goals'
import { levelInfo, levelTitle } from '../game/levels'
import { displayStreak } from '../game/streak'
import { useGame } from '../store/GameContext'
import { completedQuests, totalIncome, workActions, xpByDay } from '../store/selectors'
import { days, money, num } from '../utils/format'

const WEEKDAY = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function StatsScreen() {
  const { state, today } = useGame()
  const [incomeOpen, setIncomeOpen] = useState(false)

  const info = levelInfo(state.profile.totalXp)
  const done = completedQuests(state)
  const week = xpByDay(state, today, 7)
  const prevWeek = xpByDay(state, addDays(today, -7), 7)
  const weekXp = week.reduce((s, d) => s + d.xp, 0)
  const prevXp = prevWeek.reduce((s, d) => s + d.xp, 0)
  const maxXp = Math.max(1, ...week.map((d) => d.xp))
  const weekStart = week[0].date
  const weekQuests = state.quests.filter((q) => {
    const day = q.completedAt ? toISODate(new Date(q.completedAt)) : ''
    return isCompleted(q) && day >= weekStart && day <= today
  }).length
  const month = monthlyIncome(state, today)
  const incomeGoal = state.goals.find((g) => g.metric.source === 'income')
  const target = incomeGoal?.metric.target ?? 100000

  const tiles = [
    { label: 'Всего XP', value: num(state.profile.totalXp) },
    { label: 'Уровень', value: `${info.level}`, sub: levelTitle(info.level) },
    { label: 'Квестов выполнено', value: num(done.length) },
    { label: 'Серия', value: `🔥 ${displayStreak(state.streak, today)}`, sub: `лучшая: ${days(state.streak.best)}` },
    { label: 'Рабочих действий', value: num(workActions(state).length), sub: 'деньги / карьера' },
    { label: 'Активных дней', value: num(state.streak.totalActiveDays), sub: state.streak.shields ? `🛡 щитов: ${state.streak.shields}` : undefined },
    { label: 'Целей достигнуто', value: `${state.goals.filter((g) => g.completedAt).length} / ${state.goals.length}` },
    { label: 'Боссов побеждено', value: num(state.defeatedBosses.length) },
  ]

  return (
    <div className="space-y-7">
      <ScreenHeader eyebrow="Твой реальный прогресс" title="Stats" />

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 text-[28px] leading-tight font-semibold tracking-tight">{t.value}</p>
            {t.sub && <p className="text-xs text-faint">{t.sub}</p>}
          </Card>
        ))}
      </div>

      <div>
        <SectionTitle>💰 Real Money</SectionTitle>
        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Доход за месяц</p>
              <p className="text-4xl font-semibold tracking-tight">{money(month)}</p>
            </div>
            <p className="text-right text-sm text-muted">
              цель {money(target)}
              <br />
              <span className="font-semibold text-accent">{incomeGoal ? Math.round(goalProgress(state, incomeGoal, today) * 1000) / 10 : 0}%</span>
            </p>
          </div>
          <ProgressBar value={month / target} tint="#d9c79a" className="mt-4 h-3" />
          <p className="mt-3 text-xs text-faint">За всё время: {money(totalIncome(state))}. Реальные деньги считаются отдельно от игрового GOLD.</p>
          <Button className="mt-4 w-full" onClick={() => setIncomeOpen(true)}>
            + Добавить доход
          </Button>
        </Card>
      </div>

      <div>
        <SectionTitle aside={prevXp > 0 ? `${weekXp >= prevXp ? '▲' : '▼'} прошлая неделя: ${num(prevXp)}` : undefined}>XP за 7 дней · {num(weekXp)}</SectionTitle>
        <Card>
          <div className="flex h-36 items-end gap-2">
            {week.map((d) => {
              const isToday = d.date === today
              const [y, m, dd] = d.date.split('-').map(Number)
              return (
                <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[11px] text-muted">{d.xp ? num(d.xp) : ''}</span>
                  <div
                    className="w-full rounded-lg transition-[height] duration-700"
                    style={{
                      height: `${Math.max(4, (d.xp / maxXp) * 100)}%`,
                      background: d.xp ? (isToday ? 'var(--accent)' : 'var(--accent-strong)') : 'var(--track)',
                      opacity: d.xp && !isToday ? 0.7 : 1,
                    }}
                  />
                  <span className={`text-[11px] ${isToday ? 'font-semibold text-accent' : 'text-faint'}`}>{WEEKDAY[new Date(y, m - 1, dd).getDay()]}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-sm text-muted">За неделю выполнено квестов: {weekQuests}</p>
        </Card>
      </div>

      <div>
        <SectionTitle>Прогресс по направлениям</SectionTitle>
        <Card>
          <StatBars />
        </Card>
      </div>

      {incomeOpen && <IncomeSheet open onClose={() => setIncomeOpen(false)} />}
    </div>
  )
}
