import {
  BIG_COUNT,
  BIG_PATTERN,
  CONTEXT_STAT_RULES,
  DEFAULT_DIFFICULTY,
  DEFAULT_STAT,
  HARD_PATTERN,
  STRONG_STAT_RULES,
  TINY_PATTERN,
  WEAK_STAT_RULES,
  type StatRule,
} from '../config/classifier'
import type { Difficulty, Goal, StatKey } from '../types'

export interface Classification {
  stat: StatKey
  difficulty: Difficulty
  goalId?: string
}

const find = (rules: StatRule[], text?: string) => (text ? rules.find((r) => r.pattern.test(text)) : undefined)

/** Самое большое число в тексте: «50–100 штук» → 100, «Отправить 50 резюме» → 50 */
function maxNumber(text: string): number {
  const nums = text.match(/\d+/g)?.map(Number) ?? []
  return nums.length ? Math.max(...nums) : 0
}

export function classifyDifficulty(title: string): Difficulty {
  const t = title.toLowerCase()
  // «₽» — это сумма, а не количество действий
  const count = /₽|руб/.test(t) ? 0 : maxNumber(t)
  if (BIG_PATTERN.test(t) || count >= BIG_COUNT) return 'big'
  const tiny = TINY_PATTERN.test(t)
  if (HARD_PATTERN.test(t)) return tiny ? 'normal' : 'hard' // «Лаба ВМС — спросить значения» → обычная
  return tiny ? 'tiny' : DEFAULT_DIFFICULTY
}

/**
 * Категория → цель: берём активную цель с той же характеристикой.
 * Для «бытовых» правил (VPN, документы, «написать маме») цель не привязываем.
 */
export function suggestGoal(stat: StatKey, goals: Goal[], linkGoal = true): string | undefined {
  if (!linkGoal) return undefined
  return goals.find((g) => !g.completedAt && g.stat === stat)?.id
}

/** Автоматическая оценка задачи: категория, сложность, цель */
export function classifyTask(title: string, context: string | undefined, goals: Goal[]): Classification {
  const t = title.toLowerCase()
  const rule = find(STRONG_STAT_RULES, t) ?? find(CONTEXT_STAT_RULES, context?.toLowerCase()) ?? find(WEAK_STAT_RULES, t)
  const stat = rule?.stat ?? DEFAULT_STAT
  return {
    stat,
    difficulty: classifyDifficulty(title),
    goalId: rule ? suggestGoal(stat, goals, rule.linkGoal ?? true) : undefined,
  }
}
