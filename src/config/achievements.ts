import type { GameState } from '../types'
import { levelInfo } from '../game/levels'

export interface AchievementDef {
  id: string
  emoji: string
  title: string
  description: string
  check: (s: GameState) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_step',
    emoji: '🏆',
    title: 'First Step',
    description: 'Выполнить первый квест',
    check: (s) => s.quests.some((q) => q.status === 'done' || q.status === 'partial'),
  },
  {
    id: 'level_up',
    emoji: '⭐',
    title: 'Level Up',
    description: 'Перейти на новый уровень',
    check: (s) => levelInfo(s.profile.totalXp).level >= 2,
  },
  {
    id: 'streak_3',
    emoji: '🔥',
    title: '3 Day Streak',
    description: 'Действовать 3 дня подряд',
    check: (s) => s.streak.best >= 3,
  },
  {
    id: 'first_money',
    emoji: '💰',
    title: 'First Money',
    description: 'Записать первый реальный доход',
    check: (s) => s.income.some((i) => i.amount > 0),
  },
  {
    id: 'first_boss',
    emoji: '⚔️',
    title: 'First Boss Defeated',
    description: 'Победить первого босса',
    check: (s) => s.defeatedBosses.length > 0,
  },
]

export const achievementById = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)
