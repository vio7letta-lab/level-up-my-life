import { useState } from 'react'
import { statDef } from '../config/stats'
import { questReward } from '../game/engine'
import { useGame } from '../store/GameContext'
import type { Quest, QuestResult } from '../types'
import { Button } from './Button'
import { Field, TextArea } from './Field'
import { Sheet } from './Sheet'

const OPTIONS: { value: QuestResult['status']; label: string; hint: string }[] = [
  { value: 'done', label: 'Сделано полностью', hint: '100% награды' },
  { value: 'partial', label: 'Сделано частично', hint: '50% награды — это тоже прогресс' },
  { value: 'skipped', label: 'Не сделано', hint: 'Без штрафа. Можно вернуть позже' },
]

export function CompleteQuestSheet({ quest, open, onClose }: { quest: Quest; open: boolean; onClose: () => void }) {
  const { completeQuest } = useGame()
  const [status, setStatus] = useState<QuestResult['status'] | null>(null)
  const [note, setNote] = useState('')

  const close = () => {
    setStatus(null)
    setNote('')
    onClose()
  }

  const reward = status && status !== 'skipped' ? questReward(quest, status) : null

  return (
    <Sheet open={open} onClose={close} title="Что реально сделано?" subtitle={quest.title}>
      <div className="space-y-2.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setStatus(o.value)}
            className={`flex min-h-16 w-full items-center gap-4 rounded-2xl border px-4 text-left transition ${
              status === o.value ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
            }`}
          >
            <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${status === o.value ? 'border-accent bg-accent' : 'border-faint'}`}>
              {status === o.value && <span className="size-2 rounded-full bg-on-accent" />}
            </span>
            <span>
              <span className="block font-semibold">{o.label}</span>
              <span className="block text-sm text-muted">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {status && status !== 'skipped' && (
        <div className="mt-5 animate-rise">
          <Field label="Что именно сделала? (необязательно)" hint="Например: «Написала Zara, Sela и 12storeez». Это попадёт в историю.">
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Коротко, своими словами" rows={2} />
          </Field>
        </div>
      )}

      {reward && (
        <p className="mt-4 text-center text-sm text-muted">
          Награда: <span className="font-semibold text-accent">+{reward.xp} XP</span> · {statDef(quest.stat).label} +{reward.statXp} · +{reward.gold} gold
        </p>
      )}

      <Button
        className="mt-5 w-full"
        disabled={!status}
        onClick={() => {
          if (!status) return
          completeQuest(quest.id, { status, note })
          close()
        }}
      >
        {status === 'skipped' ? 'Отметить и отпустить' : 'Зафиксировать результат'}
      </Button>
    </Sheet>
  )
}
