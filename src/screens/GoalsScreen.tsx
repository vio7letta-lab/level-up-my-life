import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { SectionTitle } from '../components/SectionTitle'

const EXAMPLE_MILESTONES = ['Первый клиент', '10 000 ₽', '30 000 ₽', '50 000 ₽', '75 000 ₽', '100 000 ₽']

export function GoalsScreen() {
  return (
    <div className="space-y-7">
      <ScreenHeader eyebrow="Дерево прогресса" title="Goals" />

      <Card>
        <EmptyState icon="🎯" title="Здесь будут твои большие цели">
          Дедлайн, желаемый результат, milestones и связанные реальные задачи.
        </EmptyState>
      </Card>

      <div>
        <SectionTitle aside="пример">Как будет выглядеть цель</SectionTitle>
        <Card className="opacity-80">
          <p className="text-lg font-medium">💰 Зарабатывать 100 000 ₽/месяц</p>
          <div className="mt-4 flex justify-between text-sm text-muted">
            <span>0 ₽ из 100 000 ₽</span>
            <span>0%</span>
          </div>
          <ProgressBar value={0} className="mt-2" />
          <ol className="mt-5 space-y-2.5">
            {EXAMPLE_MILESTONES.map((m) => (
              <li key={m} className="flex items-center gap-3 text-sm">
                <span className="size-5 shrink-0 rounded-md border border-line" />
                {m}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
