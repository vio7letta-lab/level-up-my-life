/**
 * Мелкие настройки интерфейса (тема, «приветствие показано»).
 * Это НЕ игровое состояние — оно появится на Этапе 1 через StorageAdapter.
 */
export interface Prefs {
  theme?: 'dark' | 'light'
  welcomeSeen?: boolean
}

const KEY = 'lumyl:prefs'

export function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Prefs
  } catch {
    return {}
  }
}

export function writePrefs(patch: Partial<Prefs>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...patch }))
  } catch {
    // приватный режим / хранилище недоступно — интерфейс работает и без него
  }
}
