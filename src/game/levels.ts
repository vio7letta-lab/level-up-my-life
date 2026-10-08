import { LEVEL_CURVE, LEVEL_TITLES, STAT_LEVEL_CURVE } from '../config/levels'

export interface LevelInfo {
  level: number
  /** XP, набранный внутри текущего уровня */
  xpInLevel: number
  /** сколько XP нужно на весь текущий уровень */
  xpForLevel: number
  /** сколько осталось до следующего уровня */
  xpToNext: number
  /** 0..1 */
  progress: number
}

function compute(totalXp: number, curve: { base: number; step: number }): LevelInfo {
  let level = 1
  let rest = Math.max(0, Math.floor(totalXp))
  let need = curve.base
  while (rest >= need) {
    rest -= need
    level += 1
    need = curve.base + curve.step * (level - 1)
  }
  return { level, xpInLevel: rest, xpForLevel: need, xpToNext: need - rest, progress: rest / need }
}

export const levelInfo = (totalXp: number) => compute(totalXp, LEVEL_CURVE)
export const statLevelInfo = (statXp: number) => compute(statXp, STAT_LEVEL_CURVE)

export function levelTitle(level: number): string {
  const keys = Object.keys(LEVEL_TITLES)
    .map(Number)
    .filter((k) => k <= level)
  return LEVEL_TITLES[Math.max(...keys)]
}
