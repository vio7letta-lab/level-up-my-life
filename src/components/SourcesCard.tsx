import { useImportLauncher } from '../app/importLauncher'
import { toISODate } from '../game/dates'
import { useGame } from '../store/GameContext'
import { Button } from './Button'

const SOURCE_LABEL: Record<string, string> = {
  clipboard: 'буфер / Shortcut',
  'shortcut-url': 'ссылка Shortcut',
  'notes-text': 'вставка текста',
}

function when(iso: string, today: string): string {
  const d = new Date(iso)
  const day = toISODate(d)
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (day === today) return `сегодня, ${time}`
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}, ${time}`
}

/** «Источник задач»: последний импорт и быстрые действия. Живёт вверху Inbox. */
export function SourcesCard() {
  const { state, today } = useGame()
  const { quickImport, openImport, openSetup } = useImportLauncher()
  const last = state.importLog.at(-1)

  return (
    <section className="glass rounded-3xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Источник задач</p>
          <p className="mt-1 font-semibold">🗒 Apple Notes · «План задач»</p>
        </div>
        <button onClick={openSetup} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-strong" aria-label="Настройка источника" title="Настройка источника">
          ⚙️
        </button>
      </div>

      {last ? (
        <div className="mt-3 text-sm text-muted">
          <p>
            Последний импорт: <span className="text-text">{when(last.at, today)}</span>
            <span className="text-faint"> · {SOURCE_LABEL[last.source] ?? last.source}</span>
          </p>
          <p className="mt-1 text-xs text-faint">
            найдено {last.found} · новых {last.added} · уже есть {last.existing}
            {last.completed > 0 && ` · выполнено ✓ ${last.completed}`}
            {last.archived > 0 && ` · в архив ${last.archived}`}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">Ещё не было импорта. Настрой Shortcut ⚙️ один раз — дальше обновление задач занимает пару нажатий.</p>
      )}

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button onClick={quickImport}>⚡ Быстрый импорт</Button>
        <Button variant="ghost" onClick={() => openImport()} aria-label="Вставить текст вручную" title="Вставить текст вручную">
          📋
        </Button>
      </div>
    </section>
  )
}
