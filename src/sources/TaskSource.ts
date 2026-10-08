import type { ActionResult, ImportSummary } from '../game/engine'
import type { ParsedTask } from '../game/notesParser'
import type { GameState } from '../types'

/**
 * Источник реальных задач: заметка, таск-менеджер, backend.
 *
 * - getTasks() — прочитать задачи из источника в общем формате ParsedTask
 *   (sourceId/fingerprint, title, context, done, dueDate);
 * - import() — один раз забрать задачи и слить с игрой (без дубликатов);
 * - sync() — то же самое повторно: для pull-источников это идемпотентный import —
 *   новые задачи добавятся, ✓ закроют активные квесты с наградой, остальное не изменится.
 *
 * Слияние делает чистая функция движка importTasks(), поэтому любой новый источник
 * (iOS Shortcut через backend, Todoist, Google Tasks) получает ту же защиту от дубликатов
 * и двойных наград.
 */
export interface TaskSource {
  readonly id: string
  readonly label: string
  getTasks(): Promise<ParsedTask[]>
  import(state: GameState, now: Date): Promise<ActionResult & { summary: ImportSummary }>
  sync(state: GameState, now: Date): Promise<ActionResult & { summary: ImportSummary }>
}
