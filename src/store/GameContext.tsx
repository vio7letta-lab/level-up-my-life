import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as engine from '../game/engine'
import { toISODate } from '../game/dates'
import { createInitialState } from '../game/initialState'
import { LocalStorageAdapter } from '../storage/localStorageAdapter'
import type { StorageAdapter } from '../storage/StorageAdapter'
import type { GameEffect, GameState, ISODate, QuestResult } from '../types'

type Action = (state: GameState, now: Date) => engine.ActionResult

interface GameApi {
  state: GameState
  today: ISODate
  /** эффекты последнего действия — для feedback и анимаций */
  effects: GameEffect[]
  clearEffects: () => void
  completeQuest: (id: string, result: QuestResult) => void
  reopenQuest: (id: string) => void
  addQuest: (input: engine.QuestInput) => void
  updateQuest: (id: string, input: engine.QuestInput) => void
  deleteQuest: (id: string) => void
  swapQuest: (id: string) => void
  addIncome: (input: { amount: number; source: string; date: ISODate }) => void
  deleteIncome: (id: string) => void
  createGoal: (input: engine.GoalInput) => void
  deleteGoal: (id: string) => void
  setGoalValue: (id: string, value: number) => void
  completeMilestone: (goalId: string, milestoneId: string) => void
  setPlayerName: (name: string) => void
  resetProgress: () => void
}

const GameContext = createContext<GameApi | null>(null)

const storage: StorageAdapter = new LocalStorageAdapter()

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null)
  const [effects, setEffects] = useState<GameEffect[]>([])
  const [today, setToday] = useState(() => toISODate(new Date()))
  const stateRef = useRef<GameState | null>(null)
  stateRef.current = state

  // Загрузка сохранения (или новая игра)
  useEffect(() => {
    storage.load().then((saved) => {
      const now = new Date()
      setState(engine.startDay(saved ?? createInitialState(now), now))
    })
  }, [])

  // Сохранение после каждого изменения
  useEffect(() => {
    if (state) storage.save(state)
  }, [state])

  // Новый день: когда приложение снова открыли (например, утром из фона)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const now = new Date()
      setToday(toISODate(now))
      setState((s) => (s ? engine.startDay(s, now) : s))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const run = useCallback((action: Action) => {
    const current = stateRef.current
    if (!current) return
    const now = new Date()
    const result = action(engine.startDay(current, now), now)
    stateRef.current = result.state
    // сохраняем сразу, не дожидаясь перерисовки: на iPhone приложение могут закрыть мгновенно
    storage.save(result.state)
    setToday(toISODate(now))
    setState(result.state)
    if (result.effects.length) setEffects(result.effects)
  }, [])

  const api = useMemo<GameApi | null>(() => {
    if (!state) return null
    return {
      state,
      today,
      effects,
      clearEffects: () => setEffects([]),
      completeQuest: (id, result) => run((s, now) => engine.completeQuest(s, id, result, now)),
      reopenQuest: (id) => run((s, now) => engine.reopenQuest(s, id, now)),
      addQuest: (input) => run((s, now) => engine.addQuest(s, input, now)),
      updateQuest: (id, input) => run((s, now) => engine.updateQuest(s, id, input, now)),
      deleteQuest: (id) => run((s) => engine.deleteQuest(s, id)),
      swapQuest: (id) => run((s, now) => engine.swapQuest(s, id, now)),
      addIncome: (input) => run((s, now) => engine.addIncome(s, input, now)),
      deleteIncome: (id) => run((s) => engine.deleteIncome(s, id)),
      createGoal: (input) => run((s, now) => engine.createGoal(s, input, now)),
      deleteGoal: (id) => run((s) => engine.deleteGoal(s, id)),
      setGoalValue: (id, value) => run((s, now) => engine.setGoalValue(s, id, value, now)),
      completeMilestone: (goalId, mId) => run((s, now) => engine.completeMilestone(s, goalId, mId, now)),
      setPlayerName: (name) => run((s) => engine.setPlayerName(s, name)),
      resetProgress: () =>
        run((s, now) => ({ state: engine.startDay(createInitialState(now, s.profile.name), now), effects: [] })),
    }
  }, [state, today, effects, run])

  if (!api) return null
  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
