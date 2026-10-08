import { importTasks } from '../game/engine'
import { parseNotes, type ParsedTask } from '../game/notesParser'
import type { GameState } from '../types'
import type { TaskSource } from './TaskSource'

/**
 * Ручной импорт: текст, вставленный из Apple Notes (или любого списка).
 * Источник «без подключения» — работает на GitHub Pages без backend.
 */
export class ManualTextSource implements TaskSource {
  readonly id = 'notes-text'
  readonly label = 'Текст из заметки'

  constructor(
    private text: string,
    private today = new Date(),
  ) {}

  async getTasks(): Promise<ParsedTask[]> {
    return parseNotes(this.text, this.today)
  }

  async import(state: GameState, now: Date) {
    return importTasks(state, await this.getTasks(), now, 'notes')
  }

  /** Для текста sync = повторный import той же заметки: дубликатов не будет */
  async sync(state: GameState, now: Date) {
    return this.import(state, now)
  }
}
