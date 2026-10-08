import { useEffect, useState } from 'react'

export type Route = 'home' | 'goals' | 'quests' | 'stats' | 'character'

export const ROUTES: { id: Route; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'quests', label: 'Quests', icon: '⚔️' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'character', label: 'Character', icon: '👤' },
]

function parse(hash: string): { route: Route; param?: string } {
  const [id, param] = hash.replace(/^#\/?/, '').split('/')
  return ROUTES.some((r) => r.id === id) ? { route: id as Route, param: param || undefined } : { route: 'home' }
}

/** Простая hash-навигация (#/goals, #/goals/<id>) — работает на GitHub Pages без настройки сервера. */
export function useRoute() {
  const [current, setCurrent] = useState(() => parse(location.hash))

  useEffect(() => {
    const onChange = () => {
      setCurrent(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return {
    route: current.route,
    param: current.param,
    navigate: (r: Route, param?: string) => (location.hash = param ? `/${r}/${param}` : `/${r}`),
  }
}
