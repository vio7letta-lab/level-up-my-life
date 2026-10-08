import { BOSSES } from '../config/bosses'
import type { Boss } from '../types'

/** Создаёт босса по номеру в цепочке. После конца списка — новый круг с HP ×1.5. */
export function createBoss(index: number): Boss {
  const def = BOSSES[index % BOSSES.length]
  const round = Math.floor(index / BOSSES.length)
  const scale = 1 + round * 0.5
  const maxHp = Math.round(def.maxHp * scale)
  return {
    id: `boss-${index}`,
    index,
    name: round > 0 ? `${def.name} ${'I'.repeat(round + 1)}` : def.name,
    emoji: def.emoji,
    description: def.description,
    maxHp,
    hp: maxHp,
    reward: { xp: Math.round(def.reward.xp * scale), gold: Math.round(def.reward.gold * scale) },
  }
}
