/**
 * Игровой движок: чистые функции «состояние + действие → новое состояние + эффекты».
 * Без React и без хранилища — поэтому легко тестируется и позже переносится на сервер.
 */
import { ACHIEVEMENTS } from '../config/achievements'
import { DIFFICULTIES, REWARDS } from '../config/rewards'
import type { Area, Difficulty, GameEffect, GameState, Goal, GoalMetric, HistoryEntry, ISODate, Quest, QuestResult, StatKey } from '../types'
import { createBoss } from './boss'
import { toISODate } from './dates'
import { ensureDailyQuests, questFromTemplate } from './daily'
import { goalCurrent, goalTarget } from './goals'
import { uid } from './ids'
import { levelInfo, levelTitle, statLevelInfo } from './levels'
import { registerActivity } from './streak'

export interface ActionResult {
  state: GameState
  effects: GameEffect[]
}

/** Изменяемая копия состояния на время одного действия */
interface Ctx {
  s: GameState
  effects: GameEffect[]
  now: Date
  today: ISODate
}

function begin(state: GameState, now: Date): Ctx {
  return { s: structuredClone(state), effects: [], now, today: toISODate(now) }
}

const done = (ctx: Ctx): ActionResult => ({ state: ctx.s, effects: ctx.effects })
const unchanged = (state: GameState): ActionResult => ({ state, effects: [] })

export const difficultyDef = (d: Difficulty) => DIFFICULTIES.find((x) => x.key === d)!

/** Сколько XP даёт квест при полном выполнении */
export function questXp(q: Pick<Quest, 'difficulty' | 'isMain'>): number {
  return difficultyDef(q.difficulty).xp * (q.isMain ? REWARDS.mainQuestMultiplier : 1)
}

export function questReward(q: Pick<Quest, 'difficulty' | 'isMain'>, status: 'done' | 'partial') {
  const share = status === 'partial' ? REWARDS.partialShare : 1
  const xp = Math.max(1, Math.round(questXp(q) * share))
  return {
    xp,
    gold: Math.round(xp * REWARDS.goldShare),
    statXp: Math.max(1, Math.round(xp * REWARDS.statShare)),
  }
}

export function bossDamage(q: Pick<Quest, 'difficulty' | 'isMain'>, status: 'done' | 'partial'): number {
  const base = Math.max(difficultyDef(q.difficulty).bossDamage, q.isMain ? REWARDS.mainBossDamage : 0)
  return status === 'partial' ? Math.max(1, Math.round(base * REWARDS.partialShare)) : base
}

function history(ctx: Ctx, e: Omit<HistoryEntry, 'id' | 'at' | 'date'> & { date?: ISODate }) {
  ctx.s.history.push({ id: uid(), at: ctx.now.toISOString(), date: ctx.today, ...e })
}

/** Начисляет XP/GOLD/XP характеристики и сообщает о новых уровнях */
function grant(ctx: Ctx, xp: number, gold: number, stat?: StatKey, statXp = 0) {
  const p = ctx.s.profile
  const before = levelInfo(p.totalXp).level
  p.totalXp += xp
  p.gold += gold
  const after = levelInfo(p.totalXp).level
  if (after > before) {
    ctx.effects.push({ type: 'level', level: after, title: levelTitle(after) })
    history(ctx, { type: 'level', title: `Level ${after}`, result: levelTitle(after), xp: 0, gold: 0 })
  }

  if (stat && statXp > 0) {
    const sBefore = statLevelInfo(p.statXp[stat]).level
    p.statXp[stat] += statXp
    const sAfter = statLevelInfo(p.statXp[stat]).level
    if (sAfter > sBefore) ctx.effects.push({ type: 'statLevel', stat, level: sAfter })
  }
}

