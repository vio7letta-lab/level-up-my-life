import { useMemo, useState } from 'react'
import type { ImportSummary } from '../game/engine'
import { countPlan, planImport, type ImportAction } from '../game/importer'
import { parseNotes } from '../game/notesParser'
import { ClipboardError, ClipboardSource } from '../sources/ClipboardSource'
import { useGame } from '../store/GameContext'
import { Button } from './Button'
import { TextArea } from './Field'
import { Sheet } from './Sheet'

const ACTION: Record<ImportAction, { label: string; tone: string }> = {
  new: { label: 'новая → Inbox', tone: 'text-accent' },
  complete: { label: 'отмечена ✓ → закроется с наградой', tone: 'text-accent' },
  renamed: { label: 'текст изменён → та же задача', tone: 'text-muted' },
  archive: { label: 'уже выполнена → архив без XP', tone: 'text-faint' },
  duplicate: { label: 'уже есть', tone: 'text-faint' },
}

const EXAMPLE = `План задач
☐ Лабы ПАХТ
☐ Спросить значения у Сажнева по ВМС
☐ Отправить 50 резюме
☐ Написать Владе про рекламу
☑ Написать Миролюбовой`

const plural = (n: number, f: [string, string, string]) => {
  const a = n % 100
  const b = n % 10
  return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2]
}
const tasksWord = (n: number) => plural(n, ['задачу', 'задачи', 'задач'])

interface Props {
  open: boolean
  onClose: () => void
  onOpenSetup?: () => void
  initialText?: string
  /** id источника для журнала: clipboard / shortcut-url / notes-text */
  source?: string
  notice?: string
}

/** Импорт задач: текст → предпросмотр (новые / уже есть / ✓ / архив) → импорт без дубликатов */
export function ImportSheet({ open, onClose, onOpenSetup, initialText = '', source = 'notes-text', notice }: Props) {
  const { state, importTasks } = useGame()
  const [text, setText] = useState(initialText)
  const [src, setSrc] = useState(source)
  const [message, setMessage] = useState(notice ?? '')
  const [forceNew, setForceNew] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<(ImportSummary & { mode: 'new' | 'all' }) | null>(null)
  const [editing, setEditing] = useState(!initialText)

  const parsed = useMemo(() => parseNotes(text, new Date()), [text])
  const plan = useMemo(() => planImport(state, parsed, { forceNew }), [state, parsed, forceNew])
  const c = countPlan(plan)
  const allChanges = c.new + c.complete + c.archive + c.renamed

  const paste = async () => {
    setMessage('')
    try {
      setText(await new ClipboardSource().getText())
      setSrc('clipboard')
      setEditing(false)
    } catch (e) {
      setMessage(e instanceof ClipboardError ? e.message : 'Не удалось прочитать буфер.')
    }
  }

  const run = (mode: 'new' | 'all') => setResult({ ...importTasks(parsed, { mode, forceNew, sourceLabel: src }), mode })

  if (result) {
    return (
      <Sheet open={open} onClose={onClose} title="Импорт готов">
        <ul className="space-y-2 text-[15px]">
          <li>
            📥 Новых в Inbox и план: <b>{result.added}</b>
          </li>
          {result.completed > 0 && (
            <li>
              ✓ Закрыто с наградой: <b>{result.completed}</b>
            </li>
          )}
          {result.renamed > 0 && <li>✎ Текст обновлён у существующих: {result.renamed}</li>}
          {result.archived > 0 && <li>🗄 Выполненные → архив без XP: {result.archived}</li>}
          {result.duplicates > 0 && <li className="text-muted">Уже были в игре: {result.duplicates}</li>}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {result.added > 0 ? 'Разбери Inbox: что сегодня, что завтра, что позже. На Home попадут только задачи на сегодня.' : 'Новых задач нет — всё уже в игре.'}
        </p>
        <Button className="mt-6 w-full" onClick={onClose}>
          Готово
        </Button>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title="Импорт из заметки" subtitle="Заметка — источник задач, игра — система их выполнения">
      <div className="space-y-4">
        {message && <p className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-muted">{message}</p>}

        {(editing || !text) && (
          <>
            <Button className="w-full" onClick={paste}>
              ⚡ Вставить из буфера
            </Button>
            <TextArea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setSrc('notes-text')
              }}
              rows={7}
              placeholder={EXAMPLE}
              className="min-h-40 text-[15px]"
            />
            <p className="px-1 text-xs leading-relaxed text-faint">
              ☐ ○ □ • — задача, ☑ ✓ — выполнена. Строка над списком — категория. Даты «15.10», «до 20 октября», «завтра» распознаются.
              {onOpenSetup && (
                <>
                  {' '}
                  <button className="text-accent underline-offset-2 hover:underline" onClick={onOpenSetup}>
                    Как настроить Shortcut →
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {plan.length > 0 && (
          <div className="glass animate-rise rounded-3xl p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold">Найдено: {c.found}</p>
              {!editing && (
                <button className="min-h-10 text-sm text-accent" onClick={() => setEditing(true)}>
                  изменить текст
                </button>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Новых" value={c.new} accent />
              <Stat label="Уже есть" value={c.existing} />
              <Stat label="Выполнено ✓" value={c.complete} accent={c.complete > 0} hint="закроются с наградой" />
              <Stat label="В архив" value={c.archive} hint="✓ при первом импорте" />
            </div>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto border-t border-line pt-3 text-sm">
              {plan.map(({ task, action, existing, complete, moved }) => (
                <li key={task.fingerprint} className={`flex gap-2 ${action === 'duplicate' || action === 'archive' ? 'opacity-50' : ''}`}>
                  <span className="shrink-0">{task.done ? '✓' : '○'}</span>
                  <span className="min-w-0 flex-1">
                    {task.title}
                    <span className={`block text-xs ${ACTION[action].tone}`}>
                      {action === 'renamed' && moved ? 'уже есть · перенесена в другой раздел' : ACTION[action].label}
                      {action === 'renamed' && complete && ' · ✓ закроется с наградой'}
                      {task.dueDate && ` · ${task.dueDate.split('-').reverse().join('.')}`}
                      {task.context && ` · ${task.context}`}
                    </span>
                    {action === 'renamed' && !moved && existing && (
                      <span className="block text-xs text-faint">
                        было: «{existing.title}» ·{' '}
                        <button className="text-accent" onClick={() => setForceNew(new Set([...forceNew, task.fingerprint]))}>
                          это новая задача
                        </button>
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.length > 0 && (
          <div className="space-y-2">
            <Button className="w-full" disabled={allChanges === 0} onClick={() => run('all')}>
              {allChanges === 0 ? 'Всё уже в игре' : `Импортировать всё · ${allChanges}`}
            </Button>
            {c.new > 0 && c.new !== allChanges && (
              <Button variant="ghost" className="w-full" onClick={() => run('new')}>
                Только новые · {c.new} {tasksWord(c.new)}
              </Button>
            )}
            <p className="px-1 text-center text-xs text-faint">
              Оба варианта безопасны: дубликаты не создаются, задачи, удалённые из заметки, в игре остаются.
            </p>
          </div>
        )}
      </div>
    </Sheet>
  )
}

function Stat({ label, value, accent, hint }: { label: string; value: number; accent?: boolean; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-strong px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-xl font-semibold ${accent && value ? 'text-accent' : ''}`}>{value}</p>
      {hint && <p className="text-[11px] leading-tight text-faint">{hint}</p>}
    </div>
  )
}
