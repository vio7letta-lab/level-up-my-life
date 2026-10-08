import type { ISODate, StreakState } from '../types'
import { daysBetween } from './dates'

export const SHIELD_EVERY = 7
export const MAX_SHIELDS = 3

/**
 * Отмечает день как активный (в этот день зафиксировано реальное действие).
 * Пропущенные дни закрываются щитами; если щитов не хватило — серия
 * начинается заново, но best и totalActiveDays сохраняются навсегда.
 */
export function registerActivity(s: StreakState, today: ISODate): { streak: StreakState; shieldUsed: boolean; changed: boolean } {
  if (s.lastActiveDate === today) return { streak: s, shieldUsed: false, changed: false }

  let current = 1
  let shields = s.shields
  let shieldUsed = false

  if (s.lastActiveDate) {
    const missed = daysBetween(s.lastActiveDate, today) - 1
    if (missed <= 0) current = s.current + 1
    else if (missed <= shields) {
      shields -= missed
      shieldUsed = true
      current = s.current + 1
    }
  }

  if (current % SHIELD_EVERY === 0) shields = Math.min(MAX_SHIELDS, shields + 1)

  return {
    streak: {
      current,
      best: Math.max(s.best, current),
      lastActiveDate: today,
      shields,
      totalActiveDays: s.totalActiveDays + 1,
    },
    shieldUsed,
    changed: true,
  }
}

/** Серия «на сегодня»: если пропусков больше, чем щитов, показываем 0 (без наказаний — просто честно). */
export function displayStreak(s: StreakState, today: ISODate): number {
  if (!s.lastActiveDate) return 0
  const missed = daysBetween(s.lastActiveDate, today) - 1
  return missed <= s.shields ? s.current : 0
}
