import { STATE_VERSION, createInitialState } from '../game/initialState'
import type { GameState } from '../types'

/**
 * Миграции данных между версиями. Когда меняется модель данных:
 * 1) увеличить STATE_VERSION в game/initialState.ts,
 * 2) добавить сюда шаг { from: N, migrate: (s) => ... } — прогресс игрока не потеряется.
 */
const MIGRATIONS: { from: number; migrate: (s: any) => any }[] = [
  {
    // v1 → v2: квест стал полноценной задачей.
    // date → dueDate, добавлены source / createdAt; шаблонные квесты помечены как generated,
    // свои квесты — manual (они теперь переносятся на следующий день, пока не сделаны).
    from: 1,
    migrate: (s) => ({
      ...s,
      quests: (s.quests ?? []).map(({ date, ...q }: any) => ({
        ...q,
        dueDate: date,
        source: q.templateId ? 'generated' : 'manual',
        createdAt: q.createdAt ?? q.completedAt ?? `${date}T09:00:00.000Z`,
      })),
      settings: { ...s.settings, templateQuests: true },
    }),
  },
]

export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object' || typeof (raw as any).version !== 'number') return null
  let s: any = raw
  for (const m of MIGRATIONS) if (s.version === m.from) s = { ...m.migrate(s), version: m.from + 1 }
  if (s.version !== STATE_VERSION || !s.profile) return null
  // недостающие поля (например, новые настройки) берём из свежего состояния
  const fresh = createInitialState(new Date(s.profile.createdAt ?? Date.now()), s.profile.name)
  return { ...fresh, ...s, settings: { ...fresh.settings, ...s.settings } }
}
