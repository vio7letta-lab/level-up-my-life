import { APP } from '../config/app'
import { SEED_GOALS, SEED_TEMPLATES } from '../config/seed'
import type { GameState } from '../types'
import { createBoss } from './boss'

export const STATE_VERSION = 1

export function createInitialState(now: Date, name: string = APP.playerName): GameState {
  const at = now.toISOString()
  return {
    version: STATE_VERSION,
    profile: {
      name,
      createdAt: at,
      totalXp: 0,
      gold: 0,
      statXp: { finance: 0, career: 0, media: 0, knowledge: 0, energy: 0, social: 0, freedom: 0 },
    },
    goals: SEED_GOALS.map((g) => ({ ...g, milestones: g.milestones.map((m) => ({ ...m })), createdAt: at })),
    templates: SEED_TEMPLATES.map((t) => ({ ...t })),
    quests: [],
    boss: createBoss(0),
    defeatedBosses: [],
    achievements: [],
    rewards: [],
    income: [],
    streak: { current: 0, best: 0, shields: 0, totalActiveDays: 0 },
    history: [],
    settings: { dailyQuestLimit: 5 },
  }
}
