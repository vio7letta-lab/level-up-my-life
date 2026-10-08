import { TextTaskSource } from './TaskSource'

export class ClipboardError extends Error {}

/**
 * Буфер обмена: Shortcut «В LEVEL UP» копирует текст заметки, приложение читает его по одному нажатию.
 * Это основной канал для приложения на экране «Домой»: у него своё хранилище, отдельное от Safari,
 * поэтому ссылки из Shortcut туда не попадают, а буфер обмена общий для всей системы.
 *
 * Важно: браузер разрешает читать буфер только в ответ на нажатие (Safari покажет кнопку «Вставить»).
 * Поэтому getText() нужно вызывать прямо из обработчика нажатия.
 */
export class ClipboardSource extends TextTaskSource {
  readonly id = 'clipboard'
  readonly label = 'Буфер обмена'

  async getText(): Promise<string> {
    if (!navigator.clipboard?.readText) throw new ClipboardError('Этот браузер не умеет читать буфер. Вставь текст в поле вручную.')
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      throw new ClipboardError('Доступ к буферу не разрешён. Нажми «Вставить», когда iOS спросит, или вставь текст в поле вручную.')
    }
    if (!text.trim()) throw new ClipboardError('Буфер обмена пуст. Запусти Shortcut «В LEVEL UP» или скопируй заметку.')
    return text
  }
}
