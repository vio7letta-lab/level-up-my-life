/**
 * Реестр источников задач. available — работает сейчас; planned — архитектурное место
 * под будущую интеграцию (ничего не делает, пока не реализован свой TaskSource).
 */
export interface SourceInfo {
  id: string
  label: string
  status: 'available' | 'planned'
  /** нужен ли сервер (backend) для этого источника */
  needsBackend: boolean
  note: string
}

export const SOURCES: SourceInfo[] = [
  { id: 'clipboard', label: 'Apple Notes → Shortcut → буфер', status: 'available', needsBackend: false, note: 'Основной способ для приложения на экране «Домой».' },
  { id: 'shortcut-url', label: 'Apple Notes → Shortcut → ссылка', status: 'available', needsBackend: false, note: 'Если игра открыта во вкладке Safari: предпросмотр открывается сам.' },
  { id: 'notes-text', label: 'Вставить текст вручную', status: 'available', needsBackend: false, note: 'Любой список: Notes, Telegram, документ.' },
  { id: 'reminders', label: 'Apple Reminders (через Shortcut)', status: 'planned', needsBackend: false, note: 'Тот же Shortcut-канал, но с точным статусом ✓ и сроками.' },
  { id: 'todoist', label: 'Todoist', status: 'planned', needsBackend: false, note: 'REST API + личный токен; проверить CORS, иначе — через backend.' },
  { id: 'google-tasks', label: 'Google Tasks', status: 'planned', needsBackend: false, note: 'OAuth в браузере; нужен проект Google Cloud.' },
  { id: 'notion', label: 'Notion', status: 'planned', needsBackend: true, note: 'API не разрешает запросы из браузера — нужен прокси.' },
  { id: 'telegram', label: 'Telegram-бот', status: 'planned', needsBackend: true, note: 'Бот принимает сообщения → backend → RPG забирает при открытии.' },
  { id: 'backend-inbox', label: 'Свой endpoint (Shortcut без буфера)', status: 'planned', needsBackend: true, note: 'Полностью автоматический импорт; см. README «Нужен ли backend».' },
]
