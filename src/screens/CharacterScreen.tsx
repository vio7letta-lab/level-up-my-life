import { useState } from 'react'
import type { Theme } from '../app/useTheme'
import { AchievementGrid } from '../components/AchievementGrid'
import { BossCard } from '../components/BossCard'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, TextInput } from '../components/Field'
import { LevelCard } from '../components/LevelCard'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { Sheet } from '../components/Sheet'
import { StatBars } from '../components/StatBars'
import { ThemeToggle } from '../components/ThemeToggle'
import { formatDate } from '../game/dates'
import { useGame } from '../store/GameContext'

export function CharacterScreen({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { state, setPlayerName, resetProgress, setTemplateQuests } = useGame()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(state.profile.name)

  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Главный персонаж"
        title={state.profile.name}
        aside={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      />

      <LevelCard />

      <div>
        <SectionTitle>Характеристики</SectionTitle>
        <Card>
          <StatBars />
        </Card>
      </div>

      <div>
        <SectionTitle>Текущий босс</SectionTitle>
        <BossCard />
        {state.defeatedBosses.length > 0 && (
          <ul className="mt-3 space-y-2">
            {state.defeatedBosses.map((b) => (
              <li key={b.id} className="glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
                <span className="text-xl grayscale">{b.emoji}</span>
                <span className="flex-1 font-medium line-through decoration-faint">{b.name}</span>
                <span className="text-xs text-faint">побеждён {b.defeatedAt && formatDate(b.defeatedAt.slice(0, 10))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SectionTitle aside={`${state.achievements.length} открыто`}>Достижения</SectionTitle>
        <Card>
          <AchievementGrid />
        </Card>
      </div>

      <div>
        <SectionTitle>Настройки</SectionTitle>
        <div className="space-y-3">
          <Button variant="ghost" className="w-full" onClick={() => setEditingName(true)}>
            Изменить имя
          </Button>
          <label className="glass flex min-h-14 items-center gap-4 rounded-2xl px-4">
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Шаблонные квесты</span>
              <span className="block text-xs text-muted">Игра предлагает квесты, если реальных задач на сегодня меньше 3</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={state.settings.templateQuests}
              onChange={(e) => setTemplateQuests(e.target.checked)}
              className="size-6 shrink-0 accent-[var(--accent)]"
              aria-label="Шаблонные квесты"
            />
          </label>
          <Button
            variant="quiet"
            className="w-full"
            onClick={() => {
              if (confirm('Начать игру заново? Весь прогресс, история и доход будут удалены.') && confirm('Точно? Это нельзя отменить.')) resetProgress()
            }}
          >
            Начать заново
          </Button>
          <p className="px-1 text-center text-xs text-faint">Прогресс хранится только на этом устройстве, в этом браузере.</p>
        </div>
      </div>

      {editingName && (
        <Sheet open onClose={() => setEditingName(false)} title="Имя персонажа">
          <div className="space-y-5">
            <Field label="Как тебя называть">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
            <Button
              className="w-full"
              disabled={!name.trim()}
              onClick={() => {
                setPlayerName(name)
                setEditingName(false)
              }}
            >
              Сохранить
            </Button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
