import type { GameState } from '../types'

/**
 * Хранилище состояния игры.
 *
 * Сейчас будет одна реализация — localStorage (Этап 1).
 * Позже сюда же подключается облачная синхронизация с аккаунтом,
 * не трогая экраны и игровую логику.
 */
export interface StorageAdapter {
  load(): Promise<GameState | null>
  save(state: GameState): Promise<void>
  clear(): Promise<void>
}
