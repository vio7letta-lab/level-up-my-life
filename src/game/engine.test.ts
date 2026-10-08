import { describe, expect, it } from 'vitest'
import type { GameState } from '../types'
import {
  addIncome,
  addQuest,
  bossDamage,
  completeMilestone,
  completeQuest,
  createGoal,
  questReward,
  reopenQuest,
  startDay,
  swapQuest,
  updateQuest,
} from './engine'
import { goalCurrent, goalProgress, monthlyIncome } from './goals'
import { createInitialState } from './initialState'
import { levelInfo, levelTitle, statLevelInfo } from './levels'
import { displayStreak, registerActivity } from './streak'
import { migrate } from '../storage/migrations'

const day = (d: string, h = 12) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`)
const D1 = day('2026-10-08')

function fresh(now = D1): GameState {
  return startDay(createInitialState(now), now)
}
const today = (s: GameState, date = '2026-10-08') => s.quests.filter((q) => q.dueDate === date)
const mainOf = (s: GameState) => today(s).find((q) => q.isMain)!
const dailyOf = (s: GameState) => today(s).find((q) => !q.isMain)!

describe('levels', () => {
  it('starts at level 1 and needs 50 XP for level 2', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, xpInLevel: 0, xpForLevel: 50, xpToNext: 50 })
    expect(levelInfo(49).level).toBe(1)
    expect(levelInfo(50)).toMatchObject({ level: 2, xpInLevel: 0, xpForLevel: 75 })
    expect(levelInfo(50 + 75 + 100).level).toBe(4)
  })

  it('has titles from config', () => {
    expect(levelTitle(1)).toBe('Начало')
    expect(levelTitle(7)).toBe('Разгон')
    expect(levelTitle(20)).toBe('Protagonist')
  })

  it('stat levels use their own shorter curve', () => {
    expect(statLevelInfo(19).level).toBe(1)
    expect(statLevelInfo(20).level).toBe(2)
  })
})

describe('daily quests', () => {
  it('without real tasks: 1 main + 4 template quests from different areas, once a day', () => {
    const s = fresh()
    expect(today(s)).toHaveLength(5)
    expect(today(s).filter((q) => q.isMain)).toHaveLength(1)
    expect(new Set(today(s).filter((q) => !q.isMain).map((q) => q.area)).size).toBe(4)
    expect(startDay(s, day('2026-10-08', 20))).toBe(s) // повторный запуск в тот же день — ничего
  })

  it('rotates templates on the next day and keeps old quests as history', () => {
    const s1 = fresh()
    const s2 = startDay(s1, day('2026-10-09'))
    expect(s2.quests).toHaveLength(10)
    expect(mainOf(s1).templateId).not.toBe(today(s2, '2026-10-09').find((q) => q.isMain)!.templateId)
  })

  it('swaps a quest for another template of the same area', () => {
    const s = fresh()
    const q = dailyOf(s)
    const r = swapQuest(s, q.id, D1)
    const swapped = r.state.quests.find((x) => x.id === q.id)!
    expect(swapped.templateId).not.toBe(q.templateId)
    expect(swapped.area).toBe(q.area)
  })
})

describe('completeQuest', () => {
  it('grants XP, gold and stat XP for a full result', () => {
    const s = fresh()
    const q = today(s).find((x) => x.templateId === 't-offers') ?? dailyOf(s)
    const reward = questReward(q, 'done')
    const r = completeQuest(s, q.id, { status: 'done', note: 'Написала 3 брендам' }, D1)
    const after = r.state.quests.find((x) => x.id === q.id)!
    expect(after).toMatchObject({ status: 'done', note: 'Написала 3 брендам', xpEarned: reward.xp })
    // + золото за достижение First Step
    expect(r.state.profile.totalXp).toBeGreaterThanOrEqual(reward.xp)
    expect(r.state.profile.statXp[q.stat]).toBeGreaterThanOrEqual(reward.statXp)
    expect(r.effects[0]).toMatchObject({ type: 'quest', xp: reward.xp, stat: q.stat })
    expect(r.state.history.find((h) => h.questId === q.id)).toMatchObject({ xp: reward.xp, stat: q.stat })
  })

  it('gives half the reward for a partial result', () => {
    const s = fresh()
    const q = mainOf(s) // big × main = 100 XP
    expect(questReward(q, 'done').xp).toBe(100)
    expect(questReward(q, 'partial').xp).toBe(50)
    const r = completeQuest(s, q.id, { status: 'partial' }, D1)
    expect(r.state.quests.find((x) => x.id === q.id)!.xpEarned).toBe(50)
  })

  it('never grants XP twice for the same quest', () => {
    const s = fresh()
    const q = dailyOf(s)
    const r1 = completeQuest(s, q.id, { status: 'done' }, D1)
    const r2 = completeQuest(r1.state, q.id, { status: 'done' }, D1)
    expect(r2.state).toBe(r1.state)
    expect(r2.effects).toHaveLength(0)
    const r3 = completeQuest(r1.state, q.id, { status: 'skipped' }, D1)
    expect(r3.state).toBe(r1.state)
  })

  it('"not done" gives nothing, does not punish, and can be reopened', () => {
    const s = fresh()
    const q = dailyOf(s)
    const r = completeQuest(s, q.id, { status: 'skipped' }, D1)
    expect(r.state.profile.totalXp).toBe(0)
    expect(r.state.streak.current).toBe(0)
    expect(r.state.history).toHaveLength(0)
    const back = reopenQuest(r.state, q.id, D1)
    expect(back.state.quests.find((x) => x.id === q.id)!.status).toBe('open')
    const later = completeQuest(back.state, q.id, { status: 'done' }, D1)
    expect(later.state.profile.totalXp).toBeGreaterThan(0)
  })

  it('levels up and reports it', () => {
    const s = fresh()
    const r = completeQuest(s, mainOf(s).id, { status: 'done' }, D1) // 100 XP
    expect(levelInfo(r.state.profile.totalXp).level).toBe(2)
    expect(r.effects).toContainEqual({ type: 'level', level: 2, title: 'Первые действия' })
    expect(r.state.achievements.map((a) => a.id)).toEqual(expect.arrayContaining(['first_step', 'level_up']))
  })

  it('damages the boss: normal -10, main -20', () => {
    const s = fresh()
    const normal = today(s).find((q) => !q.isMain && q.difficulty === 'normal')!
    expect(bossDamage(normal, 'done')).toBe(10)
    expect(bossDamage(mainOf(s), 'done')).toBe(20)
    const r = completeQuest(s, normal.id, { status: 'done' }, D1)
    expect(r.state.boss!.hp).toBe(90)
  })

  it('defeats the boss at 0 HP, grants reward and spawns the next one', () => {
    let s = fresh()
    s = { ...s, boss: { ...s.boss!, hp: 15 } }
    const r = completeQuest(s, mainOf(s).id, { status: 'done' }, D1)
    expect(r.state.defeatedBosses).toHaveLength(1)
    expect(r.state.boss!.name).toBe('Страх продаж')
    expect(r.state.boss!.hp).toBe(150)
    expect(r.effects.some((e) => e.type === 'bossDefeated')).toBe(true)
    expect(r.state.achievements.some((a) => a.id === 'first_boss')).toBe(true)
    // 100 за квест + 100 за босса
    expect(r.state.profile.totalXp).toBe(200)
  })

  it('updates quest-based goal progress', () => {
    const s = fresh()
    const q = today(s).find((x) => x.goalId === 'goal-brand')!
    const r = completeQuest(s, q.id, { status: 'done' }, D1)
    const goal = r.state.goals.find((g) => g.id === 'goal-brand')!
    expect(goalCurrent(r.state, goal, '2026-10-08')).toBe(1)
    expect(goal.milestones[0].doneAt).toBeDefined() // «Первое контент-действие»
  })
})

describe('streak', () => {
  it('grows on consecutive days and survives a gap with a shield', () => {
    let st = { current: 0, best: 0, shields: 0, totalActiveDays: 0 }
    for (let i = 1; i <= 7; i++) st = registerActivity(st, `2026-10-0${i}`).streak
    expect(st).toMatchObject({ current: 7, best: 7, shields: 1 })
    const r = registerActivity(st, '2026-10-09') // пропущено 8-е
    expect(r.shieldUsed).toBe(true)
    expect(r.streak).toMatchObject({ current: 8, shields: 0 })
  })

  it('restarts gently without shields but keeps best and total days', () => {
    const st = registerActivity({ current: 5, best: 5, shields: 0, totalActiveDays: 5, lastActiveDate: '2026-10-01' }, '2026-10-05').streak
    expect(st).toMatchObject({ current: 1, best: 5, totalActiveDays: 6 })
    expect(displayStreak({ ...st }, '2026-10-05')).toBe(1)
    expect(displayStreak(st, '2026-10-08')).toBe(0)
  })

  it('counts only one activity per day', () => {
    let s = fresh()
    for (const q of today(s).slice(0, 3)) s = completeQuest(s, q.id, { status: 'done' }, D1).state
    expect(s.streak).toMatchObject({ current: 1, totalActiveDays: 1 })
  })
})

describe('income and goals', () => {
  it('adds real income, updates monthly total and income goal milestones', () => {
    const s = fresh()
    const r = addIncome(s, { amount: 12000, source: 'Интеграция с брендом', date: '2026-10-08' }, D1)
    expect(monthlyIncome(r.state, '2026-10-08')).toBe(12000)
    const goal = r.state.goals.find((g) => g.id === 'goal-income')!
    expect(goalProgress(r.state, goal, '2026-10-08')).toBeCloseTo(0.12)
    const done = goal.milestones.filter((m) => m.doneAt).map((m) => m.title)
    expect(done).toEqual(['Первый доход', '10 000 ₽ за месяц'])
    expect(r.state.achievements.some((a) => a.id === 'first_money')).toBe(true)
    // milestones дают XP: 2 × 50
    expect(r.state.profile.totalXp).toBe(100)
  })

  it('ignores invalid amounts and income from other months', () => {
    const s = fresh()
    expect(addIncome(s, { amount: 0, source: 'x', date: '2026-10-08' }, D1).state).toBe(s)
    const r = addIncome(s, { amount: 5000, source: 'x', date: '2026-09-30' }, D1)
    expect(monthlyIncome(r.state, '2026-10-08')).toBe(0)
  })

  it('creates a custom goal with manual milestones', () => {
    const s = fresh()
    const r = createGoal(
      s,
      {
        title: 'Съездить в путешествие',
        emoji: '🌍',
        outcome: 'Первая самостоятельная поездка',
        stat: 'freedom',
        metric: { source: 'milestones', unit: 'шагов', target: 0 },
        milestones: [{ title: 'Выбрать город' }, { title: 'Купить билеты' }],
      },
      D1,
    )
    const goal = r.state.goals.at(-1)!
    const r2 = completeMilestone(r.state, goal.id, goal.milestones[0].id, D1)
    const g2 = r2.state.goals.at(-1)!
    expect(goalProgress(r2.state, g2, '2026-10-08')).toBe(0.5)
    expect(r2.state.profile.statXp.freedom).toBe(20)
    // повторно — ничего
    expect(completeMilestone(r2.state, goal.id, goal.milestones[0].id, D1).state).toBe(r2.state)
  })
})

describe('manual quests', () => {
  it('adds a custom quest and can make it the main one', () => {
    const s = fresh()
    const r = addQuest(s, { title: 'Подать документы', description: '', stat: 'freedom', difficulty: 'hard', isMain: true }, D1)
    const mains = today(r.state).filter((q) => q.isMain)
    expect(mains).toHaveLength(1)
    expect(mains[0].title).toBe('Подать документы')
  })

  it('does not allow editing a completed quest', () => {
    const s = fresh()
    const q = dailyOf(s)
    const done = completeQuest(s, q.id, { status: 'done' }, D1).state
    const r = updateQuest(done, q.id, { title: 'Другое', description: '', stat: 'energy', difficulty: 'epic' }, D1)
    expect(r.state).toBe(done)
  })
})

describe('storage migration', () => {
  it('accepts current data and rejects garbage', () => {
    const s = fresh()
    expect(migrate(JSON.parse(JSON.stringify(s)))).toEqual(s)
    expect(migrate(null)).toBeNull()
    expect(migrate({ foo: 1 })).toBeNull()
  })
})
