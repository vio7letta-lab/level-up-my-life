import type { GameState } from '../types'
import { migrate } from './migrations'
import type { StorageAdapter } from './StorageAdapter'

export const GAME_KEY = 'lumyl:game'

/** Хранение в браузере. Повреждённые данные не удаляются молча, а откладываются в резервный ключ. */
export class LocalStorageAdapter implements StorageAdapter {
  constructor(private key = GAME_KEY) {}

  async load(): Promise<GameState | null> {
    let text: string | null = null
    try {
      text = localStorage.getItem(this.key)
      if (!text) return null
      const raw = JSON.parse(text)
      const state = migrate(raw)
      if (!state) throw new Error('unsupported data')
      // перед обновлением формата сохраняем копию старых данных — на всякий случай
      if (raw.version !== state.version) {
        try {
          localStorage.setItem(`${this.key}:backup-v${raw.version}`, text)
        } catch {
          // нет места — миграция всё равно продолжится
        }
      }
      return state
    } catch (e) {
      console.error('Не удалось прочитать сохранение', e)
      try {
        if (text) localStorage.setItem(`${this.key}:broken:${Date.now()}`, text)
      } catch {
        // нет места — ничего не поделать
      }
      return null
    }
  }

  async save(state: GameState): Promise<void> {
    try {
      localStorage.setItem(this.key, JSON.stringify(state))
    } catch (e) {
      console.error('Не удалось сохранить прогресс', e)
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.key)
    } catch {
      // хранилище недоступно
    }
  }
}
