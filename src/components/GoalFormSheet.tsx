import { useState } from 'react'
import { STATS } from '../config/stats'
import { useGame } from '../store/GameContext'
import type { GoalSource, StatKey } from '../types'
import { Button } from './Button'
import { Choice, Field, TextArea, TextInput } from './Field'
import { Sheet } from './Sheet'

const SOURCES: { value: GoalSource; label: string; hint: string }[] = [
  { value: 'quests', label: 'Квесты', hint: 'Прогресс = выполненные квесты, привязанные к цели' },
  { value: 'income', label: 'Доход', hint: 'Прогресс = реальный доход за текущий месяц' },
  { value: 'manual', label: 'Число', hint: 'Записываешь значение сама: «сдано 3 экзамена»' },
  { value: 'milestones', label: 'Шаги', hint: 'Прогресс = закрытые шаги цели' },
]

/** «10 000» → шаг с порогом 10000; «Купить билеты» → шаг, который отмечается вручную */
function parseMilestones(text: string, numeric: boolean) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((title) => {
      const n = Number(title.replace(/[^\d.,]/g, '').replace(',', '.'))
      return numeric && n > 0 ? { title, targetValue: n } : { title }
    })
}

export function GoalFormSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createGoal } = useGame()
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [outcome, setOutcome] = useState('')
  const [stat, setStat] = useState<StatKey>('freedom')
  const [source, setSource] = useState<GoalSource>('quests')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')
  const [milestones, setMilestones] = useState('')

  const numeric = source !== 'milestones'
  const targetValue = Number(target.replace(/\s/g, ''))
  const parsed = parseMilestones(milestones, numeric)
  const valid = title.trim() && (numeric ? targetValue > 0 : parsed.length > 0)

  return (
    <Sheet open={open} onClose={onClose} title="Новая цель" subtitle="Большая цель → измеримый результат → шаги">
      <div className="space-y-5">
        <div className="flex gap-3">
          <Field label="Иконка">
            <TextInput value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 text-center" maxLength={4} />
          </Field>
          <div className="flex-1">
            <Field label="Цель">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Съездить в путешествие" />
            </Field>
          </div>
        </div>
        <Field label="Желаемый результат">
          <TextArea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} placeholder="Как выглядит успех" />
        </Field>
        <Field label="Характеристика">
          <Choice value={stat} onChange={setStat} options={STATS.map((s) => ({ value: s.key, label: `${s.emoji} ${s.label}` }))} />
        </Field>
        <Field label="Как считать прогресс" hint={SOURCES.find((s) => s.value === source)!.hint}>
          <Choice value={source} onChange={setSource} columns={4} options={SOURCES.map((s) => ({ value: s.value, label: s.label }))} />
        </Field>
        {numeric && (
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Целевое значение">
                <TextInput inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="30" />
              </Field>
            </div>
            <div className="flex-1">
              <Field label="Единица">
                <TextInput value={source === 'income' ? '₽' : unit} disabled={source === 'income'} onChange={(e) => setUnit(e.target.value)} placeholder="постов" />
              </Field>
            </div>
          </div>
        )}
        <Field label="Дедлайн (необязательно)">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field
          label="Milestones — по одному в строке"
          hint={numeric ? 'Строка с числом закроется сама, когда прогресс его достигнет. Без числа — отмечается вручную.' : 'Каждый шаг отмечаешь сама, когда он реально сделан.'}
        >
          <TextArea value={milestones} onChange={(e) => setMilestones(e.target.value)} rows={4} placeholder={numeric ? '10\n20\n30' : 'Выбрать город\nНакопить на билеты\nКупить билеты'} />
        </Field>
        <Button
          className="w-full"
          disabled={!valid}
          onClick={() => {
            createGoal({
              title,
              emoji,
              outcome,
              stat,
              deadline,
              metric: { source, unit: source === 'income' ? '₽' : source === 'milestones' ? 'шагов' : unit.trim() || 'шт', target: numeric ? targetValue : parsed.length },
              milestones: parsed,
            })
            onClose()
          }}
        >
          Создать цель
        </Button>
      </div>
    </Sheet>
  )
}
