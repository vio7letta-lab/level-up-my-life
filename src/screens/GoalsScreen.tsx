import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, TextInput } from '../components/Field'
import { GoalCard, goalValueLabel } from '../components/GoalCard'
import { GoalFormSheet } from '../components/GoalFormSheet'
import { IncomeSheet } from '../components/IncomeSheet'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { Sheet } from '../components/Sheet'
import { statDef } from '../config/stats'
import { formatDate } from '../game/dates'
import { goalCurrent, goalProgress, goalTarget, isCompleted, linkedQuests } from '../game/goals'
import { useGame } from '../store/GameContext'
import { incomeThisMonth } from '../store/selectors'
import type { Goal } from '../types'
import { money } from '../utils/format'

interface Props {
  goalId?: string
  onOpen: (id?: string) => void
}

export function GoalsScreen({ goalId, onOpen }: Props) {
  const { state } = useGame()
  const [creating, setCreating] = useState(false)
  const goal = state.goals.find((g) => g.id === goalId)

  if (goal) return <GoalDetail goal={goal} onBack={() => onOpen()} />

  const active = state.goals.filter((g) => !g.completedAt)
  const reached = state.goals.filter((g) => g.completedAt)

  return (
    <div className="space-y-7">
      <ScreenHeader eyebrow="Дерево прогресса" title="Goals" />
      <div className="space-y-3">
        {active.map((g) => (
          <GoalCard key={g.id} goal={g} onOpen={() => onOpen(g.id)} />
        ))}
      </div>
      <Button variant="ghost" className="w-full" onClick={() => setCreating(true)}>
        + Новая цель
      </Button>
      {reached.length > 0 && (
        <div>
          <SectionTitle>Достигнутые</SectionTitle>
          <div className="space-y-3">
            {reached.map((g) => (
              <GoalCard key={g.id} goal={g} onOpen={() => onOpen(g.id)} />
            ))}
          </div>
        </div>
      )}
      {creating && <GoalFormSheet open onClose={() => setCreating(false)} />}
    </div>
  )
}

