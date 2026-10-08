import type { Theme } from '../app/useTheme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      className="glass grid size-11 place-items-center rounded-2xl text-lg transition active:scale-95"
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={dark ? 'Light' : 'Dark'}
    >
      {dark ? '☾' : '☀︎'}
    </button>
  )
}
