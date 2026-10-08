import { useState } from 'react'
import { statDef } from '../config/stats'
import { formatDate } from '../game/dates'
import { difficultyDef, questXp } from '../game/engine'
import { isOverdue } from '../game/today'
import { useGame } from '../store/GameContext'
import type { Quest } from '../types'
import { num } from '../utils/format'
import { CompleteQuestSheet } from './CompleteQuestSheet'
import { QuestFormSheet } from './QuestFormSheet'

/**
 * Карточка задачи-квеста. За 3 секунды: что сделать, главное ли это,
 * сколько XP и какая цель продвинется. «Выполнить» → «Что реально сделано?»
 */
export function QuestCard({ quest, compact = false }: { quest: Quest; compact?: boolean }) {
  const { state, today, reopenQuest, swapQuest, setInProgress } = useGame()
  const [completing, setCompleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const stat = statDef(quest.stat)
  const finished = quest.status === 'done' || quest.status === 'partial'
  const skipped = quest.status === 'skipped'
  const inProgress = quest.status === 'in_progress'
  const goal = state.goals.find((g) => g.id === quest.goalId)
  const overdue = isOverdue(quest, today)

  return (
    <article
      className={`glass relative overflow-hidden rounded-3xl transition ${quest.isMain ? 'p-5' : 'p-4'} ${finished ? 'opacity-70' : ''} ${
        inProgress ? 'border-accent/60' : ''
      }`}
    >
      {quest.isMain && (
        <div className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full opacity-40 blur-3xl" style={{ background: 'var(--accent)' }} />
      )}

      <div className="relative flex items-start gap-3">
        <div className={`grid shrink-0 place-items-center rounded-2xl text-lg ${quest.isMain ? 'size-12 bg-accent-soft' : 'size-10 bg-surface-strong'}`}>
          {finished ? '✓' : quest.isMain ? '⚔️' : stat.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            {quest.isMain && <span className="text-accent">Main quest</span>}
            <span>{stat.label}</span>
            <span className="text-faint">· {difficultyDef(quest.difficulty).label}</span>
            {inProgress && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent normal-case tracking-normal">в работе</span>}
            {overdue && <span className="text-faint normal-case tracking-normal">с {formatDate(quest.dueDate!).slice(0, 5)}</span>}
          </div>
          <h3 className={`leading-snug font-semibold ${quest.isMain ? 'text-lg' : 'text-[15px]'} ${finished ? 'line-through decoration-faint' : ''}`}>{quest.title}</h3>
          {goal && !finished && (
            <p className="mt-1 truncate text-[13px] text-muted">
              → {goal.emoji} {goal.title}
            </p>
          )}
          {!compact && quest.description && !finished && <p className="mt-1.5 text-sm leading-relaxed text-muted">{quest.description}</p>}
          {quest.note && <p className="mt-1.5 text-sm text-muted italic">«{quest.note}»</p>}
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5">
        {finished ? (
          <span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent">
            {quest.status === 'partial' ? '½ ' : ''}+{num(quest.xpEarned)} XP
          </span>
        ) : skipped ? (
          <>
            <span className="text-sm text-muted">Не сделано — без штрафа</span>
            <button onClick={() => reopenQuest(quest.id)} className="ml-auto min-h-11 rounded-2xl px-4 text-sm font-semibold text-accent">
              Вернуть
            </button>
          </>
        ) : (
          <>
            <span className="rounded-full bg-surface-strong px-3 py-1.5 text-sm font-semibold">+{questXp(quest)} XP</span>
            {!compact && (
              <>
                <button
                  onClick={() => setInProgress(quest.id, !inProgress)}
                  className={`grid size-11 place-items-center rounded-2xl text-sm ${inProgress ? 'text-accent' : 'text-muted'}`}
                  aria-label={inProgress ? 'Снять отметку «в работе»' : 'Взять в работу'}
                  title={inProgress ? 'Пауза' : 'В работу'}
                >
                  {inProgress ? '❚❚' : '▶'}
                </button>
                {quest.source === 'generated' && quest.status === 'open' && (
                  <button onClick={() => swapQuest(quest.id)} className="grid size-11 place-items-center rounded-2xl text-muted" aria-label="Другой квест" title="Другой квест">
                    ↻
                  </button>
                )}
                <button onClick={() => setEditing(true)} className="grid size-11 place-items-center rounded-2xl text-muted" aria-label="Изменить" title="Изменить">
                  ✎
                </button>
              </>
            )}
            <button
              onClick={() => setCompleting(true)}
              className="ml-auto min-h-11 rounded-2xl bg-accent px-5 text-sm font-semibold text-on-accent transition active:scale-95"
            >
              Выполнить
            </button>
          </>
        )}
      </div>

      {completing && <CompleteQuestSheet quest={quest} open onClose={() => setCompleting(false)} />}
      {editing && <QuestFormSheet quest={quest} open onClose={() => setEditing(false)} />}
    </article>
  )
}
