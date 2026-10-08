import type { Theme } from '../app/useTheme'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'
import { ThemeToggle } from '../components/ThemeToggle'
import { APP } from '../config/app'
import { STATS } from '../config/stats'

export function CharacterScreen({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  return (
    <div className="space-y-7">
      <ScreenHeader
        eyebrow="Главный персонаж"
        title={APP.playerName}
        aside={<ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      />

      <div>
        <SectionTitle>Характеристики</SectionTitle>
        <Card>
          <ul className="space-y-4">
            {STATS.map((s) => (
              <li key={s.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[15px]">
                    {s.emoji} <span className="font-medium">{s.label}</span>
                  </span>
                  <span className="text-sm text-faint">Lv 1</span>
                </div>
                <ProgressBar value={0} tint={s.tint} />
                <p className="mt-1.5 text-xs text-muted">{s.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="space-y-3">
        <SectionTitle>Скоро</SectionTitle>
        <Card>
          <EmptyState icon="🐉" title="Боссы">Большие проблемы, которые побеждаются реальными действиями.</EmptyState>
        </Card>
        <Card>
          <EmptyState icon="🏆" title="Достижения">First Step, First Client, 10K, Boss Slayer и другие.</EmptyState>
        </Card>
        <Card>
          <EmptyState icon="🎁" title="Награды за GOLD">
            Ты сама создаёшь приятности и «покупаешь» их за игровое золото. Сон, еда и отдых — не награды, а база.
          </EmptyState>
        </Card>
      </div>
    </div>
  )
}
