import type { Goal, QuestTemplate } from '../types'

/** Предложенный план: недели → квесты. Пользователь подтверждает или правит. */
export interface QuestPlanWeek {
  week: number
  title: string
  quests: Omit<QuestTemplate, 'id' | 'active'>[]
}

/**
 * Превращает большую цель в реальные действия.
 *
 * Этап 7: TemplateQuestGenerator — готовые планы по типам целей, без ИИ.
 * Позже: AIQuestGenerator с тем же интерфейсом.
 */
export interface QuestGenerator {
  suggestPlan(goal: Goal): Promise<QuestPlanWeek[]>
}
