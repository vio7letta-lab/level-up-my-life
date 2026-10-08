import { useState } from 'react'
import { DIFFICULTIES } from '../config/rewards'
import { STATS } from '../config/stats'
import { addDays } from '../game/dates'
import { useGame } from '../store/GameContext'
import type { Difficulty, Quest, StatKey } from '../types'
import { Button } from './Button'
import { Choice, Field, Select, TextArea, TextInput } from './Field'
import { Sheet } from './Sheet'

type When = 'today' | 'tomorrow' | 'date' | 'none'

interface Props {
  open: boolean
  onClose: () => void
  /** если передан — редактирование/разбор, иначе новая задача */
  quest?: Quest
}

export function QuestFormSheet({ open, onClose, quest }: Props) {
  const { state, today, addQuest, updateQuest, deleteQuest } = useGame()
  const tomorrow = addDays(today, 1)
  const initialWhen: When = !quest ? 'today' : !quest.dueDate ? 'none' : quest.dueDate <= today ? 'today' : quest.dueDate === tomorrow ? 'tomorrow' : 'date'

  const [title, setTitle] = useState(quest?.title ?? '')
  const [description, setDescription] = useState(quest?.description ?? '')
  const [stat, setStat] = useState<StatKey>(quest?.stat ?? 'career')
  const [difficulty, setDifficulty] = useState<Difficulty>(quest?.difficulty ?? 'normal')
  const [goalId, setGoalId] = useState(quest?.goalId ?? '')
  const [isMain, setIsMain] = useState(quest?.isMain ?? false)
  const [when, setWhen] = useState<When>(quest?.inbox ? 'today' : initialWhen)
  const [date, setDate] = useState(quest?.dueDate && quest.dueDate > tomorrow ? quest.dueDate : addDays(today, 2))

  const dueDate = when === 'today' ? (quest?.dueDate && quest.dueDate < today ? quest.dueDate : today) : when === 'tomorrow' ? tomorrow : when === 'date' ? date : null

  const submit = () => {
    const input = { title, description, stat, difficulty, goalId, isMain, dueDate }
    if (quest) updateQuest(quest.id, input)
    else addQuest(input)
    onClose()
  }

  const goals = state.goals.filter((g) => !g.completedAt || g.id === goalId)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={quest?.inbox ? 'Разобрать задачу' : quest ? 'Изменить задачу' : 'Новая задача'}
      subtitle={quest?.context ? `Из заметки: ${quest.context}` : 'Конкретное реальное действие с понятным результатом'}
    >
      <div className="space-y-5">
        {quest?.auto && (
          <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-muted">
            ✨ Категория, сложность и цель определены автоматически — поправь, если не так.
          </p>
        )}
        <Field label="Что сделать">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Отправить 10 предложений брендам" autoFocus={!quest} />
        </Field>
        <Field label="Когда">
          <Choice
            value={when}
            onChange={setWhen}
            columns={4}
            options={[
              { value: 'today', label: 'Сегодня' },
              { value: 'tomorrow', label: 'Завтра' },
              { value: 'date', label: 'Позже' },
              { value: 'none', label: 'Без даты' },
            ]}
          />
        </Field>
        {when === 'date' && <TextInput type="date" value={date} min={addDays(today, 1)} onChange={(e) => setDate(e.target.value || date)} />}
        <Field label="Какая цель?">
          <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Без цели</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Категория">
          <Choice value={stat} onChange={setStat} columns={2} options={STATS.map((s) => ({ value: s.key, label: `${s.emoji} ${s.label}` }))} />
        </Field>
        <Field label="Сложность">
          <Choice value={difficulty} onChange={setDifficulty} columns={2} options={DIFFICULTIES.map((d) => ({ value: d.key, label: `${d.label} · ${d.xp} XP` }))} />
        </Field>
        <Field label="Заметки (необязательно)">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Как понять, что сделано" />
        </Field>
        <label className="flex min-h-12 items-center gap-3 px-1">
          <input type="checkbox" checked={isMain} onChange={(e) => setIsMain(e.target.checked)} className="size-5 accent-[var(--accent)]" />
          <span className="text-[15px]">⚔️ Главный квест дня (×2 XP)</span>
        </label>

        <Button className="w-full" disabled={!title.trim()} onClick={submit}>
          {quest?.inbox ? 'Сохранить и запланировать' : quest ? 'Сохранить' : 'Добавить'}
        </Button>
        {quest && (
          <Button
            variant="quiet"
            className="w-full"
            onClick={() => {
              if (confirm('Убрать эту задачу? Награды за неё не будет.')) {
                deleteQuest(quest.id)
                onClose()
              }
            }}
          >
            Убрать задачу
          </Button>
        )}
      </div>
    </Sheet>
  )
}
