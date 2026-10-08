import { useEffect, useState } from 'react'

export type Route = 'home' | 'goals' | 'quests' | 'stats' | 'character'

export const ROUTES: { id: Route; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'quests', label: 'Quests', icon: '⚔️' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'character', label: 'Character', icon: '👤' },
]

function parse(hash: string): Route {
  const id = hash.replace(/^#\/?/, '')
  return ROUTES.some((r) => r.id === id) ? (id as Route) : 'home'
}

/** Простая hash-навигация (#/goals) — работает на GitHub Pages без настройки сервера. */
export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parse(location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return { route, navigate: (r: Route) => (location.hash = `/${r}`) }
}
