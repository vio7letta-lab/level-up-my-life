import { useState } from 'react'
import { buildImportUrl } from '../sources/ShortcutUrlSource'
import { Button } from './Button'
import { Choice } from './Field'
import { Sheet } from './Sheet'

const DOCS_URL = 'https://github.com/vio7letta-lab/level-up-my-life/blob/HEAD/docs/SHORTCUT.md'

/** Краткая инструкция по Shortcut прямо в приложении. Полная версия — docs/SHORTCUT.md */
export function ShortcutSetupSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [variant, setVariant] = useState<'home' | 'safari'>('home')
  const [copied, setCopied] = useState('')
  const base = location.href.split('#')[0]
  const urlPrefix = buildImportUrl(base)
  const clipUrl = `${base}#/import?clipboard`

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
    } catch {
      setCopied('')
      prompt('Скопируй вручную:', text)
    }
  }

  const step = (n: number, title: string, detail?: string) => (
    <li className="flex gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">{n}</span>
      <span className="min-w-0 pt-0.5">
        <span className="block font-medium">{title}</span>
        {detail && <span className="mt-0.5 block text-sm leading-relaxed text-muted">{detail}</span>}
      </span>
    </li>
  )

  return (
    <Sheet open={open} onClose={onClose} title="Shortcut «В LEVEL UP»" subtitle="Один запуск — и задачи из заметки готовы к импорту">
      <div className="space-y-5">
        <Choice
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'home', label: 'Иконка «Домой»' },
            { value: 'safari', label: 'Вкладка Safari' },
          ]}
        />

        {variant === 'home' ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Приложение на экране «Домой» хранит данные отдельно от Safari, поэтому Shortcut передаёт текст через буфер обмена — это самый надёжный способ на iPhone.
            </p>
            <ol className="space-y-4">
              {step(1, 'Команды → «+» → назови «В LEVEL UP»')}
              {step(2, 'Найти заметки (Find Notes)', 'Добавить фильтр → Название → является → «План задач». Ограничить: вкл, 1.')}
              {step(3, 'Получить текст из входных данных (Get Text from Input)', 'Вход — «Заметки» из шага 2.')}
              {step(4, 'Скопировать в буфер обмена (Copy to Clipboard)')}
              {step(5, 'Показать уведомление (Show Notification)', '«Задачи скопированы — открой LEVEL UP → ⚡ Быстрый импорт».')}
            </ol>
            <p className="text-sm leading-relaxed text-muted">
              Дальше: открой LEVEL UP → <b>⚡ Быстрый импорт</b> → iOS покажет «Вставить» → нажми → предпросмотр → «Импортировать всё».
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted">Если игра открыта во вкладке Safari, Shortcut может сразу открыть предпросмотр импорта — без буфера.</p>
            <ol className="space-y-4">
              {step(1, 'Шаги 1–3 как для иконки', 'Найти заметки → Получить текст из входных данных.')}
              {step(4, 'Кодировать URL (URL Encode)', 'Режим: «Кодировать».')}
              {step(5, 'Текст (Text)', 'Вставь адрес ниже и сразу после «text=» — переменную «Закодированный URL» из шага 4.')}
              {step(6, 'Открыть URL-адреса (Open URLs)')}
            </ol>
            <div className="rounded-2xl bg-surface-strong p-3">
              <p className="text-xs break-all text-muted">{urlPrefix}</p>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => copy(urlPrefix, 'url')}>
                {copied === 'url' ? '✓ Скопировано' : 'Скопировать адрес'}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-faint">
              Очень длинная заметка (больше ~150 задач)? Вместо шагов 4–6: «Скопировать в буфер» → «Открыть URL» с адресом{' '}
              <button className="text-accent" onClick={() => copy(clipUrl, 'clip')}>
                {copied === 'clip' ? '✓ скопирован' : '…#/import?clipboard'}
              </button>
              .
            </p>
          </>
        )}

        <div className="rounded-2xl border border-line p-4 text-sm leading-relaxed text-muted">
          <p className="font-medium text-text">Первый запуск — проверь текст</p>
          Временно поставь вместо «Скопировать в буфер» действие «Быстрый просмотр» (Quick Look): так видно, остаются ли ☐/☑ у пунктов чек-листа. Если отметок нет — задачи импортируются как открытые, а ✓ нужно ставить символом.
        </div>

        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="block text-center text-sm font-medium text-accent">
          Полная пошаговая инструкция →
        </a>
        <Button className="w-full" onClick={onClose}>
          Понятно
        </Button>
      </div>
    </Sheet>
  )
}
