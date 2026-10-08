import { useState } from 'react'
import { Button } from '../components/Button'
import { Choice } from '../components/Field'
import { HistoryList } from '../components/HistoryList'
import { QuestCard } from '../components/QuestCard'
import { QuestFormSheet } from '../components/QuestFormSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { useGame } from '../store/GameContext'
import { todayQuests } from '../store/selectors'

export function QuestsScreen() {
  const { state, today } = useGame()
  const [tab, setTab] = useState<'today' | 'history'>('today')
  const [adding, setAdding] = useState(false)
  const { main, others, all, completed } = todayQuests(state, today)

  return (
    <div className="space-y-6">
      <ScreenHeader eyebrow="Реальные действия" title="Quests" />

      <Choice
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: `Сегодня · ${completed}/${all.length}` },
          { value: 'history', label: 'История' },
        ]}
      />

      {tab === 'today' ? (
        <>
          <p className="px-1 text-sm leading-relaxed text-muted">
            Закрой приложение, сделай действие в жизни — и вернись зафиксировать результат. Нажимай «Выполнить» только после реального действия.
          </p>
          {main && (
            <div>
              <SectionTitle>⚔️ Main Quest</SectionTitle>
              <QuestCard quest={main} />
            </div>
          )}
          <div>
            <SectionTitle aside="↻ — заменить · ✎ — изменить">Квесты дня</SectionTitle>
            <div className="space-y-3">
              {others.map((q) => (
                <QuestCard key={q.id} quest={q} />
              ))}
            </div>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => setAdding(true)}>
            + Добавить свой квест
          </Button>
          {adding && <QuestFormSheet open onClose={() => setAdding(false)} />}
        </>
      ) : (
        <HistoryList entries={state.history} />
      )}
    </div>
  )
}
