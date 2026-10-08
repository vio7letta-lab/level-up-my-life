import { useState } from 'react'
import { DIFFICULTIES } from '../config/rewards'
import { STATS } from '../config/stats'
import { useGame } from '../store/GameContext'
import type { Difficulty, Quest, StatKey } from '../types'
import { Button } from './Button'
import { Choice, Field, Select, TextArea, TextInput } from './Field'
import { Sheet } from './Sheet'

interface Props {
  open: boolean
  onClose: () => void
  /** если передан — редактирование, иначе новый квест на сегодня */
  quest?: Quest
}

export function QuestFormSheet({ open, onClose, quest }: Props) {
  const { state, addQuest, updateQuest, deleteQuest } = useGame()
  const [title, setTitle] = useState(quest?.title ?? '')
  const [description, setDescription] = useState(quest?.description ?? '')
  const [stat, setStat] = useState<StatKey>(quest?.stat ?? 'career')
  const [difficulty, setDifficulty] = useState<Difficulty>(quest?.difficulty ?? 'normal')
  const [goalId, setGoalId] = useState(quest?.goalId ?? '')
  const [isMain, setIsMain] = useState(quest?.isMain ?? false)

  const submit = () => {
    const input = { title, description, stat, difficulty, goalId, isMain }
    if (quest) updateQuest(quest.id, input)
    else {
      addQuest(input)
      setTitle('')
      setDescription('')
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={quest ? 'Изменить квест' : 'Новый квест'} subtitle="Конкретное реальное действие с понятным результатом">
      <div className="space-y-5">
        <Field label="Что сделать">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Отправить 3 предложения брендам" autoFocus={!quest} />
        </Field>
        <Field label="Как понять, что сделано (необязательно)">
          <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Критерий результата" />
        </Field>
        <Field label="Характеристика">
          <Choice
            value={stat}
            onChange={setStat}
            columns={2}
            options={STATS.map((s) => ({ value: s.key, label: `${s.emoji} ${s.label}` }))}
          />
        </Field>
        <Field label="Сложность">
          <Choice
            value={difficulty}
            onChange={setDifficulty}
            columns={2}
            options={DIFFICULTIES.map((d) => ({ value: d.key, label: `${d.label} · ${d.xp} XP` }))}
          />
        </Field>
        <Field label="Связь с целью">
          <Select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
            <option value="">Без цели</option>
            {state.goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.emoji} {g.title}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex min-h-12 items-center gap-3 px-1">
          <input type="checkbox" checked={isMain} onChange={(e) => setIsMain(e.target.checked)} className="size-5 accent-[var(--accent)]" />
          <span className="text-[15px]">⚔️ Сделать главным квестом дня (×2 XP)</span>
        </label>

        <Button className="w-full" disabled={!title.trim()} onClick={submit}>
          {quest ? 'Сохранить' : 'Добавить на сегодня'}
        </Button>
        {quest && (
          <Button
            variant="quiet"
            className="w-full"
            onClick={() => {
              if (confirm('Удалить этот квест?')) {
                deleteQuest(quest.id)
                onClose()
              }
            }}
          >
            Удалить квест
          </Button>
        )}
      </div>
    </Sheet>
  )
}
