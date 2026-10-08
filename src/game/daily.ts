import { AREAS } from '../config/seed'
import type { GameState, ISODate, Quest, QuestTemplate } from '../types'
import { dayNumber } from './dates'
import { uid } from './ids'
import { isActive, isPlannedFor } from './today'

/** Если реальных задач на сегодня меньше этого числа — игра предлагает шаблонные квесты */
export const MIN_REAL_TASKS = 3
/** Сколько всего обычных квестов набирать шаблонами (реальные + шаблонные) */
export const TEMPLATE_FILL_TO = 4

export function questFromTemplate(t: QuestTemplate, date: ISODate, isMain: boolean, createdAt = new Date().toISOString()): Quest {
  return {
    id: uid(),
    templateId: t.id,
    source: 'generated',
    createdAt,
    dueDate: date,
    area: t.area,
    title: t.title,
    description: t.description,
    stat: t.stat,
    difficulty: t.difficulty,
    isMain,
    goalId: t.goalId,
    status: 'open',
    xpEarned: 0,
    goldEarned: 0,
    statXpEarned: 0,
  }
}

/**
 * Начало нового дня (один раз в день):
 * 1. «Не сделано» вчера у реальных задач снова становится «новой» — задача никуда не делась.
 * 2. Шаблонные квесты (если включены): главный — если ты не выбрала главный сама;
 *    обычные — только если реальных задач на сегодня меньше MIN_REAL_TASKS.
 * Ротация шаблонов детерминированная: завтра будут другие.
 */
export function ensureDailyQuests(state: GameState, today: ISODate): GameState {
  if (state.lastGeneratedDate === today) return state

  const quests = state.quests.map((q) =>
    q.status === 'skipped' && q.source !== 'generated' && q.dueDate && q.dueDate < today ? { ...q, status: 'open' as const } : q,
  )

  const added: Quest[] = []
  if (state.settings.templateQuests) {
    const real = quests.filter((q) => q.source !== 'generated' && isActive(q) && isPlannedFor(q, today))
    const day = dayNumber(today)
    const active = state.templates.filter((t) => t.active)

    const mains = active.filter((t) => t.kind === 'main')
    if (!real.some((q) => q.isMain) && mains.length) added.push(questFromTemplate(mains[day % mains.length], today, true))

    if (real.length < MIN_REAL_TASKS) {
      const need = Math.min(TEMPLATE_FILL_TO - real.length, state.settings.dailyQuestLimit)
      for (let i = 0; i < AREAS.length && added.filter((q) => !q.isMain).length < need; i++) {
        const area = AREAS[(day + i) % AREAS.length]
        const pool = active.filter((t) => t.kind === 'daily' && t.area === area.key)
        if (pool.length) added.push(questFromTemplate(pool[day % pool.length], today, false))
      }
    }
  }

  return { ...state, quests: [...quests, ...added], lastGeneratedDate: today }
}
