import { TextTaskSource } from './TaskSource'

/**
 * Ссылка импорта для iOS Shortcut:  <адрес игры>#/import?text=<текст заметки, URL-encoded>
 *
 * Почему хэш (#), а не обычный параметр: всё после # не отправляется на сервер —
 * текст заметки не попадает ни в логи GitHub Pages, ни куда-либо ещё. После чтения
 * текст сразу убирается из адресной строки и истории.
 *
 * Ограничение iOS: ссылка из Shortcut открывается в Safari, а приложение на экране «Домой»
 * хранит данные отдельно от Safari. Поэтому ссылка подходит, если игра открыта во вкладке
 * Safari; для иконки на экране «Домой» — ClipboardSource.
 */
export const IMPORT_ROUTE = '#/import'

/** Безопасный предел длины текста в ссылке (~100–200 задач); длиннее — через буфер */
export const MAX_URL_TEXT = 30_000

export function isImportHash(hash: string): boolean {
  return hash.startsWith(IMPORT_ROUTE)
}

/** Достаёт текст из «#/import?text=…». null — если это не ссылка импорта или текста нет. */
export function readImportHash(hash: string): { text: string | null; clipboard: boolean } | null {
  if (!isImportHash(hash)) return null
  const query = hash.slice(IMPORT_ROUTE.length).replace(/^\?/, '')
  const params = new URLSearchParams(query)
  const raw = params.get('text')
  // «+» в query означает пробел, но Shortcuts кодирует пробел как %20 — URLSearchParams понимает оба
  return { text: raw && raw.trim() ? raw : null, clipboard: params.has('clipboard') }
}

/** Собрать ссылку импорта (для инструкции и тестов) */
export function buildImportUrl(base: string, text?: string): string {
  const root = base.split('#')[0]
  return text === undefined ? `${root}${IMPORT_ROUTE}?text=` : `${root}${IMPORT_ROUTE}?text=${encodeURIComponent(text)}`
}

export class ShortcutUrlSource extends TextTaskSource {
  readonly id = 'shortcut-url'
  readonly label = 'Ссылка из Shortcut'

  constructor(
    private hash: string,
    today = new Date(),
  ) {
    super(today)
  }

  async getText() {
    return readImportHash(this.hash)?.text ?? ''
  }
}
