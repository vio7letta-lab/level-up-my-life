/**
 * Задачи: импорт из заметок, Inbox / Today / Backlog, автооценка, связь с целями.
 * Номера в describe — пункты чеклиста проверки.
 */
import { describe, expect, it } from 'vitest'
import { migrate } from '../storage/migrations'
import { ManualTextSource } from '../sources/ManualTextSource'
import { backlogTasks, homeQuests, inboxTasks, todayQuests } from '../store/selectors'
import type { GameState } from '../types'
import { classifyDifficulty, classifyTask } from './classify'
import { addDays } from './dates'
import { addQuest, completeQuest, deleteQuest, importTasks, planTask, setInProgress, setTemplateQuests, startDay, updateQuest } from './engine'
import { goalCurrent } from './goals'
import { createInitialState } from './initialState'
import { extractDate, fingerprint, parseNotes } from './notesParser'

const at = (d: string, h = 12) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`)
const NOW = at('2026-10-08')
const TODAY = '2026-10-08'

/** Чистая игра без шаблонных квестов — только реальные задачи */
function blank(): GameState {
  const s = createInitialState(NOW)
  return { ...s, settings: { ...s.settings, templateQuests: false }, lastGeneratedDate: TODAY }
}

const NOTE = `План задач:
Книга спроси маму, про касдевы

Учёба
○ Лабы ПАХТ
○ Лаба ВМС спросить значения у Сажнева
○ Лаба материаловедение
○ Коллоквиум материаловедение
○ Лаба физхимия
✓ Лаба теор
✓ Написать миролюбовой

Работа
○ Вернуться к работе
○ Добавить закупщика
○ Выписать всё что хочет Лера и составить КП
○ Отправить резюме и сопроводительные письма hh.ru 50–100 штук в сумме
✓ Написать Владе про рекламу
✓ Выставить Леру как нового блогера

