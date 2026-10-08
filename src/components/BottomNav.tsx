import { ROUTES, type Route } from '../app/routes'

export function BottomNav({ route, onNavigate }: { route: Route; onNavigate: (r: Route) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-nav pb-safe backdrop-blur-xl"
      aria-label="Основное меню"
    >
      <ul className="mx-auto flex max-w-xl">
        {ROUTES.map((r) => {
          const active = r.id === route
          return (
            <li key={r.id} className="flex-1">
              <button
                onClick={() => onNavigate(r.id)}
                aria-current={active ? 'page' : undefined}
                className="flex h-16 w-full flex-col items-center justify-center gap-1"
              >
                <span
                  className={`text-[22px] leading-none transition duration-300 ${
                    active ? 'scale-110' : 'opacity-45 grayscale'
                  }`}
                >
                  {r.icon}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-[0.08em] uppercase transition-colors ${
                    active ? 'text-accent' : 'text-faint'
                  }`}
                >
                  {r.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
