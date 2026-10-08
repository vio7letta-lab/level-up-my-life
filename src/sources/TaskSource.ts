import { importTasks, type ActionResult, type ImportOptions, type ImportSummary } from '../game/engine'
import { parseNotes, type ParsedTask } from '../game/notesParser'
import type { GameState } from '../types'

export type ImportResult = ActionResult & { summary: ImportSummary }

/**
 * Источник реальных задач: заметка, буфер обмена, iOS Shortcut, таск-менеджер, backend.
 *
 * - getTasks() — прочитать задачи из источника в общем формате ParsedTask
 *   (fingerprint, title, context, done, dueDate);
 * - import() — один раз забрать задачи и слить с игрой (без дубликатов);
 * - sync() — то же самое повторно: идемпотентно — новые задачи добавятся,
 *   ✓ закроют активные квесты с наградой, удалённые из источника задачи НЕ удаляются.
 *
 * Слияние всегда делает движок (importTasks → planImport → completeQuest),
 * поэтому любой источник получает одинаковую защиту от дублей и двойных наград,
 * и задачи проходят через тот же путь: классификация → XP → цель → Inbox/Today → награда → History.
 */
export interface TaskSource {
  /** стабильный id источника — пишется в журнал импортов */
  readonly id: string
  readonly label: string
  getTasks(): Promise<ParsedTask[]>
  import(state: GameState, now: Date, options?: ImportOptions): Promise<ImportResult>
  sync(state: GameState, now: Date, options?: ImportOptions): Promise<ImportResult>
}

/** Базовый класс для источников, которые отдают текст (заметка, буфер, ссылка Shortcut, Telegram-сообщение…) */
export abstract class TextTaskSource implements TaskSource {
  abstract readonly id: string
  abstract readonly label: string

  constructor(protected today: Date = new Date()) {}

  /** сырой текст из источника */
  abstract getText(): Promise<string>

  async getTasks(): Promise<ParsedTask[]> {
    return parseNotes(await this.getText(), this.today)
  }

  async import(state: GameState, now: Date, options: ImportOptions = {}): Promise<ImportResult> {
    return importTasks(state, await this.getTasks(), now, 'notes', { sourceLabel: this.id, ...options })
  }

  /** Для текстовых источников sync = повторный import: дубликатов не будет */
  async sync(state: GameState, now: Date, options?: ImportOptions): Promise<ImportResult> {
    return this.import(state, now, options)
  }
}
