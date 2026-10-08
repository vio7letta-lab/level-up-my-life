import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ScreenHeader } from '../components/ScreenHeader'

export function QuestsScreen() {
  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Реальные действия" title="Quests" />
      <Card>
        <EmptyState icon="⚔️" title="Квесты дня">
          Короткий список реальных задач на сегодня и один главный квест.
        </EmptyState>
      </Card>
      <Card>
        <EmptyState icon="🔁" title="Шаблоны">
          Повторяющиеся действия: «40 минут учёбы», «30 минут движения», «3 идеи для контента».
        </EmptyState>
      </Card>
      <Card>
        <EmptyState icon="📜" title="История">
          Всё, что ты реально сделала, с результатами и заметками — навсегда.
        </EmptyState>
      </Card>
    </div>
  )
}