function hitBoss(ctx: Ctx, damage: number) {
  const boss = ctx.s.boss
  if (!boss || damage <= 0) return
  boss.hp = Math.max(0, boss.hp - damage)
  ctx.effects.push({ type: 'bossHit', name: boss.name, emoji: boss.emoji, damage, hp: boss.hp, maxHp: boss.maxHp })

  if (boss.hp === 0) {
    boss.defeatedAt = ctx.now.toISOString()
    ctx.s.defeatedBosses.push(boss)
    const next = createBoss(boss.index + 1)
    ctx.s.boss = next
    history(ctx, { type: 'boss', title: `Босс побеждён: ${boss.name}`, result: `${boss.maxHp} HP`, xp: boss.reward.xp, gold: boss.reward.gold })
    ctx.effects.push({ type: 'bossDefeated', name: boss.name, emoji: boss.emoji, xp: boss.reward.xp, gold: boss.reward.gold, next: next.name })
    grant(ctx, boss.reward.xp, boss.reward.gold)
  }
}

/** Автоматически закрывает milestones, когда реальная метрика цели их достигла */
function checkGoals(ctx: Ctx) {
  for (const goal of ctx.s.goals) {
    const current = goalCurrent(ctx.s, goal, ctx.today)
    for (const m of goal.milestones) {
      if (m.doneAt || m.targetValue === undefined || current < m.targetValue) continue
      reachMilestone(ctx, goal, m.id)
    }
    if (!goal.completedAt && current >= goalTarget(goal)) {
      goal.completedAt = ctx.now.toISOString()
      history(ctx, { type: 'milestone', title: `Цель достигнута: ${goal.title}`, result: '🎉', xp: 0, gold: 0, stat: goal.stat })
    }
  }
}

function reachMilestone(ctx: Ctx, goal: Goal, milestoneId: string) {
  const m = goal.milestones.find((x) => x.id === milestoneId)
  if (!m || m.doneAt) return
  m.doneAt = ctx.now.toISOString()
  const xp = REWARDS.milestoneXp
  const statXp = Math.round(xp * REWARDS.statShare)
  history(ctx, { type: 'milestone', title: m.title, result: goal.title, xp, gold: 0, stat: goal.stat, statXp })
  ctx.effects.push({ type: 'milestone', goal: goal.title, title: m.title, xp })
  grant(ctx, xp, 0, goal.stat, statXp)
}

/** Проверяет достижения до тех пор, пока открываются новые (одно может открыть другое) */
function checkAchievements(ctx: Ctx) {
  let found = true
  while (found) {
    found = false
    for (const a of ACHIEVEMENTS) {
      if (ctx.s.achievements.some((u) => u.id === a.id) || !a.check(ctx.s)) continue
      ctx.s.achievements.push({ id: a.id, unlockedAt: ctx.now.toISOString() })
      history(ctx, { type: 'achievement', title: `Достижение: ${a.title}`, result: a.description, xp: 0, gold: REWARDS.achievementGold })
      ctx.effects.push({ type: 'achievement', id: a.id })
      grant(ctx, 0, REWARDS.achievementGold)
      found = true
    }
  }
}

function settle(ctx: Ctx) {
  checkGoals(ctx)
  checkAchievements(ctx)
}

/* ───────────────────────── Публичные действия ───────────────────────── */

/** Собрать квесты дня, если наступил новый день */
export function startDay(state: GameState, now: Date): GameState {
  return ensureDailyQuests(state, toISODate(now))
}

export const STATUS_LABEL: Record<Quest['status'], string> = {
  open: 'Открыт',
  done: 'Сделано полностью',
  partial: 'Сделано частично',
  skipped: 'Не сделано',
}

/**
 * Главное действие игры: зафиксировать реальный результат квеста.
 * XP начисляется ровно один раз — повторный вызов для выполненного квеста ничего не меняет.
 */
