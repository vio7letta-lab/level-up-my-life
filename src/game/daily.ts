import { AREAS } from '../config/seed'
import type { GameState, ISODate, Quest, QuestTemplate } from '../types'
import { dayNumber } from './dates'
import { uid } from './ids'

export function questFromTemplate(t: QuestTemplate, date: ISODate, isMain: boolean): Quest {
  return {
    id: uid(),
    templateId: t.id,
    date,
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
 * Собирает квесты дня один раз в день: 1 главный + по одному из каждого
 * направления (ротация по кругу, без случайности — завтра будет другой шаблон).
 * Старые невыполненные квесты остаются в истории без штрафов.
 */
export function ensureDailyQuests(state: GameState, today: ISODate): GameState {
  if (state.lastGeneratedDate === today) return state

  const day = dayNumber(today)
  const active = state.templates.filter((t) => t.active)
  const quests: Quest[] = []

  const mains = active.filter((t) => t.kind === 'main')
  if (mains.length) quests.push(questFromTemplate(mains[day % mains.length], today, true))

  for (const area of AREAS) {
    if (quests.filter((q) => !q.isMain).length >= state.settings.dailyQuestLimit) break
    const pool = active.filter((t) => t.kind === 'daily' && t.area === area.key)
    if (pool.length) quests.push(questFromTemplate(pool[day % pool.length], today, false))
  }

  return { ...state, quests: [...state.quests, ...quests], lastGeneratedDate: today }
}
