import { useState } from 'react'
import { Button } from '../components/Button'
import { Choice } from '../components/Field'
import { HistoryList } from '../components/HistoryList'
import { ImportSheet } from '../components/ImportSheet'
import { QuestCard } from '../components/QuestCard'
import { QuestFormSheet } from '../components/QuestFormSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { TaskRow } from '../components/TaskRow'
import { useGame } from '../store/GameContext'
import { backlogTasks, inboxTasks, todayQuests } from '../store/selectors'
import { num } from '../utils/format'

export type QuestsTab = 'today' | 'inbox' | 'backlog' | 'history'

export function QuestsScreen({ tab, onTab }: { tab: QuestsTab; onTab: (t: QuestsTab) => void }) {
  const { state, today, planTask } = useGame()
  const [adding, setAdding] = useState(false)
  const [importing, setImporting] = useState(false)
  const t = todayQuests(state, today)
  const inbox = inboxTasks(state)
  const backlog = backlogTasks(state, today)

  return (
    <div className="space-y-6">
      <ScreenHeader eyebrow="Реальные действия" title="Quests" />

      <Choice
        value={tab}
        onChange={onTab}
        columns={4}
        small
        options={[
          { value: 'today', label: 'Сегодня' },
          { value: 'inbox', label: inbox.length ? `Inbox · ${inbox.length}` : 'Inbox' },
          { value: 'backlog', label: 'Backlog' },
          { value: 'history', label: 'История' },
        ]}
      />

      {tab === 'today' && (
        <>
          <p className="px-1 text-sm text-muted">
            {t.total === 0
              ? 'На сегодня задач нет. Возьми что-нибудь из Inbox или Backlog — или просто живи этот день.'
              : `${t.completed} из ${t.total} сделано${t.xpAvailable ? ` · ещё доступно +${num(t.xpAvailable)} XP` : ''}`}
          </p>
          {t.mains.length > 0 && (
            <div>
              <SectionTitle>⚔️ Главное</SectionTitle>
              <div className="space-y-3">
                {t.mains.map((q) => (
                  <QuestCard key={q.id} quest={q} />
                ))}
              </div>
            </div>
          )}
          {t.active.length > 0 && (
            <div>
              <SectionTitle aside="▶ в работу · ✎ изменить">🔥 Сегодня</SectionTitle>
              <div className="space-y-3">
                {t.active.map((q) => (
                  <QuestCard key={q.id} quest={q} />
                ))}
              </div>
            </div>
          )}
          {(t.done.length > 0 || t.skipped.length > 0) && (
            <details className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-1 text-sm text-muted">
                <span className="transition group-open:rotate-90">›</span>
                {t.done.length > 0 && <span>✓ Сделано {t.done.length}</span>}
                {t.skipped.length > 0 && <span>· ✕ Не сделано {t.skipped.length}</span>}
              </summary>
              <div className="mt-2 space-y-3">
                {[...t.done, ...t.skipped].map((q) => (
                  <QuestCard key={q.id} quest={q} compact />
                ))}
              </div>
            </details>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="ghost" onClick={() => setAdding(true)}>
              + Задача
            </Button>
            <Button variant="ghost" onClick={() => setImporting(true)}>
              📥 Импорт
            </Button>
          </div>
        </>
      )}

      {tab === 'inbox' && (
        <>
          <Button className="w-full" onClick={() => setImporting(true)}>
            📥 Импорт из заметки
          </Button>
          {inbox.length === 0 ? (
            <p className="px-1 text-sm leading-relaxed text-muted">
              Inbox пуст. Сюда попадают новые задачи из заметок, пока ты не решишь, когда их делать. Категория, сложность, XP и цель уже определены — остаётся выбрать день.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted">Разбери: когда делать?</p>
                <button
                  className="min-h-11 text-sm font-medium text-accent"
                  onClick={() => confirm(`Отправить все ${inbox.length} в Backlog без даты?`) && inbox.forEach((q) => planTask(q.id, null))}
                >
                  Всё в Backlog
                </button>
              </div>
              <ul className="space-y-3">
                {inbox.map((q) => (
                  <TaskRow key={q.id} quest={q} mode="inbox" />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'backlog' && (
        <>
          {backlog.count === 0 && <p className="px-1 text-sm text-muted">Backlog пуст. Здесь живут задачи «на потом» — они не мешают сегодняшнему дню.</p>}
          {(
            [
              ['Завтра', backlog.tomorrow],
              ['Запланировано', backlog.later],
              ['Без даты', backlog.undated],
            ] as const
          ).map(
            ([title, list]) =>
              list.length > 0 && (
                <div key={title}>
                  <SectionTitle aside={list.length}>{title}</SectionTitle>
                  <ul className="space-y-3">
                    {list.map((q) => (
                      <TaskRow key={q.id} quest={q} mode="backlog" />
                    ))}
                  </ul>
                </div>
              ),
          )}
          <Button variant="ghost" className="w-full" onClick={() => setAdding(true)}>
            + Задача
          </Button>
        </>
      )}

      {tab === 'history' && <HistoryList entries={state.history} />}

      {adding && <QuestFormSheet open onClose={() => setAdding(false)} />}
      {importing && <ImportSheet open onClose={() => setImporting(false)} />}
    </div>
  )
}
