import { useState } from 'react'
import { statDef } from '../config/stats'
import { addDays, formatDate } from '../game/dates'
import { difficultyDef, questXp } from '../game/engine'
import { useGame } from '../store/GameContext'
import type { Quest } from '../types'
import { Button } from './Button'
import { TextInput } from './Field'
import { QuestFormSheet } from './QuestFormSheet'
import { Sheet } from './Sheet'

/**
 * Компактная строка задачи для Inbox и Backlog.
 * mode = inbox: быстрый разбор «Сегодня / Завтра / Позже / Без даты».
 * mode = backlog: «→ Сегодня».
 */
export function TaskRow({ quest, mode }: { quest: Quest; mode: 'inbox' | 'backlog' }) {
  const { state, today, planTask } = useGame()
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [date, setDate] = useState(addDays(today, 2))
  const stat = statDef(quest.stat)
  const goal = state.goals.find((g) => g.id === quest.goalId)

  const chip = 'min-h-10 flex-1 rounded-xl border border-line bg-surface px-2 text-[13px] font-medium transition active:scale-95'

  return (
    <li className="glass rounded-3xl p-4">
      <button onClick={() => setEditing(true)} className="block w-full text-left">
        <p className="text-[15px] leading-snug font-semibold">{quest.title}</p>
        <p className="mt-1 text-xs tracking-[0.04em] text-muted">
          {stat.emoji} {stat.label.toUpperCase()} · {difficultyDef(quest.difficulty).label.toLowerCase()} · <span className="font-semibold text-accent">+{questXp(quest)} XP</span>
          {quest.auto && <span className="text-faint"> · авто</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-faint">
          {quest.context && `${quest.context}`}
          {quest.context && goal && ' · '}
          {goal && `→ ${goal.emoji} ${goal.title}`}
          {mode === 'backlog' && quest.dueDate && ` · ${formatDate(quest.dueDate)}`}
        </p>
      </button>

      <div className="mt-3 flex gap-1.5">
        {mode === 'inbox' ? (
          <>
            <button className={`${chip} border-accent/50 text-accent`} onClick={() => planTask(quest.id, today)}>
              Сегодня
            </button>
            <button className={chip} onClick={() => planTask(quest.id, addDays(today, 1))}>
              Завтра
            </button>
            <button className={chip} onClick={() => setPicking(true)}>
              Позже
            </button>
            <button className={chip} onClick={() => planTask(quest.id, null)}>
              Без даты
            </button>
          </>
        ) : (
          <>
            <button className={`${chip} border-accent/50 text-accent`} onClick={() => planTask(quest.id, today)}>
              → Сегодня
            </button>
            <button className={chip} onClick={() => setPicking(true)}>
              Другая дата
            </button>
          </>
        )}
      </div>

      {editing && <QuestFormSheet quest={quest} open onClose={() => setEditing(false)} />}
      {picking && (
        <Sheet open onClose={() => setPicking(false)} title="Когда?" subtitle={quest.title}>
          <div className="space-y-5">
            <TextInput type="date" value={date} min={addDays(today, 1)} onChange={(e) => setDate(e.target.value || date)} />
            <Button
              className="w-full"
              onClick={() => {
                planTask(quest.id, date)
                setPicking(false)
              }}
            >
              Запланировать на {formatDate(date)}
            </Button>
          </div>
        </Sheet>
      )}
    </li>
  )
}