function GoalDetail({ goal, onBack }: { goal: Goal; onBack: () => void }) {
  const { state, today, deleteGoal, completeMilestone, deleteIncome } = useGame()
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [valueOpen, setValueOpen] = useState(false)
  const current = goalCurrent(state, goal, today)
  const target = goalTarget(goal)
  const progress = goalProgress(state, goal, today)
  const stat = statDef(goal.stat)
  const quests = linkedQuests(state, goal.id)
  const completed = quests.filter(isCompleted).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
  const openToday = quests.filter((q) => q.date === today && q.status === 'open')
  const income = goal.metric.source === 'income' ? incomeThisMonth(state, today) : []

  return (
    <div className="space-y-7">
      <button onClick={onBack} className="-ml-1 flex min-h-11 items-center gap-2 px-1 text-sm font-medium text-muted">
        ← Все цели
      </button>

      <header>
        <p className="eyebrow mb-2">
          {stat.emoji} {stat.label}
          {goal.deadline && ` · до ${formatDate(goal.deadline)}`}
        </p>
        <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight">
          {goal.emoji} {goal.title}
        </h1>
        {goal.outcome && <p className="mt-3 leading-relaxed text-muted">{goal.outcome}</p>}
      </header>

      <Card>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="eyebrow">Target</p>
            <p className="mt-1 font-semibold">{goal.metric.unit === '₽' ? money(target) : target}</p>
          </div>
          <div>
            <p className="eyebrow">Current</p>
            <p className="mt-1 font-semibold">{goal.metric.unit === '₽' ? money(current) : current}</p>
          </div>
          <div>
            <p className="eyebrow">Progress</p>
            <p className="mt-1 font-semibold text-accent">{Math.round(progress * 1000) / 10}%</p>
          </div>
        </div>
        <ProgressBar value={progress} tint={stat.tint} className="mt-5 h-3" />
        <p className="mt-2 text-xs text-muted">
          {goalValueLabel(current, target, goal.metric.unit)}
          {goal.metric.source === 'income' && ' · за текущий месяц'}
          {goal.metric.source === 'quests' && ' · считается по выполненным квестам'}
        </p>

        {goal.metric.source === 'income' && (
          <Button className="mt-5 w-full" onClick={() => setIncomeOpen(true)}>
            + Добавить доход
          </Button>
        )}
        {goal.metric.source === 'manual' && (
          <Button className="mt-5 w-full" onClick={() => setValueOpen(true)}>
            Записать прогресс
          </Button>
        )}
      </Card>

      <div>
        <SectionTitle aside={`${goal.milestones.filter((m) => m.doneAt).length} / ${goal.milestones.length}`}>Milestones</SectionTitle>
        <Card>
          <ol className="relative space-y-4">
            {goal.milestones.map((m, i) => (
              <li key={m.id} className="relative flex items-center gap-4">
                {i < goal.milestones.length - 1 && <span className="absolute top-8 left-[13px] h-[calc(100%-8px)] w-px bg-line" />}
                <span
                  className={`relative grid size-7 shrink-0 place-items-center rounded-full border text-xs ${
                    m.doneAt ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface'
                  }`}
                >
                  {m.doneAt ? '✓' : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${m.doneAt ? '' : 'text-muted'}`}>{m.title}</p>
                  {m.doneAt ? (
                    <p className="text-xs text-faint">достигнуто {formatDate(m.doneAt.slice(0, 10))}</p>
                  ) : (
                    m.targetValue !== undefined && <p className="text-xs text-faint">закроется сам при {goal.metric.unit === '₽' ? money(m.targetValue) : m.targetValue}</p>
                  )}
                </div>
                {!m.doneAt && m.targetValue === undefined && (
                  <button
                    onClick={() => confirm(`Шаг «${m.title}» реально сделан?`) && completeMilestone(goal.id, m.id)}
                    className="min-h-11 shrink-0 rounded-2xl bg-surface-strong px-4 text-sm font-semibold"
                  >
                    Сделано
                  </button>
                )}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {income.length > 0 && (
        <div>
          <SectionTitle>Доход в этом месяце</SectionTitle>
          <Card className="divide-y divide-line py-1">
            {income.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{i.source}</p>
                  <p className="text-xs text-muted">{formatDate(i.date)}</p>
                </div>
                <p className="font-semibold">{money(i.amount)}</p>
                <button
                  onClick={() => confirm('Удалить эту запись дохода?') && deleteIncome(i.id)}
                  className="grid size-10 place-items-center text-faint"
                  aria-label="Удалить запись"
                >
                  ✕
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <SectionTitle aside={`${completed.length} выполнено`}>Связанные квесты</SectionTitle>
        <Card>
          {openToday.length === 0 && completed.length === 0 ? (
            <p className="text-sm text-muted">Пока нет квестов, связанных с этой целью. Добавь свой квест на вкладке Quests и выбери эту цель.</p>
          ) : (
            <ul className="space-y-3">
              {openToday.map((q) => (
                <li key={q.id} className="flex items-center gap-3 text-sm">
                  <span className="text-accent">○</span>
                  <span className="flex-1">{q.title}</span>
                  <span className="text-xs text-faint">сегодня</span>
                </li>
              ))}
              {completed.slice(0, 8).map((q) => (
                <li key={q.id} className="flex items-center gap-3 text-sm">
                  <span className="text-accent">✓</span>
                  <span className="flex-1 text-muted">{q.title}</span>
                  <span className="text-xs text-faint">{formatDate(q.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Button
        variant="quiet"
        className="w-full"
        onClick={() => {
          if (confirm(`Удалить цель «${goal.title}»? История действий сохранится.`)) {
            deleteGoal(goal.id)
            onBack()
          }
        }}
      >
        Удалить цель
      </Button>

      {incomeOpen && <IncomeSheet open onClose={() => setIncomeOpen(false)} />}
      {valueOpen && <GoalValueSheet goal={goal} current={current} onClose={() => setValueOpen(false)} />}
    </div>
  )
}

function GoalValueSheet({ goal, current, onClose }: { goal: Goal; current: number; onClose: () => void }) {
  const { setGoalValue } = useGame()
  const [value, setValue] = useState(String(current))
  const n = Number(value.replace(/\s/g, '').replace(',', '.'))
  return (
    <Sheet open onClose={onClose} title="Записать прогресс" subtitle={goal.title}>
      <div className="space-y-5">
        <Field label={`Сколько реально сейчас (${goal.metric.unit})`}>
          <TextInput inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        </Field>
        <Button
          className="w-full"
          disabled={!(n >= 0)}
          onClick={() => {
            setGoalValue(goal.id, n)
            onClose()
          }}
        >
          Сохранить
        </Button>
      </div>
    </Sheet>
  )
}
