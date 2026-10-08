import { useState } from 'react'
import { useGame } from '../store/GameContext'
import { Button } from './Button'
import { Field, TextInput } from './Field'
import { Sheet } from './Sheet'

/** Запись реального дохода — от неё автоматически считаются цель и статистика */
export function IncomeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { today, addIncome } = useGame()
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(today)
  const value = Number(amount.replace(/\s/g, '').replace(',', '.'))

  return (
    <Sheet open={open} onClose={onClose} title="Добавить доход" subtitle="Только реальные деньги, которые пришли тебе за работу">
      <div className="space-y-5">
        <Field label="Сумма, ₽">
          <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="15 000" autoFocus />
        </Field>
        <Field label="Источник">
          <TextInput value={source} onChange={(e) => setSource(e.target.value)} placeholder="Интеграция с брендом, клиент…" />
        </Field>
        <Field label="Дата">
          <TextInput type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} />
        </Field>
        <Button
          className="w-full"
          disabled={!(value > 0)}
          onClick={() => {
            addIncome({ amount: value, source, date })
            setAmount('')
            setSource('')
            onClose()
          }}
        >
          Записать доход
        </Button>
        <p className="text-center text-xs text-faint">Реальные деньги считаются отдельно от игрового GOLD.</p>
      </div>
    </Sheet>
  )
}
