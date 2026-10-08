import { useEffect, useState } from 'react'
import { readPrefs, writePrefs } from './prefs'

export type Theme = 'dark' | 'light'

const THEME_COLOR: Record<Theme, string> = { dark: '#0c0b0f', light: '#f5f1ea' }

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readPrefs().theme ?? 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
    writePrefs({ theme })
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
