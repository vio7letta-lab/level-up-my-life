import { TextTaskSource } from './TaskSource'

/**
 * Ручной импорт: текст, вставленный из Apple Notes (или любого списка).
 * Источник «без подключения» — работает на GitHub Pages без backend.
 */
export class ManualTextSource extends TextTaskSource {
  readonly id = 'notes-text'
  readonly label = 'Текст из заметки'

  constructor(
    private text: string,
    today = new Date(),
  ) {
    super(today)
  }

  async getText() {
    return this.text
  }
}
