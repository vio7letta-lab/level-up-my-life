/**
 * QA-чеклист игрового цикла: каждый блок — пункт из списка проверки.
 * Квесты создаются вручную с нужной сложностью, чтобы числа были точными.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageAdapter } from '../storage/localStorageAdapter'
import type { Difficulty, GameState, StatKey } from '../types'
import { addIncome, addQuest, completeQuest, reopenQuest, startDay } from './engine'
import { goalCurrent, goalProgress, monthlyIncome } from './goals'
import { createInitialState } from './initialState'
import { levelInfo } from './levels'
import { displayStreak } from './streak'

const at = (d: string, h = 12) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`)
const NOW = at('2026-10-08')

/** Новая игра без сгенерированных квестов — только то, что добавим сами */
function blank(now = NOW): GameState {
  return { ...createInitialState(now), lastGeneratedDate: '2026-10-08' }
}

function withQuest(s: GameState, difficulty: Difficulty, opts: { isMain?: boolean; stat?: StatKey; goalId?: string; title?: string } = {}, now = NOW) {
  const r = addQuest(s, { title: opts.title ?? `Квест ${difficulty}`, description: '', stat: opts.stat ?? 'career', difficulty, isMain: opts.isMain, goalId: opts.goalId }, now)
  return { state: r.state, id: r.state.quests.at(-1)!.id }
}

describe('1. XP нельзя получить дважды за один квест', () => {
  it('повторное «Выполнить» ничего не меняет — ни XP, ни историю, ни босса', () => {
    const { state, id } = withQuest(blank(), 'normal')
    const once = completeQuest(state, id, { status: 'done' }, NOW).state
    const twice = completeQuest(once, id, { status: 'done' }, NOW)
    const asPartial = completeQuest(once, id, { status: 'partial' }, NOW)
    const asSkipped = completeQuest(once, id, { status: 'skipped' }, NOW)
    for (const r of [twice, asPartial, asSkipped]) {
      expect(r.state).toBe(once)
      expect(r.effects).toEqual([])
    }
    expect(reopenQuest(once, id, NOW).state).toBe(once) // выполненный нельзя «вернуть» и закрыть снова
  })

  it('частично выполненный квест тоже нельзя добрать повторно', () => {
    const { state, id } = withQuest(blank(), 'normal')
    const partial = completeQuest(state, id, { status: 'partial' }, NOW).state
    expect(completeQuest(partial, id, { status: 'done' }, NOW).state).toBe(partial)
  })
})

describe('2. После выполнения обновляется всё состояние', () => {
  it('XP, level, stat XP, goal, boss HP, streak, completed, history, achievements', () => {
    const { state, id } = withQuest(blank(), 'big', { isMain: true, stat: 'media', goalId: 'goal-brand' })
    const r = completeQuest(state, id, { status: 'done', note: 'Опубликовала Reels' }, NOW)
    const s = r.state
    const q = s.quests.find((x) => x.id === id)!

    expect(q).toMatchObject({ status: 'done', xpEarned: 100, goldEarned: 50, statXpEarned: 40, note: 'Опубликовала Reels' })
    // 100 за квест + 50 за milestone «Первое контент-действие»
    expect(s.profile.totalXp).toBe(150)
    expect(levelInfo(s.profile.totalXp).level).toBe(3)
    expect(s.profile.statXp.media).toBe(40 + 20)
    const goal = s.goals.find((g) => g.id === 'goal-brand')!
    expect(goalCurrent(s, goal, '2026-10-08')).toBe(1)
    expect(s.boss!.hp).toBe(80)
    expect(s.streak).toMatchObject({ current: 1, best: 1, lastActiveDate: '2026-10-08', totalActiveDays: 1 })
    expect(s.quests.filter((x) => x.status === 'done')).toHaveLength(1)
    expect(s.history.filter((h) => h.type === 'quest')).toHaveLength(1)
    expect(s.achievements.map((a) => a.id).sort()).toEqual(['first_step', 'level_up'])
    expect(s.lastActivityDate).toBe('2026-10-08')
  })
})

describe('3. Данные сохраняются после перезагрузки', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size
      },
    } as Storage
  })

  it('сохранение → загрузка возвращает то же самое состояние', async () => {
    let s = startDay(createInitialState(NOW), NOW)
    s = completeQuest(s, s.quests[0].id, { status: 'done', note: 'тест' }, NOW).state
    s = addIncome(s, { amount: 5000, source: 'Клиент', date: '2026-10-08' }, NOW).state
    const storage = new LocalStorageAdapter()
    await storage.save(s)
    const loaded = await new LocalStorageAdapter().load()
    expect(loaded).toEqual(s)
  })

  it('повреждённые данные не ломают игру и откладываются в резервный ключ', async () => {
    localStorage.setItem('lumyl:game', '{broken')
    expect(await new LocalStorageAdapter().load()).toBeNull()
    expect(localStorage.length).toBe(2)
  })
})