export function completeQuest(state: GameState, questId: string, result: QuestResult, now: Date): ActionResult {
  const original = state.quests.find((q) => q.id === questId)
  if (!original || original.status === 'done' || original.status === 'partial') return unchanged(state)

  const ctx = begin(state, now)
  const q = ctx.s.quests.find((x) => x.id === questId)!
  q.note = result.note?.trim() || undefined

  if (result.status === 'skipped') {
    // «Не сделано» — честно и без штрафа: квест можно вернуть и сделать позже
    q.status = 'skipped'
    return done(ctx)
  }

  const { xp, gold, statXp } = questReward(q, result.status)
  q.status = result.status
  q.completedAt = now.toISOString()
  q.xpEarned = xp
  q.goldEarned = gold
  q.statXpEarned = statXp

  ctx.effects.push({ type: 'quest', title: q.title, status: q.status, xp, gold, stat: q.stat, statXp })
  history(ctx, { type: 'quest', title: q.title, result: q.note ?? STATUS_LABEL[q.status], xp, gold, stat: q.stat, statXp, questId: q.id })
  grant(ctx, xp, gold, q.stat, statXp)

  const streak = registerActivity(ctx.s.streak, ctx.today)
  ctx.s.streak = streak.streak
  ctx.s.lastActivityDate = ctx.today
  if (streak.changed) ctx.effects.push({ type: 'streak', days: streak.streak.current, shieldUsed: streak.shieldUsed })

  hitBoss(ctx, bossDamage(q, result.status))
  settle(ctx)
  return done(ctx)
}

/** Вернуть «не сделанный» квест в работу */
export function reopenQuest(state: GameState, questId: string, now: Date): ActionResult {
  if (state.quests.find((q) => q.id === questId)?.status !== 'skipped') return unchanged(state)
  const ctx = begin(state, now)
  const q = ctx.s.quests.find((x) => x.id === questId)!
  q.status = 'open'
  q.note = undefined
  return done(ctx)
}

export interface QuestInput {
  title: string
  description: string
  stat: StatKey
  difficulty: Difficulty
  goalId?: string
  area?: Area
  isMain?: boolean
}

const editable = (q?: Quest) => !!q && (q.status === 'open' || q.status === 'skipped')

/** Добавить свой квест на сегодня */
export function addQuest(state: GameState, input: QuestInput, now: Date): ActionResult {
  const ctx = begin(state, now)
  if (input.isMain) ctx.s.quests.forEach((q) => q.date === ctx.today && editable(q) && (q.isMain = false))
  ctx.s.quests.push({
    id: uid(),
    date: ctx.today,
    area: input.area,
    title: input.title.trim(),
    description: input.description.trim(),
    stat: input.stat,
    difficulty: input.difficulty,
    isMain: !!input.isMain,
    goalId: input.goalId || undefined,
    status: 'open',
    xpEarned: 0,
    goldEarned: 0,
    statXpEarned: 0,
  })
  return done(ctx)
}

/** Изменить квест (только пока он не выполнен — выполненные неизменны) */
export function updateQuest(state: GameState, questId: string, input: QuestInput, now: Date): ActionResult {
  if (!editable(state.quests.find((q) => q.id === questId))) return unchanged(state)
  const ctx = begin(state, now)
  const q = ctx.s.quests.find((x) => x.id === questId)!
  if (input.isMain && !q.isMain) ctx.s.quests.forEach((x) => x.date === q.date && editable(x) && (x.isMain = false))
  Object.assign(q, {
    title: input.title.trim(),
    description: input.description.trim(),
    stat: input.stat,
    difficulty: input.difficulty,
    goalId: input.goalId || undefined,
    isMain: input.isMain ?? q.isMain,
    templateId: undefined,
  })
  return done(ctx)
}

export function deleteQuest(state: GameState, questId: string): ActionResult {
  if (!editable(state.quests.find((q) => q.id === questId))) return unchanged(state)
  return { state: { ...state, quests: state.quests.filter((q) => q.id !== questId) }, effects: [] }
}

