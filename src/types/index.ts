/**
 * Модель данных игры.
 *
 * Главный принцип: прогресс даёт только зафиксированный РЕАЛЬНЫЙ результат
 * (выполненный квест или запись реального дохода), а не создание задач.
 */

export type StatKey = 'finance' | 'career' | 'media' | 'knowledge' | 'energy' | 'social' | 'freedom'

/** tiny 5 XP · normal 10 · hard 25 · big 50 · epic 100 (см. config/rewards) */
export type Difficulty = 'tiny' | 'normal' | 'hard' | 'big' | 'epic'

/** Жизненные направления, из которых собираются квесты дня */
export type Area = 'work' | 'study' | 'content' | 'energy' | 'social'

export type ISODate = string // 'YYYY-MM-DD' — календарный день (локальное время)
export type ISODateTime = string // полная метка времени

export interface Profile {
  name: string
  createdAt: ISODateTime
  /** уровень и «XP до следующего уровня» вычисляются из totalXp (game/levels) */
  totalXp: number
  gold: number
  statXp: Record<StatKey, number>
}

/**
 * Откуда берётся текущее значение цели:
 * - income — сумма реального дохода за текущий месяц;
 * - quests — число выполненных квестов, привязанных к цели;
 * - manual — значение, которое записываешь сама («сдала 3 экзамена»);
 * - milestones — процент закрытых шагов.
 */
export type GoalSource = 'income' | 'quests' | 'manual' | 'milestones'

export interface GoalMetric {
  source: GoalSource
  unit: string // '₽', 'действий', 'постов'…
  target: number
  /** хранится только для source = 'manual' */
  manualValue?: number
}

export interface Milestone {
  id: string
  title: string
  /** если задано — закрывается автоматически, когда метрика цели достигает значения */
  targetValue?: number
  doneAt?: ISODateTime
}

export interface Goal {
  id: string
  title: string
  emoji: string
  /** желаемый результат своими словами */
  outcome: string
  stat: StatKey
  deadline?: ISODate
  metric: GoalMetric
  milestones: Milestone[]
  createdAt: ISODateTime
  completedAt?: ISODateTime
}

/** Шаблон квеста: из шаблонов каждый день собираются квесты дня. */
export interface QuestTemplate {
  id: string
  area: Area
  /** main — кандидат на главный квест дня */
  kind: 'daily' | 'main'
  title: string
  description: string
  stat: StatKey
  difficulty: Difficulty
  goalId?: string
  active: boolean
}

export type QuestStatus = 'open' | 'done' | 'partial' | 'skipped'

/** Конкретный квест конкретного дня. Хранится навсегда — это история. */
export interface Quest {
  id: string
  templateId?: string
  date: ISODate
  area?: Area
  title: string
  description: string
  stat: StatKey
  difficulty: Difficulty
  isMain: boolean
  goalId?: string
  status: QuestStatus
  /** что именно сделала: кому написала, что опубликовала… */
  note?: string
  completedAt?: ISODateTime
  xpEarned: number
  goldEarned: number
  statXpEarned: number
}

export interface Boss {
  id: string
  /** порядковый номер в цепочке боссов */
  index: number
  name: string
  emoji: string
  description: string
  maxHp: number
  hp: number
  reward: { xp: number; gold: number }
  defeatedAt?: ISODateTime
}

export interface UnlockedAchievement {
  id: string // ссылается на определение в config/achievements
  unlockedAt: ISODateTime
}

/** Награда, которую пользователь создаёт сам и «покупает» за GOLD (Этап 4). */
export interface Reward {
  id: string
  title: string
  emoji: string
  costGold: number
  timesClaimed: number
}

/** Реальные деньги — отдельно от GOLD. */
export interface IncomeEntry {
  id: string
  date: ISODate
  amount: number
  source: string
  createdAt: ISODateTime
}

export interface StreakState {
  current: number
  best: number
  lastActiveDate?: ISODate
  /** щиты закрывают пропущенный день — серия не обнуляется */
  shields: number
  totalActiveDays: number
}

export type HistoryType = 'quest' | 'income' | 'milestone' | 'boss' | 'achievement' | 'level'

export interface HistoryEntry {
  id: string
  at: ISODateTime
  date: ISODate
  type: HistoryType
  title: string
  /** «Сделано полностью», «15 000 ₽», «Level 3 · Дисциплина»… */
  result?: string
  xp: number
  gold: number
  stat?: StatKey
  statXp?: number
  questId?: string
}

export interface Settings {
  dailyQuestLimit: number
}

export interface GameState {
  version: number
  profile: Profile
  goals: Goal[]
  templates: QuestTemplate[]
  quests: Quest[]
  boss: Boss | null
  defeatedBosses: Boss[]
  achievements: UnlockedAchievement[]
  rewards: Reward[]
  income: IncomeEntry[]
  streak: StreakState
  history: HistoryEntry[]
  /** день, для которого уже собраны квесты дня */
  lastGeneratedDate?: ISODate
  /** последний день, когда было зафиксировано реальное действие */
  lastActivityDate?: ISODate
  settings: Settings
}

/** Результат, который игрок фиксирует после реального действия */
export interface QuestResult {
  status: 'done' | 'partial' | 'skipped'
  note?: string
}

/** То, что произошло в результате действия — для анимаций и feedback */
export type GameEffect =
  | { type: 'quest'; title: string; status: QuestStatus; xp: number; gold: number; stat: StatKey; statXp: number }
  | { type: 'level'; level: number; title: string }
  | { type: 'statLevel'; stat: StatKey; level: number }
  | { type: 'bossHit'; name: string; emoji: string; damage: number; hp: number; maxHp: number }
  | { type: 'bossDefeated'; name: string; emoji: string; xp: number; gold: number; next?: string }
  | { type: 'achievement'; id: string }
  | { type: 'milestone'; goal: string; title: string; xp: number }
  | { type: 'streak'; days: number; shieldUsed: boolean }
  | { type: 'income'; amount: number }
