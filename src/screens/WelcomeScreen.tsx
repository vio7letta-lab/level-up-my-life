import { useState } from 'react'
import { Button } from '../components/Button'
import { APP } from '../config/app'

const STEPS = [
  {
    eyebrow: 'Level Up: My Life',
    title: `Привет, ${APP.playerName}`,
    body: 'Это RPG, где игровой мир — твоя настоящая жизнь. Главный персонаж — ты, и он растёт вместе с тобой.',
  },
  {
    eyebrow: 'Как это работает',
    title: 'Действие → прогресс → результат',
    body: null,
  },
  {
    eyebrow: 'Главное правило',
    title: 'Real life first',
    body: 'Лучший момент игры — когда ты закрываешь приложение и идёшь делать. Возвращаешься, фиксируешь результат — и только тогда растёшь. Без действия нет прогресса. Без наказаний за паузы.',
  },
]

const LOOP = [
  { icon: '🎯', title: 'Игра предлагает реальное действие', text: '«Найди 5 потенциальных клиентов»' },
  { icon: '🚶‍♀️', title: 'Ты делаешь это в жизни', text: 'Находишь, пишешь, публикуешь, учишься' },
  { icon: '✨', title: 'Фиксируешь результат', text: 'XP, характеристики, уровни, боссы, достижения' },
]

export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-xl flex-col px-6 pb-8">
      <div className="flex gap-1.5 pt-6" aria-hidden>
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-accent' : 'bg-surface-strong'}`}
          />
        ))}
      </div>

      <div key={step} className="flex flex-1 animate-rise flex-col justify-center py-10">
        {step === 0 && (
          <div className="mb-10 grid size-20 place-items-center rounded-[28px] glass">
            <img src="./icon.svg" alt="" className="size-14 rounded-2xl" />
          </div>
        )}
        <p className="eyebrow mb-3">{s.eyebrow}</p>
        <h1 className="font-display text-5xl leading-[1.02] font-semibold tracking-tight">{s.title}</h1>
        {s.body && <p className="mt-6 text-[17px] leading-relaxed text-muted">{s.body}</p>}

        {step === 1 && (
          <ol className="mt-8 space-y-3">
            {LOOP.map((l, i) => (
              <li key={i} className="glass flex items-center gap-4 rounded-3xl p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-xl">{l.icon}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{l.title}</span>
                  <span className="block text-sm text-muted">{l.text}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} aria-label="Назад">
            ←
          </Button>
        )}
        <Button className="flex-1" onClick={() => (last ? onDone() : setStep(step + 1))}>
          {last ? 'Начать игру' : 'Дальше'}
        </Button>
      </div>
    </div>
  )
}
