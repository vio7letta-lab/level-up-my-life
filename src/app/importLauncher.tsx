import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { ImportSheet } from '../components/ImportSheet'
import { ShortcutSetupSheet } from '../components/ShortcutSetupSheet'
import { ClipboardError, ClipboardSource } from '../sources/ClipboardSource'
import { readImportHash } from '../sources/ShortcutUrlSource'

interface OpenOptions {
  text?: string
  /** id источника для журнала импортов */
  source?: string
  /** сообщение (например, почему не удалось прочитать буфер) */
  notice?: string
}

interface ImportLauncher {
  /** открыть окно импорта (пустое или с текстом) */
  openImport: (options?: OpenOptions) => void
  /** ⚡ Быстрый импорт: прочитать буфер (вызывать только из обработчика нажатия) и сразу показать предпросмотр */
  quickImport: () => Promise<void>
  openSetup: () => void
}

const Ctx = createContext<ImportLauncher | null>(null)

/**
 * Единая точка входа в импорт задач: кнопки в Inbox и на Home, а также ссылка
 * «#/import?text=…» из iOS Shortcut. Сама логика импорта — в движке (importTasks).
 */
export function ImportLauncherProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<OpenOptions | null>(null)
  const [setup, setSetup] = useState(false)

  const openImport = useCallback((options: OpenOptions = {}) => setSheet(options), [])

  const quickImport = useCallback(async () => {
    try {
      const text = await new ClipboardSource().getText()
      setSheet({ text, source: 'clipboard' })
    } catch (e) {
      setSheet({ source: 'clipboard', notice: e instanceof ClipboardError ? e.message : 'Не удалось прочитать буфер.' })
    }
  }, [])

  // Ссылка из Shortcut: #/import?text=… (или #/import?clipboard — открыть импорт с кнопкой вставки)
  useEffect(() => {
    const handle = () => {
      const data = readImportHash(location.hash)
      if (!data) return
      // убираем текст заметки из адресной строки и истории браузера
      history.replaceState(null, '', '#/quests/inbox')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      if (data.text) setSheet({ text: data.text, source: 'shortcut-url' })
      else setSheet({ source: 'clipboard', notice: data.clipboard ? 'Shortcut скопировал заметку — нажми «⚡ Вставить из буфера».' : undefined })
    }
    handle()
    window.addEventListener('hashchange', handle)
    return () => window.removeEventListener('hashchange', handle)
  }, [])

  return (
    <Ctx.Provider value={{ openImport, quickImport, openSetup: () => setSetup(true) }}>
      {children}
      {sheet && (
        <ImportSheet
          open
          initialText={sheet.text}
          source={sheet.source}
          notice={sheet.notice}
          onClose={() => setSheet(null)}
          onOpenSetup={() => {
            setSheet(null)
            setSetup(true)
          }}
        />
      )}
      {setup && <ShortcutSetupSheet open onClose={() => setSetup(false)} />}
    </Ctx.Provider>
  )
}

export function useImportLauncher(): ImportLauncher {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useImportLauncher must be used inside <ImportLauncherProvider>')
  return ctx
}
