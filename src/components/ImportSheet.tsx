import { useMemo, useState } from 'react'
import { importAction, type ImportAction, type ImportSummary } from '../game/engine'
import { parseNotes } from '../game/notesParser'
import { useGame } from '../store/GameContext'
import { Button } from './Button'
import { TextArea } from './Field'
import { Sheet } from './Sheet'

const ACTION_LABEL: Record<ImportAction, string> = {
  new: 'новая',
  archive: 'выполнена → архив без XP',
  complete: 'отмечена ✓ → закроется с наградой',
  duplicate: 'уже есть',
}

const EXAMPLE = `Учёба
○ Лаба ВМС спросить значения у Сажнева
○ Коллоквиум материаловедение до 20.10
✓ Лаба теор

Работа
○ Отправить резюме hh.ru 50 штук
○ Выписать всё что хочет Лера и составить КП`

/** Импорт задач из заметки: вставить текст → предпросмотр → импорт без дубликатов */
export function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, importTasks } = useGame()
  const [text, setText] = useState('')
  const [result, setResult] = useState<ImportSummary | null>(null)
  const [clipError, setClipError] = useState('')

  const parsed = useMemo(() => parseNotes(text, new Date()), [text])
  const rows = parsed.map((p) => ({ ...p, action: importAction(state, p) }))
  const byContext = new Map<string, number>()
  for (const r of rows) byContext.set(r.context ?? 'Без заголовка', (byContext.get(r.context ?? 'Без заголовка') ?? 0) + 1)
  const useful = rows.filter((r) => r.action !== 'duplicate').length
  const count = (a: ImportAction) => rows.filter((r) => r.action === a).length

  const paste = async () => {
    setClipError('')
    try {
      const clip = await navigator.clipboard.readText()
      if (clip.trim()) setText(clip)
      else setClipError('Буфер обмена пуст. Скопируй текст заметки и попробуй снова.')
    } catch {
      setClipError('Браузер не дал доступ к буферу. Нажми на поле и выбери «Вставить».')
    }
  }

  const close = () => {
    setText('')
    setResult(null)
    onClose()
  }

  if (result) {
    return (
      <Sheet open={open} onClose={close} title="Импорт готов">
        <ul className="space-y-2 text-[15px]">
          <li>📥 В Inbox и план: <b>{result.added}</b></li>
          {result.completed > 0 && <li>✓ Закрыто с наградой: <b>{result.completed}</b></li>}
          {result.archived > 0 && <li>🗄 Выполненные → архив без XP: <b>{result.archived}</b></li>}
          {result.duplicates > 0 && <li className="text-muted">Пропущено дубликатов: {result.duplicates}</li>}
        </ul>
        <p className="mt-4 text-sm text-muted">Теперь разбери Inbox: что сегодня, что завтра, что позже. На Home попадут только задачи на сегодня.</p>
        <Button className="mt-6 w-full" onClick={close}>
          К задачам
        </Button>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={close} title="Импорт из заметки" subtitle="Скопируй заметку в Apple Notes и вставь сюда">
      <div className="space-y-4">
        <Button variant="ghost" className="w-full" onClick={paste}>
          📋 Вставить из буфера
        </Button>
        {clipError && <p className="text-sm text-muted">{clipError}</p>}
        <TextArea value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder={EXAMPLE} className="min-h-48 font-[inherit] text-[15px]" />
        <p className="px-1 text-xs leading-relaxed text-faint">
          ○ □ ☐ • — задача, ✓ ☑ — выполнена. Строка над списком — категория («Учёба», «Работа»). Даты вида «15.10», «до 20 октября», «завтра» распознаются. Повторный импорт той же заметки не создаёт дубликатов.
        </p>

        {rows.length > 0 && (
          <div className="glass animate-rise rounded-3xl p-4">
            <p className="font-semibold">Найдено задач: {rows.length}</p>
            <ul className="mt-2 space-y-0.5 text-sm text-muted">
              {[...byContext].map(([ctx, n]) => (
                <li key={ctx}>
                  {ctx} — {n}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-faint">
              новых {count('new')}
              {count('complete') > 0 && ` · закроются ✓ ${count('complete')}`}
              {count('archive') > 0 && ` · в архив ${count('archive')}`}
              {count('duplicate') > 0 && ` · уже есть ${count('duplicate')}`}
            </p>
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto border-t border-line pt-3 text-sm">
              {rows.map((r) => (
                <li key={r.fingerprint} className={`flex gap-2 ${r.action === 'duplicate' ? 'opacity-45' : ''}`}>
                  <span className="shrink-0">{r.done ? '✓' : '○'}</span>
                  <span className="min-w-0 flex-1">
                    {r.title}
                    <span className="block text-xs text-faint">
                      {ACTION_LABEL[r.action]}
                      {r.dueDate && ` · ${r.dueDate.split('-').reverse().join('.')}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          className="w-full"
          disabled={useful === 0}
          onClick={() => {
            setResult(importTasks(parsed))
          }}
        >
          {useful > 0 ? `Импортировать ${useful} ${useful === 1 ? 'задачу' : useful < 5 ? 'задачи' : 'задач'}` : rows.length ? 'Всё уже импортировано' : 'Импортировать'}
        </Button>
      </div>
    </Sheet>
  )
}