/** Заменить квест следующим шаблоном того же направления */
export function swapQuest(state: GameState, questId: string, now: Date): ActionResult {
  const q = state.quests.find((x) => x.id === questId)
  if (!q || q.status !== 'open' || !q.templateId) return unchanged(state)
  const tpl = state.templates.find((t) => t.id === q.templateId)
  if (!tpl) return unchanged(state)

  const pool = state.templates.filter((t) => t.active && t.kind === tpl.kind && (tpl.kind === 'main' || t.area === tpl.area))
  const usedToday = new Set(state.quests.filter((x) => x.date === q.date).map((x) => x.templateId))
  const start = pool.findIndex((t) => t.id === tpl.id)
  for (let i = 1; i < pool.length; i++) {
    const next = pool[(start + i) % pool.length]
    if (usedToday.has(next.id)) continue
    const ctx = begin(state, now)
    const idx = ctx.s.quests.findIndex((x) => x.id === questId)
    ctx.s.quests[idx] = { ...questFromTemplate(next, q.date, q.isMain), id: q.id }
    return done(ctx)
  }
  return unchanged(state)
}

/* ───────────────────────── Деньги и цели ───────────────────────── */

export function addIncome(state: GameState, input: { amount: number; source: string; date: ISODate }, now: Date): ActionResult {
  const amount = Math.round(input.amount)
  if (!(amount > 0)) return unchanged(state)
  const ctx = begin(state, now)
  const entry = { id: uid(), amount, source: input.source.trim() || 'Доход', date: input.date, createdAt: now.toISOString() }
  ctx.s.income.push(entry)
  history(ctx, { type: 'income', title: entry.source, result: `+${amount.toLocaleString('ru-RU')} ₽`, xp: 0, gold: 0, stat: 'finance', date: input.date })
  ctx.effects.push({ type: 'income', amount })
  settle(ctx)
  return done(ctx)
}

/** Удалить ошибочную запись дохода. Уже достигнутые milestones остаются. */
export function deleteIncome(state: GameState, incomeId: string): ActionResult {
  return { state: { ...state, income: state.income.filter((i) => i.id !== incomeId) }, effects: [] }
}

export interface GoalInput {
  title: string
  emoji: string
  outcome: string
  stat: StatKey
  deadline?: ISODate
  metric: GoalMetric
  milestones: { title: string; targetValue?: number }[]
}

export function createGoal(state: GameState, input: GoalInput, now: Date): ActionResult {
  const ctx = begin(state, now)
  ctx.s.goals.push({
    id: uid(),
    title: input.title.trim(),
    emoji: input.emoji || '✨',
    outcome: input.outcome.trim(),
    stat: input.stat,
    deadline: input.deadline || undefined,
    metric: input.metric,
    milestones: input.milestones.map((m) => ({ id: uid(), title: m.title.trim(), targetValue: m.targetValue })),
    createdAt: now.toISOString(),
  })
  settle(ctx)
  return done(ctx)
}

export function deleteGoal(state: GameState, goalId: string): ActionResult {
  return {
    state: {
      ...state,
      goals: state.goals.filter((g) => g.id !== goalId),
      templates: state.templates.map((t) => (t.goalId === goalId ? { ...t, goalId: undefined } : t)),
    },
    effects: [],
  }
}

/** Записать текущее значение цели вручную (для целей с source = 'manual') */
export function setGoalValue(state: GameState, goalId: string, value: number, now: Date): ActionResult {
  const goal = state.goals.find((g) => g.id === goalId)
  if (!goal || goal.metric.source !== 'manual' || !(value >= 0)) return unchanged(state)
  const ctx = begin(state, now)
  ctx.s.goals.find((g) => g.id === goalId)!.metric.manualValue = value
  settle(ctx)
  return done(ctx)
}

/** Отметить шаг без числового порога (например, «Сдать сессию») */
export function completeMilestone(state: GameState, goalId: string, milestoneId: string, now: Date): ActionResult {
  const m = state.goals.find((g) => g.id === goalId)?.milestones.find((x) => x.id === milestoneId)
  if (!m || m.doneAt || m.targetValue !== undefined) return unchanged(state)
  const ctx = begin(state, now)
  reachMilestone(ctx, ctx.s.goals.find((g) => g.id === goalId)!, milestoneId)
  settle(ctx)
  return done(ctx)
}

export function setPlayerName(state: GameState, name: string): ActionResult {
  const n = name.trim()
  if (!n) return unchanged(state)
  return { state: { ...state, profile: { ...state.profile, name: n } }, effects: [] }
}
