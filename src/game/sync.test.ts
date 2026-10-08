/**
 * Синхронизация «Apple Notes → LEVEL UP»: заметка — источник задач, RPG — система их выполнения.
 * Номера в describe — пункты чеклиста этапа.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageAdapter } from '../storage/localStorageAdapter'
import { migrate } from '../storage/migrations'
import { ManualTextSource } from '../sources/ManualTextSource'
import { buildImportUrl, MAX_URL_TEXT, readImportHash, ShortcutUrlSource } from '../sources/ShortcutUrlSource'
import { SOURCES } from '../sources/registry'
import { inboxTasks } from '../store/selectors'
import type { GameState } from '../types'
import { completeQuest, importTasks, planTask, updateQuest } from './engine'
import { countPlan, planImport, similarity } from './importer'
import { createInitialState } from './initialState'
import { parseNotes } from './notesParser'

const at = (d: string, h = 12) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`)
const NOW = at('2026-10-08')

function blank(): GameState {
  const s = createInitialState(NOW)
  return { ...s, settings: { ...s.settings, templateQuests: false }, lastGeneratedDate: '2026-10-08' }
}

const sync = (s: GameState, text: string, mode: 'new' | 'all' = 'all', now = NOW) => importTasks(s, parseNotes(text, now), now, 'notes', { mode })
const notes = (s: GameState) => s.quests.filter((q) => q.source === 'notes')
const byTitle = (s: GameState, t: string) => s.quests.find((q) => q.title === t)!

const NOTE = `План задач
☐ Лабы ПАХТ
☐ Спросить значения у Сажнева по ВМС
☐ Отправить 50 резюме
☐ Написать Владе про рекламу
☑ Написать миролюбивой`

describe('1. Первый импорт', () => {
  it('открытые → Inbox, выполненные → архив без XP; предпросмотр совпадает с результатом', () => {
    const s = blank()
    const preview = countPlan(planImport(s, parseNotes(NOTE, NOW)))
    expect(preview).toEqual({ found: 5, new: 4, existing: 0, renamed: 0, complete: 0, archive: 1 })
    const r = sync(s, NOTE)
    expect(r.summary).toEqual({ added: 4, archived: 1, completed: 0, duplicates: 0, renamed: 0 })
    expect(inboxTasks(r.state).map((q) => q.title)).toEqual(['Лабы ПАХТ', 'Спросить значения у Сажнева по ВМС', 'Отправить 50 резюме', 'Написать Владе про рекламу'])
    expect(byTitle(r.state, 'Написать миролюбивой')).toMatchObject({ status: 'archived', xpEarned: 0 })
    expect(r.state.profile.totalXp).toBe(0)
  })

  it('каждая задача проходит общий путь: классификация → сложность → XP → цель', () => {
    const r = sync(blank(), NOTE)
    expect(byTitle(r.state, 'Отправить 50 резюме')).toMatchObject({ stat: 'career', difficulty: 'big', goalId: 'goal-manager', auto: true })
    expect(byTitle(r.state, 'Спросить значения у Сажнева по ВМС')).toMatchObject({ stat: 'knowledge', goalId: 'goal-uni' })
  })
})

describe('2. Повторный импорт без изменений — 10 раз подряд', () => {
  it('ни одной новой задачи, ни одной награды', () => {
    let s = sync(blank(), NOTE).state
    const snapshot = JSON.stringify({ quests: s.quests, profile: s.profile, history: s.history })
    for (let i = 0; i < 10; i++) {
      const r = sync(s, NOTE)
      expect(r.summary).toEqual({ added: 0, archived: 0, completed: 0, duplicates: 5, renamed: 0 })
      s = r.state
    }
    expect(JSON.stringify({ quests: s.quests, profile: s.profile, history: s.history })).toBe(snapshot)
    expect(s.importLog).toHaveLength(11)
  })
})

describe('3. Добавление одной новой задачи', () => {
  it('добавляется только она', () => {
    const s = sync(blank(), NOTE).state
    const r = sync(s, `${NOTE}\n☐ Добавить закупщика`)
    expect(r.summary).toEqual({ added: 1, archived: 0, completed: 0, duplicates: 5, renamed: 0 })
    expect(notes(r.state)).toHaveLength(6)
    expect(byTitle(r.state, 'Добавить закупщика').inbox).toBe(true)
  })
})

describe('4. Удаление задачи из заметки', () => {
  it('задача в RPG остаётся как была — никаких автоудалений', () => {
    let s = sync(blank(), NOTE).state
    s = planTask(s, byTitle(s, 'Лабы ПАХТ').id, '2026-10-08', NOW).state
    const before = byTitle(s, 'Лабы ПАХТ')
    const r = sync(s, NOTE.replace('☐ Лабы ПАХТ\n', ''))
    expect(byTitle(r.state, 'Лабы ПАХТ')).toEqual(before)
    expect(notes(r.state)).toHaveLength(5)
  })
})

describe('5. Изменение текста задачи', () => {
  it('опечатка, уточнение, перестановка слов → та же задача, без дубля', () => {
    const s = sync(blank(), '☐ Лаба физхимя\n☐ Лабы ПАХТ\n☐ Лаба ВМС спросить значения у Сажнева').state
    const ids = notes(s).map((q) => q.id)
    const edited = '☐ Лаба физхимия\n☐ Лабы ПАХТ сдать в пятницу\n☐ Спросить значения у Сажнева по ВМС'
    const plan = planImport(s, parseNotes(edited, NOW))
    expect(plan.map((x) => x.action)).toEqual(['renamed', 'renamed', 'renamed'])
    const r = sync(s, edited)
    expect(r.summary).toMatchObject({ added: 0, renamed: 3 })
    expect(notes(r.state).map((q) => q.id)).toEqual(ids)
    expect(notes(r.state).map((q) => q.title)).toEqual(['Лаба физхимия', 'Лабы ПАХТ сдать в пятницу', 'Спросить значения у Сажнева по ВМС'])
    // и старый, и новый текст теперь узнаются
    expect(sync(r.state, '☐ Лаба физхимя\n☐ Лаба физхимия').summary).toMatchObject({ added: 0, duplicates: 2 })
  })

  it('если задачу переименовали в RPG — название из RPG сохраняется', () => {
    let s = sync(blank(), '☐ Лаба физхимя').state
    const q = notes(s)[0]
    s = updateQuest(s, q.id, { title: 'Физхимия: лаба №3', description: '', stat: 'knowledge', difficulty: 'hard', dueDate: null }, NOW).state
    const r = sync(s, '☐ Лаба физхимия')
    expect(r.summary.renamed).toBe(1)
    expect(notes(r.state)[0].title).toBe('Физхимия: лаба №3')
  })

  it('разные задачи не склеиваются: другой адресат, другой номер, выполненная старая', () => {
    const s = sync(blank(), '☐ Написать Владе про рекламу\n☐ Лаба 1').state
    const r = planImport(s, parseNotes('☐ Написать Лере про рекламу\n☐ Лаба 2', NOW))
    expect(r.map((x) => x.action)).toEqual(['new', 'new'])

    // «Лаба ВМС» уже сдана и пропала из заметки → новая «Лаба ВМС 2» — новая задача
    let s2 = sync(blank(), '☐ Лаба ВМС').state
    s2 = completeQuest(s2, notes(s2)[0].id, { status: 'done' }, NOW).state
    expect(planImport(s2, parseNotes('☐ Лаба ВМС 2', NOW))[0].action).toBe('new')
  })

  it('«это новая задача» в предпросмотре отключает склейку', () => {
    const s = sync(blank(), '☐ Лаба физхимя').state
    const parsed = parseNotes('☐ Лаба физхимия', NOW)
    const r = importTasks(s, parsed, NOW, 'notes', { forceNew: new Set([parsed[0].fingerprint]) })
    expect(r.summary).toMatchObject({ added: 1, renamed: 0 })
    expect(notes(r.state)).toHaveLength(2)
  })

  it('похожесть: примеры', () => {
    expect(similarity('Лаба физхимя', 'Лаба физхимия')).toBeGreaterThanOrEqual(0.75)
    expect(similarity('Написать Владе про рекламу', 'Написать Лере про рекламу')).toBeLessThan(0.75)
    expect(similarity('Лабы ПАХТ', 'Лаба физхимия')).toBeLessThan(0.75)
    expect(similarity('Отправить 50 резюме', 'Отправить 100 резюме')).toBeLessThan(0.75)
  })
})

describe('5b. Задачу перенесли в другой раздел заметки', () => {
  it('тот же текст под другим заголовком — та же задача; ✓ после переноса закрывает её', () => {
    const s = sync(blank(), 'Учёба\n☐ Лабы ПАХТ\n☐ Лаба ВМС').state
    const id = byTitle(s, 'Лабы ПАХТ').id
    const moved = sync(s, 'Учёба\n☐ Лаба ВМС\n\nСегодня\n☐ Лабы ПАХТ')
    expect(moved.summary).toMatchObject({ added: 0, renamed: 1, duplicates: 1 })
    expect(notes(moved.state)).toHaveLength(2)
    expect(byTitle(moved.state, 'Лабы ПАХТ')).toMatchObject({ id, context: 'Сегодня' })
    const ticked = sync(moved.state, 'Учёба\n☐ Лаба ВМС\n\nСегодня\n☑ Лабы ПАХТ')
    expect(ticked.summary.completed).toBe(1)
    // и обратно в старый раздел — тоже не дубль
    expect(sync(ticked.state, 'Учёба\n☐ Лаба ВМС\n☑ Лабы ПАХТ').summary).toMatchObject({ added: 0, completed: 0 })
  })
})

describe('6. Открытая задача → ✓ в заметке', () => {
  it('закрывается с полной наградой ровно один раз, награда идёт через общий движок', () => {
    const s = sync(blank(), NOTE).state
    const ticked = NOTE.replace('☐ Лабы ПАХТ', '☑ Лабы ПАХТ')
    expect(countPlan(planImport(s, parseNotes(ticked, NOW))).complete).toBe(1)
    const r = sync(s, ticked)
    const q = byTitle(r.state, 'Лабы ПАХТ')
    expect(q).toMatchObject({ status: 'done', xpEarned: 25, note: 'Отмечено ✓ в заметке' })
    expect(r.summary.completed).toBe(1)
    expect(r.state.history.filter((h) => h.questId === q.id)).toHaveLength(1)
    expect(r.state.boss!.hp).toBe(85)
    expect(r.state.achievements.map((a) => a.id)).toContain('first_step')
    expect(r.effects.some((e) => e.type === 'quest')).toBe(true)
  })

  it('режим «только новые» не закрывает ✓ и не архивирует', () => {
    const s = sync(blank(), '☐ Лабы ПАХТ').state
    const r = sync(s, '☑ Лабы ПАХТ\n☑ Старое дело\n☐ Новое дело', 'new')
    expect(r.summary).toMatchObject({ added: 1, completed: 0, archived: 0 })
    expect(byTitle(r.state, 'Лабы ПАХТ').status).toBe('open')
    expect(r.state.profile.totalXp).toBe(0)
  })

  it('изменённый текст + ✓ → та же задача закрывается с наградой', () => {
    const s = sync(blank(), '☐ Лаба физхимя').state
    const r = sync(s, '☑ Лаба физхимия')
    expect(r.summary).toMatchObject({ renamed: 1, completed: 1, added: 0 })
    expect(notes(r.state)).toHaveLength(1)
    expect(notes(r.state)[0].status).toBe('done')
  })
})

describe('7. Уже выполненная задача → повторный импорт', () => {
  it('награда не выдаётся повторно — ни для закрытой в RPG, ни для архивной', () => {
    let s = sync(blank(), NOTE).state
    s = completeQuest(s, byTitle(s, 'Отправить 50 резюме').id, { status: 'done' }, NOW).state
    const xp = s.profile.totalXp
    const ticked = NOTE.replace('☐ Отправить 50 резюме', '☑ Отправить 50 резюме')
    for (let i = 0; i < 3; i++) s = sync(s, ticked).state
    expect(s.profile.totalXp).toBe(xp)
    expect(byTitle(s, 'Написать миролюбивой').status).toBe('archived')
    // архивная, даже если в заметке её «раз-отметили», не возвращается
    expect(sync(s, NOTE.replace('☑ Написать миролюбивой', '☐ Написать миролюбивой')).summary).toMatchObject({ added: 0, duplicates: 5 })
    expect(byTitle(s, 'Написать миролюбивой').status).toBe('archived')
  })
})

describe('8–9. Дубликаты: регистр и ё/е', () => {
  it('разный регистр, ё/е, пунктуация, маркеры и лишние пробелы — одна задача', () => {
    const s = sync(blank(), 'Учёба\n☐ Лаба ВМС — спросить значения').state
    const variants = ['Учеба\n○ лаба вмс спросить значения', 'УЧЁБА\n•   ЛАБА ВМС, спросить значения!', 'учёба\n- Лаба ВМС — спросить значения.']
    for (const v of variants) expect(sync(s, v).summary).toMatchObject({ added: 0, duplicates: 1, renamed: 0 })
    // дубли внутри одной заметки схлопываются
    expect(parseNotes('☐ Лаба ВМС\n☐ лаба вмс\n☐ ЛАБА ВМС', NOW)).toHaveLength(1)
  })
})

describe('10–14. Разбор текста', () => {
  it('10. заголовки становятся контекстом и категорией', () => {
    const r = sync(blank(), 'Учёба\n☐ Лабы ПАХТ\n\nРабота\n☐ Вернуться к работе')
    expect(byTitle(r.state, 'Лабы ПАХТ')).toMatchObject({ context: 'Учёба', stat: 'knowledge' })
    expect(byTitle(r.state, 'Вернуться к работе')).toMatchObject({ context: 'Работа', stat: 'career' })
  })

  it('11. пустые строки и «...» игнорируются', () => {
    expect(parseNotes('\n\n☐ a\n\n   \n...\n☐ b\n\n', NOW).map((t) => t.title)).toEqual(['a', 'b'])
  })

  it('12. даты: задача с датой минует Inbox', () => {
    const r = sync(blank(), '☐ Коллоквиум до 20.10\n☐ Лаба завтра')
    expect(byTitle(r.state, 'Коллоквиум')).toMatchObject({ dueDate: '2026-10-20', inbox: false })
    expect(byTitle(r.state, 'Лаба')).toMatchObject({ dueDate: '2026-10-09', inbox: false })
  })

  it('13. без даты — в Inbox; дата в заметке появилась позже — подставляется в существующую', () => {
    let s = sync(blank(), '☐ Коллоквиум').state
    expect(byTitle(s, 'Коллоквиум')).toMatchObject({ inbox: true, dueDate: undefined })
    s = sync(s, '☐ Коллоквиум до 20.10').state // дата убирается из текста → fingerprint тот же
    expect(notes(s)).toHaveLength(1)
  })

  it('14. кириллица, латиница и эмодзи в задачах', () => {
    const t = parseNotes('☐ Сдать ПАХТ 💪\n☐ Написать в hh.ru\n☐ Ёлка и ежевика', NOW)
    expect(t.map((x) => x.title)).toEqual(['Сдать ПАХТ 💪', 'Написать в hh.ru', 'Ёлка и ежевика'])
    expect(sync(sync(blank(), 'Ёлка и ежевика').state, 'елка и ежевика').summary.duplicates).toBe(1)
  })
})

describe('15. Большой список', () => {
  it('500 задач: импорт и повторный импорт без дублей, быстро', () => {
    const text = Array.from({ length: 500 }, (_, i) => `☐ Задача номер ${i} про проект ${i % 7}`).join('\n')
    const t0 = performance.now()
    const s = sync(blank(), text).state
    const r = sync(s, `${text}\n☐ Ещё одна`)
    expect(notes(s)).toHaveLength(500)
    expect(r.summary).toMatchObject({ added: 1, duplicates: 500 })
    expect(performance.now() - t0).toBeLessThan(3000)
  })
})

describe('16. Импорт после перезагрузки', () => {
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

  it('fingerprints и журнал переживают сохранение → загрузку', async () => {
    const s = sync(blank(), NOTE).state
    await new LocalStorageAdapter().save(s)
    const loaded = (await new LocalStorageAdapter().load())!
    expect(loaded.importLog).toHaveLength(1)
    expect(sync(loaded, NOTE).summary).toEqual({ added: 0, archived: 0, completed: 0, duplicates: 5, renamed: 0 })
  })
})

describe('17. Импорт после миграции v1 → v2', () => {
  it('старые данные мигрируют, появляется журнал, импорт работает, прогресс цел', () => {
    const base = createInitialState(NOW)
    const v1 = {
      ...base,
      version: 1,
      importLog: undefined,
      settings: { dailyQuestLimit: 5 },
      profile: { ...base.profile, totalXp: 205, gold: 90 },
      quests: [{ id: 'old', date: '2026-10-07', title: 'Старый квест', description: '', stat: 'career', difficulty: 'normal', isMain: false, status: 'done', completedAt: '2026-10-07T10:00:00.000Z', xpEarned: 10, goldEarned: 5, statXpEarned: 4 }],
      history: [{ id: 'h', at: '2026-10-07T10:00:00.000Z', date: '2026-10-07', type: 'quest', title: 'Старый квест', xp: 10, gold: 5 }],
    }
    const s = migrate(JSON.parse(JSON.stringify(v1)))!
    expect(s.version).toBe(2)
    expect(s.importLog).toEqual([])
    const r = sync(s, NOTE)
    expect(r.summary.added).toBe(4)
    expect(r.state.profile).toMatchObject({ totalXp: 205, gold: 90 })
    expect(r.state.history).toHaveLength(1)
    expect(r.state.quests.find((q) => q.id === 'old')).toMatchObject({ status: 'done', xpEarned: 10 })
  })
})

describe('Источники задач', () => {
  it('ссылка Shortcut: #/import?text=… разбирается, в т.ч. %20 и «+»', async () => {
    const url = buildImportUrl('https://example.com/level-up-my-life/#/home', NOTE)
    const hash = url.slice(url.indexOf('#'))
    expect(readImportHash(hash)?.text).toBe(NOTE)
    expect(readImportHash('#/import?text=%E2%98%90%20%D0%9B%D0%B0%D0%B1%D0%B0')?.text).toBe('☐ Лаба')
    expect(readImportHash('#/import?clipboard')).toEqual({ text: null, clipboard: true })
    expect(readImportHash('#/quests')).toBeNull()
    const src = new ShortcutUrlSource(hash, NOW)
    const r = await src.import(blank(), NOW)
    expect(r.summary.added).toBe(4)
    expect(r.state.importLog.at(-1)).toMatchObject({ source: 'shortcut-url', found: 5, added: 4, archived: 1 })
    expect(MAX_URL_TEXT).toBeGreaterThan(NOTE.length)
  })

  it('ManualTextSource по-прежнему работает', async () => {
    const r = await new ManualTextSource(NOTE, NOW).sync(blank(), NOW)
    expect(r.summary.added).toBe(4)
    expect(r.state.importLog.at(-1)!.source).toBe('notes-text')
  })

  it('журнал импортов хранит последние 20 записей', () => {
    let s = blank()
    for (let i = 0; i < 25; i++) s = sync(s, NOTE).state
    expect(s.importLog).toHaveLength(20)
  })

  it('реестр: работающие источники не требуют backend', () => {
    expect(SOURCES.filter((x) => x.status === 'available').every((x) => !x.needsBackend)).toBe(true)
  })
})
