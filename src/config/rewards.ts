import type { Difficulty } from '../types'

export const DIFFICULTIES: { key: Difficulty; label: string; xp: number; bossDamage: number }[] = [
  { key: 'tiny', label: 'Маленькая', xp: 5, bossDamage: 5 },
  { key: 'normal', label: 'Обычная', xp: 10, bossDamage: 10 },
  { key: 'hard', label: 'Сложная', xp: 25, bossDamage: 15 },
  { key: 'big', label: 'Большая', xp: 50, bossDamage: 20 },
  { key: 'epic', label: 'Важное достижение', xp: 100, bossDamage: 30 },
]

export const REWARDS = {
  /** главный квест даёт двойной XP и бьёт босса минимум на mainBossDamage */
  mainQuestMultiplier: 2,
  mainBossDamage: 20,
  /** «Сделано частично» — доля награды */
  partialShare: 0.5,
  /** доля XP квеста, которая идёт в его характеристику */
  statShare: 0.4,
  /** GOLD = XP · goldShare */
  goldShare: 0.5,
  /** бонус за достигнутый milestone цели */
  milestoneXp: 50,
  /** GOLD за открытое достижение */
  achievementGold: 20,
}