Разборочки — находочки
○ VPN разобраться
○ Источники дохода разобраться
○ Разобраться как могу зарабатывать в менеджерстве
...`

const TEN = `Учёба
○ Лаба ВМС
○ Коллоквиум материаловедение
○ Лаба физхимия
Работа
○ Добавить закупщика
○ Составить КП для Леры
○ Отправить 50 резюме
Жизнь
○ Танцевальная тренировка
○ Созвониться с Машей
○ Купить билеты
○ Заработать 5000 ₽`

const imp = (s: GameState, text: string, now = NOW) => importTasks(s, parseNotes(text, now), now)

describe('Парсер заметок', () => {
  it('разбирает реальную заметку: маркеры, заголовки, выполненные, «...»', () => {
    const tasks = parseNotes(NOTE, NOW)
    expect(tasks).toHaveLength(17)
    expect(tasks[0]).toMatchObject({ title: 'Книга спроси маму, про касдевы', context: 'План задач', done: false })
    const ctx = (c: string) => tasks.filter((t) => t.context === c)
    expect(ctx('Учёба')).toHaveLength(7)
    expect(ctx('Работа')).toHaveLength(6)
    expect(ctx('Разборочки — находочки')).toHaveLength(3)
    expect(tasks.filter((t) => t.done).map((t) => t.title)).toEqual(['Лаба теор', 'Написать миролюбовой', 'Написать Владе про рекламу', 'Выставить Леру как нового блогера'])
  })

  it('5. пустые строки, пробелы и мусорные строки игнорируются', () => {
    expect(parseNotes('\n\n   \n○ Лаба\n\n\n...\n…\n', NOW).map((t) => t.title)).toEqual(['Лаба'])
    expect(parseNotes('', NOW)).toEqual([])
  })

  it('6. текст без маркеров и заголовков — каждая строка задача', () => {
    const tasks = parseNotes('Купить билеты\nСозвониться с Машей\nЛаба ВМС', NOW)
    expect(tasks.map((t) => t.title)).toEqual(['Купить билеты', 'Созвониться с Машей', 'Лаба ВМС'])
    expect(tasks.every((t) => !t.context && !t.done)).toBe(true)
  })

  it('понимает разные маркеры: □ ☐ • - [ ] и ☑ ✔ [x]', () => {
    const tasks = parseNotes('□ a1\n☐ a2\n• a3\n- a4\n[ ] a5\n☑ b1\n✔ b2\n[x] b3\n- [ ] a6', NOW)
    expect(tasks.filter((t) => !t.done).map((t) => t.title)).toEqual(['a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
    expect(tasks.filter((t) => t.done).map((t) => t.title)).toEqual(['b1', 'b2', 'b3'])
  })

  it('распознаёт даты и убирает их из текста', () => {
    expect(extractDate('Коллоквиум до 20.10', NOW)).toEqual({ title: 'Коллоквиум', dueDate: '2026-10-20' })
    expect(extractDate('Сдать лабу 15 октября', NOW)).toEqual({ title: 'Сдать лабу', dueDate: '2026-10-15' })
    expect(extractDate('Позвонить завтра', NOW)).toEqual({ title: 'Позвонить', dueDate: '2026-10-09' })
    expect(extractDate('Экзамен 15.01', NOW).dueDate).toBe('2027-01-15') // январь следующего года
    expect(extractDate('Отправить 50–100 резюме', NOW)).toEqual({ title: 'Отправить 50–100 резюме' })
    expect(extractDate('Заработать 5000 ₽', NOW).dueDate).toBeUndefined()
  })

  it('fingerprint стабилен: регистр, ё/е, пунктуация и маркеры не важны; контекст важен', () => {
    expect(fingerprint('Лаба ВМС — спросить', 'Учёба')).toBe(fingerprint('лаба вмс спросить', 'Учеба'))
    expect(fingerprint('Лаба', 'Учёба')).not.toBe(fingerprint('Лаба', 'Работа'))
  })
})

describe('Автоматическая оценка', () => {
  const goals = createInitialState(NOW).goals
  const c = (title: string, ctx?: string) => classifyTask(title, ctx, goals)

  it('категории по примерам', () => {
    expect(c('Отправить резюме').stat).toBe('career')
    expect(c('Сделать КП').stat).toBe('career')
    expect(c('Лаба ВМС').stat).toBe('knowledge')
    expect(c('Коллоквиум').stat).toBe('knowledge')
    expect(c('Танцевальная тренировка').stat).toBe('energy')
    expect(c('Созвониться с Машей').stat).toBe('social')
    expect(c('Купить билеты').stat).toBe('freedom')
    expect(c('Заработать 5000 ₽').stat).toBe('finance')
    expect(c('Опубликовать пост').stat).toBe('media')
    expect(c('Вернуться к работе', 'Работа').stat).toBe('career')
    expect(c('Добавить закупщика', 'Работа').stat).toBe('career')
    expect(c('VPN разобраться', 'Разборочки — находочки').stat).toBe('freedom')
    expect(c('Источники дохода разобраться').stat).toBe('finance')
  })

  it('сложность по примерам', () => {
    expect(classifyDifficulty('Написать сообщение Владе')).toBe('tiny')
    expect(classifyDifficulty('Отправить 50 резюме')).toBe('big')
    expect(classifyDifficulty('Закрыть лабораторную работу')).toBe('hard')
    expect(classifyDifficulty('Сдать экзамен')).toBe('big')
    expect(classifyDifficulty('Лаба ВМС спросить значения у Сажнева')).toBe('normal')
    expect(classifyDifficulty('Выписать всё что хочет Лера и составить КП')).toBe('hard')
    expect(classifyDifficulty('Добавить закупщика')).toBe('normal')
    expect(classifyDifficulty('Заработать 5000 ₽')).toBe('normal') // сумма — не количество действий
  })

  it('9. связь с целью: учёба → университет, работа → менеджер, танцы → танцы; быт — без цели', () => {
    expect(c('Лаба ВМС').goalId).toBe('goal-uni')
    expect(c('Отправить 10 предложений брендам').goalId).toBe('goal-manager')
    expect(c('Танцевальная тренировка').goalId).toBe('goal-dance')
    expect(c('VPN разобраться').goalId).toBeUndefined()
    expect(c('Написать маме').goalId).toBeUndefined()
  })
})

describe('Импорт', () => {
  it('1. импорт 10 задач → в Inbox, с авто-оценкой', () => {
    const r = imp(blank(), TEN)
    expect(r.summary).toEqual({ added: 10, archived: 0, completed: 0, duplicates: 0, renamed: 0 })
    const inbox = inboxTasks(r.state)
    expect(inbox).toHaveLength(10)
    expect(inbox.every((q) => q.source === 'notes' && q.sourceId && q.auto && q.status === 'open' && q.xpEarned === 0)).toBe(true)
    expect(todayQuests(r.state, TODAY).total).toBe(0) // Inbox не попадает в Today сам
  })

  it('2. повторный импорт тех же 10 задач — дубликатов нет', () => {
    const once = imp(blank(), TEN).state
    const twice = imp(once, TEN)
    expect(twice.summary).toEqual({ added: 0, archived: 0, completed: 0, duplicates: 10, renamed: 0 })
    expect(twice.state.quests).toHaveLength(10)
    // даже если задачи уже разобраны и переименованы
    const planned = planTask(once, once.quests[0].id, TODAY, NOW).state
    expect(imp(planned, TEN).state.quests).toHaveLength(10)
  })

  it('3. выполненная задача при первом импорте — в архив без XP', () => {
    const r = imp(blank(), '○ Лаба ВМС\n✓ Лаба теор')
    expect(r.summary).toMatchObject({ added: 1, archived: 1 })
    const archived = r.state.quests.find((q) => q.title === 'Лаба теор')!
    expect(archived).toMatchObject({ status: 'archived', xpEarned: 0 })
    expect(r.state.profile.totalXp).toBe(0)
    expect(r.state.history).toHaveLength(0)
    expect(r.state.achievements).toHaveLength(0)
  })

  it('3b. активная задача, ставшая ✓ в заметке, закрывается с полной наградой ровно один раз', () => {
    const s1 = imp(blank(), 'Учёба\n○ Лаба физхимия').state
    const r = imp(s1, 'Учёба\n✓ Лаба физхимия')
    expect(r.summary.completed).toBe(1)
    const q = r.state.quests[0]
    expect(q).toMatchObject({ status: 'done', xpEarned: 25 })
    expect(r.state.profile.totalXp).toBeGreaterThanOrEqual(25)
    // ещё раз тот же текст — награды больше нет
    const again = imp(r.state, 'Учёба\n✓ Лаба физхимия')
    expect(again.summary).toEqual({ added: 0, archived: 0, completed: 0, duplicates: 1, renamed: 0 })
    expect(again.state.profile).toEqual(r.state.profile)
  })

  it('4. категории из заголовков заметки', () => {
    const r = imp(blank(), NOTE)
    const by = (title: string) => r.state.quests.find((q) => q.title === title)!
    expect(by('Лабы ПАХТ')).toMatchObject({ context: 'Учёба', stat: 'knowledge', goalId: 'goal-uni' })
    expect(by('Вернуться к работе')).toMatchObject({ context: 'Работа', stat: 'career', goalId: 'goal-manager' })
    expect(by('Отправить резюме и сопроводительные письма hh.ru 50–100 штук в сумме')).toMatchObject({ stat: 'career', difficulty: 'big' })
    expect(r.summary).toEqual({ added: 13, archived: 4, completed: 0, duplicates: 0, renamed: 0 })
  })

  it('задача с датой в тексте минует Inbox и сразу планируется', () => {
    const r = imp(blank(), `○ Лаба ВМС сегодня\n○ Коллоквиум ${addDays(TODAY, 3).split('-').reverse().slice(0, 2).join('.')}`)
    expect(inboxTasks(r.state)).toHaveLength(0)
    expect(todayQuests(r.state, TODAY).active.map((q) => q.title)).toEqual(['Лаба ВМС'])
    expect(backlogTasks(r.state, TODAY).later.map((q) => q.title)).toEqual(['Коллоквиум'])
  })

  it('убранная задача не возвращается при повторном импорте', () => {
    const s1 = imp(blank(), '○ VPN разобраться').state
    const s2 = deleteQuest(s1, s1.quests[0].id).state
    expect(s2.quests[0].status).toBe('archived')
    expect(imp(s2, '○ VPN разобраться').state.quests).toHaveLength(1)
  })

  it('TaskSource: ManualTextSource import и sync идемпотентны', async () => {
    const src = new ManualTextSource(TEN, NOW)
    expect(await src.getTasks()).toHaveLength(10)
    const r1 = await src.import(blank(), NOW)
    const r2 = await src.sync(r1.state, NOW)
    expect(r2.state.quests).toHaveLength(10)
    expect(r2.summary.duplicates).toBe(10)
  })
})

describe('Inbox → Today / Backlog', () => {
  it('разбор: сегодня, завтра, позже, без даты', () => {
    let s = imp(blank(), '○ a\n○ b\n○ c\n○ d').state
    const [a, b, c, d] = s.quests
    s = planTask(s, a.id, TODAY, NOW).state
    s = planTask(s, b.id, addDays(TODAY, 1), NOW).state
    s = planTask(s, c.id, addDays(TODAY, 5), NOW).state
    s = planTask(s, d.id, null, NOW).state
    expect(inboxTasks(s)).toHaveLength(0)
    expect(todayQuests(s, TODAY).active.map((q) => q.title)).toEqual(['a'])
    const bl = backlogTasks(s, TODAY)
    expect([bl.tomorrow, bl.later, bl.undated].map((l) => l.map((q) => q.title))).toEqual([['b'], ['c'], ['d']])
    // назавтра «b» сама переезжает в Today
    expect(todayQuests(startDay(s, at('2026-10-09')), '2026-10-09').active.map((q) => q.title).sort()).toEqual(['a', 'b'])
  })

  it('невыполненная реальная задача переносится, «не сделано» назавтра снова новая', () => {
    let s = blank()
    s = addQuest(s, { title: 'Лаба', description: '', stat: 'knowledge', difficulty: 'hard' }, NOW).state
    const id = s.quests[0].id
    s = completeQuest(s, id, { status: 'skipped' }, NOW).state
    const next = startDay(s, at('2026-10-09'))
    const q = next.quests.find((x) => x.id === id)!
    expect(q.status).toBe('open')
    expect(todayQuests(next, '2026-10-09').active).toContainEqual(q)
    expect(next.profile.totalXp).toBe(0) // без штрафа и без награды
  })

  it('«в работе» — без награды, видно в Today первым после главного', () => {
    let s = blank()
    s = addQuest(s, { title: 'A', description: '', stat: 'career', difficulty: 'epic' }, NOW).state
    s = addQuest(s, { title: 'B', description: '', stat: 'career', difficulty: 'tiny' }, NOW).state
    s = setInProgress(s, s.quests[1].id, true, NOW).state
    expect(s.quests[1].status).toBe('in_progress')
    expect(s.profile.totalXp).toBe(0)
    expect(todayQuests(s, TODAY).active[0].title).toBe('B')
    const done = completeQuest(s, s.quests[1].id, { status: 'done' }, NOW).state
    expect(done.quests[1].status).toBe('done')
  })

  it('Home показывает не больше 4 задач + главный, остальное — «ещё N»', () => {
    let s = blank()
    for (let i = 0; i < 9; i++) s = addQuest(s, { title: `T${i}`, description: '', stat: (['career', 'knowledge', 'energy'] as const)[i % 3], difficulty: 'normal' }, NOW).state
    s = addQuest(s, { title: 'Main', description: '', stat: 'career', difficulty: 'big', isMain: true }, NOW).state
    const h = homeQuests(s, TODAY)
    expect(h.mains.map((q) => q.title)).toEqual(['Main'])
    expect(h.picked).toHaveLength(4)
    expect(new Set(h.picked.slice(0, 3).map((q) => q.stat)).size).toBe(3) // разные направления
    expect(h.hidden).toBe(5)
  })
})

describe('Шаблонные квесты', () => {
  const withReal = (n: number) => {
    let s: GameState = { ...createInitialState(NOW), lastGeneratedDate: '2026-10-07' }
    for (let i = 0; i < n; i++) s = addQuest(s, { title: `R${i}`, description: '', stat: 'career', difficulty: 'normal' }, at('2026-10-07')).state
    return startDay(s, NOW)
  }
  const generated = (s: GameState, day = TODAY) => s.quests.filter((q) => q.source === 'generated' && q.dueDate === day)

  it('реальных задач 3+ → только предложение главного квеста', () => {
    expect(generated(withReal(3)).map((q) => q.isMain)).toEqual([true])
  })
  it('реальных задач меньше 3 → добор шаблонами до 4', () => {
    expect(generated(withReal(1)).filter((q) => !q.isMain)).toHaveLength(3)
    expect(generated(withReal(0)).filter((q) => !q.isMain)).toHaveLength(4)
  })
  it('свой главный квест → шаблонный главный не предлагается', () => {
    let s: GameState = { ...createInitialState(NOW), lastGeneratedDate: '2026-10-07' }
    s = addQuest(s, { title: 'Мой главный', description: '', stat: 'career', difficulty: 'big', isMain: true, dueDate: TODAY }, at('2026-10-07')).state
    expect(generated(startDay(s, NOW)).some((q) => q.isMain)).toBe(false)
  })
  it('когда реальных задач на сегодня стало 3+, нетронутые шаблонные скрываются из Today', () => {
    let s = startDay(createInitialState(NOW), NOW)
    expect(todayQuests(s, TODAY).active.filter((q) => q.source === 'generated')).toHaveLength(4)
    for (let i = 0; i < 3; i++) s = addQuest(s, { title: `R${i}`, description: '', stat: 'career', difficulty: 'normal' }, NOW).state
    const t = todayQuests(s, TODAY)
    expect(t.active.map((q) => q.title)).toEqual(expect.arrayContaining(['R0', 'R1', 'R2']))
    expect(t.active.filter((q) => q.source === 'generated')).toHaveLength(0)
    expect(t.mains.filter((q) => q.source === 'generated')).toHaveLength(1) // главный остаётся предложением
  })

  it('переключатель: выключение убирает нетронутые шаблонные, новые не создаются', () => {
    const s = startDay(createInitialState(NOW), NOW)
    const done = completeQuest(s, generated(s)[0].id, { status: 'done' }, NOW).state
    const off = setTemplateQuests(done, false, NOW).state
    expect(generated(off)).toHaveLength(1) // выполненный остался — это история
    expect(generated(startDay(off, at('2026-10-09')), '2026-10-09')).toHaveLength(0)
    expect(off.profile).toEqual(done.profile)
    const on = setTemplateQuests(off, true, NOW).state
    expect(generated(on).length).toBeGreaterThan(1)
  })
})

describe('Выполнение задачи из заметки (7–14)', () => {
  it('XP, GOLD, характеристика, цель, босс, History — один раз', () => {
    let s = imp(blank(), 'Учёба\n○ Лаба материаловедение').state
    const id = s.quests[0].id
    s = planTask(s, id, TODAY, NOW).state
    const r = completeQuest(s, id, { status: 'done', note: 'Сдала, 5/5' }, NOW)
    const st = r.state
    expect(st.quests[0]).toMatchObject({ status: 'done', xpEarned: 25, goldEarned: 12, statXpEarned: 10, inbox: false })
    expect(st.profile.statXp.knowledge).toBe(10)
    expect(goalCurrent(st, st.goals.find((g) => g.id === 'goal-uni')!, TODAY)).toBe(1)
    expect(st.boss!.hp).toBe(85)
    expect(st.history.find((h) => h.type === 'quest')).toMatchObject({ title: 'Лаба материаловедение', result: 'Сделано полностью · Сдала, 5/5', xp: 25, stat: 'knowledge' })
    expect(todayQuests(st, TODAY).active).toHaveLength(0) // исчезла из активных
    expect(todayQuests(st, TODAY).done).toHaveLength(1)
    // 8. двойное выполнение
    const twice = completeQuest(st, id, { status: 'done' }, NOW)
    expect(twice.state).toBe(st)
  })

  it('задачу можно выполнить прямо из Inbox — она перестаёт быть в Inbox', () => {
    const s = imp(blank(), '○ Купить билеты').state
    const r = completeQuest(s, s.quests[0].id, { status: 'done' }, NOW).state
    expect(inboxTasks(r)).toHaveLength(0)
    expect(r.profile.totalXp).toBeGreaterThan(0)
  })

  it('ручная правка категории/сложности/цели снимает отметку «авто» и выводит из Inbox', () => {
    const s = imp(blank(), '○ Книга').state
    const r = updateQuest(s, s.quests[0].id, { title: 'Книга', description: '', stat: 'knowledge', difficulty: 'hard', goalId: 'goal-uni', dueDate: null }, NOW).state
    expect(r.quests[0]).toMatchObject({ stat: 'knowledge', difficulty: 'hard', goalId: 'goal-uni', auto: false, inbox: false, dueDate: undefined })
    expect(backlogTasks(r, TODAY).undated).toHaveLength(1)
  })
})

describe('Миграция данных v1 → v2', () => {
  it('старые квесты становятся задачами без потери прогресса', () => {
    const v1 = {
      ...createInitialState(NOW),
      version: 1,
      settings: { dailyQuestLimit: 5 },
      quests: [
        { id: 'a', templateId: 't-leads', date: '2026-10-07', title: 'Шаблон', description: '', stat: 'career', difficulty: 'normal', isMain: false, status: 'done', completedAt: '2026-10-07T10:00:00.000Z', xpEarned: 10, goldEarned: 5, statXpEarned: 4 },
        { id: 'b', date: '2026-10-07', title: 'Свой', description: '', stat: 'freedom', difficulty: 'hard', isMain: false, status: 'open', xpEarned: 0, goldEarned: 0, statXpEarned: 0 },
      ],
      profile: { ...createInitialState(NOW).profile, totalXp: 123 },
    }
    const s = migrate(JSON.parse(JSON.stringify(v1)))!
    expect(s.version).toBe(2)
    expect(s.settings.templateQuests).toBe(true)
    expect(s.profile.totalXp).toBe(123)
    expect(s.quests[0]).toMatchObject({ id: 'a', dueDate: '2026-10-07', source: 'generated', createdAt: '2026-10-07T10:00:00.000Z' })
    expect(s.quests[1]).toMatchObject({ id: 'b', dueDate: '2026-10-07', source: 'manual' })
    expect('date' in s.quests[0]).toBe(false)
    // свой вчерашний невыполненный квест теперь переносится в Today
    expect(todayQuests(startDay(s, NOW), TODAY).active.map((q) => q.id)).toContain('b')
  })
})