describe('4. «Не сделано» не даёт XP и не ломает streak', () => {
  it('0 XP, 0 gold, серия на месте, босс не тронут', () => {
    let s = blank(at('2026-10-07'))
    const y = withQuest(s, 'normal', {}, at('2026-10-07'))
    s = completeQuest(y.state, y.id, { status: 'done' }, at('2026-10-07')).state // вчера — серия 1
    s = { ...s, lastGeneratedDate: '2026-10-08' }
    const t = withQuest(s, 'normal')
    const before = t.state
    const r = completeQuest(before, t.id, { status: 'skipped', note: 'должно потеряться' }, NOW)
    expect(r.state.profile).toEqual(before.profile)
    expect(r.state.boss).toEqual(before.boss)
    expect(r.state.streak).toEqual(before.streak)
    expect(displayStreak(r.state.streak, '2026-10-08')).toBe(1)
    expect(r.state.history).toHaveLength(before.history.length)
    expect(r.state.quests.find((q) => q.id === t.id)!.note).toBeUndefined()
  })
})

describe('5–6. Частично — ровно 50%, полностью — 100%', () => {
  const cases: [Difficulty, boolean, number][] = [
    ['tiny', false, 5],
    ['normal', false, 10],
    ['hard', false, 25],
    ['big', false, 50],
    ['epic', false, 100],
    ['big', true, 100],
  ]
  for (const [difficulty, isMain, xp] of cases) {
    it(`${difficulty}${isMain ? ' (главный)' : ''}: ${xp} XP / ${xp / 2} XP`, () => {
      const { state, id } = withQuest(blank(), difficulty, { isMain })
      const full = completeQuest(state, id, { status: 'done' }, NOW).state.quests.find((q) => q.id === id)!
      const half = completeQuest(state, id, { status: 'partial' }, NOW).state.quests.find((q) => q.id === id)!
      expect(full.xpEarned).toBe(xp)
      expect(half.xpEarned).toBe(full.xpEarned / 2)
      expect(half.goldEarned).toBe(full.goldEarned / 2)
      expect(half.statXpEarned).toBe(full.statXpEarned / 2)
    })
  }
})

describe('7. Повторное открытие приложения не дублирует квесты и награды', () => {
  it('startDay в тот же день — без новых квестов и без повторных наград', () => {
    let s = startDay(createInitialState(NOW), NOW)
    s = completeQuest(s, s.quests[0].id, { status: 'done' }, NOW).state
    const reopened = startDay(JSON.parse(JSON.stringify(s)), at('2026-10-08', 23))
    expect(reopened.quests).toHaveLength(6)
    expect(reopened.profile).toEqual(s.profile)
    expect(reopened.quests[0].status).toBe('done')
  })

  it('на следующий день — новые квесты, вчерашние награды не трогаются', () => {
    let s = startDay(createInitialState(NOW), NOW)
    s = completeQuest(s, s.quests[0].id, { status: 'done' }, NOW).state
    const next = startDay(s, at('2026-10-09', 8))
    expect(next.quests.filter((q) => q.date === '2026-10-09')).toHaveLength(6)
    expect(next.quests.filter((q) => q.date === '2026-10-09').every((q) => q.status === 'open' && q.xpEarned === 0)).toBe(true)
    expect(next.profile).toEqual(s.profile)
  })
})

describe('8. Level Up', () => {
  it('49 XP — Level 1, ровно 50 — Level 2, остаток переносится', () => {
    let s = blank()
    s = { ...s, profile: { ...s.profile, totalXp: 45 }, achievements: [{ id: 'first_step', unlockedAt: '' }] }
    const q = withQuest(s, 'tiny')
    const r = completeQuest(q.state, q.id, { status: 'done' }, NOW)
    expect(r.state.profile.totalXp).toBe(50)
    expect(levelInfo(50)).toMatchObject({ level: 2, xpInLevel: 0, xpToNext: 75 })
    expect(r.effects).toContainEqual({ type: 'level', level: 2, title: 'Первые действия' })
  })

  it('прыжок через несколько уровней — каждый уровень в истории', () => {
    let s = blank()
    s = { ...s, achievements: [{ id: 'first_step', unlockedAt: '' }, { id: 'level_up', unlockedAt: '' }] }
    const a = withQuest(s, 'epic', { isMain: true }) // 200 XP → Level 3 (50 + 75 = 125)
    const r = completeQuest(a.state, a.id, { status: 'done' }, NOW)
    expect(levelInfo(r.state.profile.totalXp).level).toBe(3)
    expect(r.state.history.filter((h) => h.type === 'level').map((h) => h.title)).toEqual(['Level 2', 'Level 3'])
    expect(r.effects.filter((e) => e.type === 'level')).toEqual([{ type: 'level', level: 3, title: 'Дисциплина' }])
  })
})

