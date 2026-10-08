/**
 * Модель данных игры.
 *
 * Этап 0: только описание типов (архитектура). Реализация хранилища,
 * игрового движка и генератора квестов — начиная с Этапа 1.
 *
 * Главный принцип: прогресс даёт только зафиксированный РЕАЛЬНЫЙ результат
 * (QuestInstance.resultCount / IncomeEntry), а не создание задач.
 */

export type StatKey = 'finance' | 'career' | 'media' | 'knowledge' | 'energy' | 'social' | 'freedom'

/** tiny 5 XP · normal 10 · hard 25 · big 50 · epic 100 (см. config) */
export type Difficulty = 'tiny' | 'normal' | 'hard' | 'big' | 'epic'

export type ISODate = string // 'YYYY-MM-DD' — календарный день
export type ISODateTime = string // полная метка времени

export interface Profile {
  name: string
  createdAt: ISODateTime
  totalXp: number
  gold: number
  statXp: Record<StatKey, number>
}

export interface GoalMetric {
  unit: string // '₽', 'шт', 'клиентов'…
  target: number
  current: number
  /** 'income' — current считается из записей реального дохода за месяц */
  source: 'manual' | 'income'
}

export interface Milestone {
  id: string
  title: string
  order: number
  /** если задано — закрывается автоматически, когда метрика цели достигает значения */
  targetValue?: number
  doneAt?: ISODateTime
  xpReward: number
}

export interface Goal {
  id: string
  title: string
  emoji: string
  stat: StatKey
  deadline?: ISODate
  status: 'active' | 'done' | 'paused'
  metric?: GoalMetric
  milestones: Milestone[]
  createdAt: ISODateTime
}

export type QuestRepeat = 'once' | 'daily' | 'weekdays' | 'weekly'

/** Шаблон: «что повторять». Из шаблонов каждый день собираются квесты. */
export interface QuestTemplate {
  id: string
  title: string
  stat: StatKey
  difficulty: Difficulty
  /** измеримая цель: «найти 5 клиентов» → targetCount 5, unit 'клиентов' */
  targetCount?: number
  unit?: string
  goalId?: string
  milestoneId?: string
  tags?: string[]
  repeat: QuestRepeat
  active: boolean
}

/** Конкретный квест конкретного дня. Хранится навсегда — это история. */
export interface QuestInstance {
  id: string
  templateId?: string
  date: ISODate
  title: string
  stat: StatKey
  difficulty: Difficulty
  isMain: boolean
  goalId?: string
  tags?: string[]
  targetCount?: number
  /** сколько реально сделано — XP начисляется пропорционально */
  resultCount?: number
  /** что именно сделала: кому написала, что опубликовала… */
  note?: string
  status: 'open' | 'done' | 'partial' | 'skipped'
  completedAt?: ISODateTime
  xpEarned: number
  goldEarned: number
  statGains: Partial<Record<StatKey, number>>
}

export interface Boss {
  id: string
  name: string
  emoji: string
  description: string
  maxHp: number
  hp: number
  /** квесты этих характеристик бьют сильнее */
  weakTo: StatKey[]
  reward: { xp: number; gold: number; stats?: Partial<Record<StatKey, number>> }
  defeatedAt?: ISODateTime
}

export interface UnlockedAchievement {
  id: string // ссылается на определение в config
  unlockedAt: ISODateTime
}

/** Награда, которую пользователь создаёт сам и «покупает» за GOLD. */
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
  clientName?: string
  goalId?: string
}

export interface StreakState {
  current: number
  best: number
  lastActiveDate?: ISODate
  /** щиты закрывают пропущенный день — серия не обнуляется */
  shields: number
  totalActiveDays: number
}

export interface Settings {
  theme: 'dark' | 'light'
  dailyQuestLimit: number
}

export interface GameState {
  version: number
  profile: Profile
  goals: Goal[]
  templates: QuestTemplate[]
  quests: QuestInstance[]
  bosses: Boss[]
  achievements: UnlockedAchievement[]
  rewards: Reward[]
  income: IncomeEntry[]
  streak: StreakState
  settings: Settings
}
