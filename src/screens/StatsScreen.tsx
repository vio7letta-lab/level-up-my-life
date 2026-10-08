import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'

const TILES = [
  { label: 'Всего XP', value: '0' },
  { label: 'Уровень', value: '1' },
  { label: 'Задач выполнено', value: '0' },
  { label: 'Серия', value: '🔥 0' },
]

export function StatsScreen() {
  return (
    <div className="space-y-7">
      <ScreenHeader eyebrow="Твой реальный прогресс" title="Stats" />

      <div className="grid grid-cols-2 gap-3">
        {TILES.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-xs text-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{t.value}</p>
          </Card>
        ))}
      </div>

      <div>
        <SectionTitle>💰 Real Money</SectionTitle>
        <Card>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted">Доход за месяц</p>
              <p className="text-4xl font-semibold tracking-tight">0 ₽</p>
            </div>
            <p className="text-sm text-muted">цель 100 000 ₽</p>
          </div>
          <ProgressBar value={0} tint="#d9c79a" className="mt-4" />
          <p className="mt-3 text-xs text-faint">Реальные деньги считаются отдельно от игрового GOLD.</p>
        </Card>
      </div>

      <div>
        <SectionTitle>Неделя</SectionTitle>
        <Card>
          <EmptyState icon="📊" title="Недельная статистика">
            XP по дням, рабочие действия, клиенты и сравнение с прошлой неделей.
          </EmptyState>
        </Card>
      </div>
    </div>
  )
}