describe('9. First Step', () => {
  it('открывается первым выполненным квестом, ровно один раз', () => {
    const a = withQuest(blank(), 'tiny')
    const r1 = completeQuest(a.state, a.id, { status: 'partial' }, NOW)
    expect(r1.effects).toContainEqual({ type: 'achievement', id: 'first_step' })
    const b = withQuest(r1.state, 'tiny')
    const r2 = completeQuest(b.state, b.id, { status: 'done' }, NOW)
    expect(r2.state.achievements.filter((x) => x.id === 'first_step')).toHaveLength(1)
    expect(r2.effects.some((e) => e.type === 'achievement')).toBe(false)
  })

  it('«Не сделано» First Step не открывает', () => {
    const a = withQuest(blank(), 'tiny')
    expect(completeQuest(a.state, a.id, { status: 'skipped' }, NOW).state.achievements).toEqual([])
  })
})

describe('10. Реальный доход → цель 100 000 ₽', () => {
  it('доход за месяц складывается, цель и milestones обновляются сами', () => {
    let s = blank()
    s = addIncome(s, { amount: 7500, source: 'Клиент A', date: '2026-10-02' }, NOW).state
    s = addIncome(s, { amount: 20000, source: 'Клиент B', date: '2026-10-08' }, NOW).state
    const goal = s.goals.find((g) => g.id === 'goal-income')!
    expect(monthlyIncome(s, '2026-10-08')).toBe(27500)
    expect(goalProgress(s, goal, '2026-10-08')).toBeCloseTo(0.275)
    expect(goal.milestones.filter((m) => m.doneAt).map((m) => m.title)).toEqual(['Первый доход', '10 000 ₽ за месяц'])
    expect(s.history.filter((h) => h.type === 'income').map((h) => h.result!.replace(/\s/g, ' '))).toEqual(['+7 500 ₽', '+20 000 ₽'])
    // в новом месяце цель считает заново, достигнутые milestones остаются
    expect(goalCurrent(s, goal, '2026-11-01')).toBe(0)
  })

  it('доход не начисляет XP сам по себе (только milestones)', () => {
    let s = blank()
    s = addIncome(s, { amount: 100, source: 'x', date: '2026-10-08' }, NOW).state // «Первый доход» +50
    s = addIncome(s, { amount: 100, source: 'x', date: '2026-10-08' }, NOW).state
    expect(s.profile.totalXp).toBe(50)
  })
})

describe('11. Урон боссу', () => {
  it('маленький −5, обычный −10, главный −20', () => {
    const hp = (d: Difficulty, isMain = false) => {
      const q = withQuest(blank(), d, { isMain })
      return completeQuest(q.state, q.id, { status: 'done' }, NOW).state.boss!.hp
    }
    expect(100 - hp('tiny')).toBe(5)
    expect(100 - hp('normal')).toBe(10)
    expect(100 - hp('big', true)).toBe(20)
    expect(100 - hp('tiny', true)).toBe(20) // главный — минимум −20
  })

  it('частично — половина урона (округление вверх), «не сделано» — 0', () => {
    const q = withQuest(blank(), 'tiny')
    expect(completeQuest(q.state, q.id, { status: 'partial' }, NOW).state.boss!.hp).toBe(97)
    expect(completeQuest(q.state, q.id, { status: 'skipped' }, NOW).state.boss!.hp).toBe(100)
  })
})

describe('12. History', () => {
  it('запись: дата + действие + результат «Что получилось?» + XP + характеристика', () => {
    const q = withQuest(blank(), 'hard', { stat: 'finance', title: 'Отправить 5 предложений клиентам' })
    const r = completeQuest(q.state, q.id, { status: 'partial', note: '  Отправила 3 из 5, один ответ  ' }, NOW)
    expect(r.state.history.find((h) => h.type === 'quest')).toMatchObject({
      date: '2026-10-08',
      title: 'Отправить 5 предложений клиентам',
      result: 'Сделано частично · Отправила 3 из 5, один ответ',
      xp: 12.5,
      stat: 'finance',
      statXp: 5,
      questId: q.id,
    })
  })

  it('без заметки — просто статус', () => {
    const q = withQuest(blank(), 'normal')
    const r = completeQuest(q.state, q.id, { status: 'done', note: '   ' }, NOW)
    expect(r.state.history[0].result).toBe('Сделано полностью')
    expect(r.state.quests.find((x) => x.id === q.id)!.note).toBeUndefined()
  })
})
