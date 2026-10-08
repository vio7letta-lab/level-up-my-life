import { useState, type ReactNode } from 'react'
import { readPrefs, writePrefs } from './app/prefs'
import { useRoute, type Route } from './app/routes'
import { ImportLauncherProvider } from './app/importLauncher'
import { useTheme } from './app/useTheme'
import { isImportHash } from './sources/ShortcutUrlSource'
import { BottomNav } from './components/BottomNav'
import { FeedbackLayer } from './components/FeedbackLayer'
import { CharacterScreen } from './screens/CharacterScreen'
import { GoalsScreen } from './screens/GoalsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { QuestsScreen, type QuestsTab } from './screens/QuestsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { GameProvider } from './store/GameContext'

const isQuestsTab = (p?: string): p is QuestsTab => p === 'today' || p === 'inbox' || p === 'backlog' || p === 'history'

export default function App() {
  const { theme, toggle } = useTheme()
  const { route, param, navigate } = useRoute()
  const [welcomeSeen, setWelcomeSeen] = useState(() => readPrefs().welcomeSeen === true)

  if (!welcomeSeen) {
    return (
      <WelcomeScreen
        onDone={() => {
          writePrefs({ welcomeSeen: true })
          setWelcomeSeen(true)
          // пришли по ссылке импорта из Shortcut — не теряем её после приветствия
          if (!isImportHash(location.hash)) navigate('home')
        }}
      />
    )
  }

  const screens: Record<Route, ReactNode> = {
    home: <HomeScreen onOpenGoal={(id) => navigate('goals', id)} onOpenQuests={(t) => navigate('quests', t)} />,
    goals: <GoalsScreen goalId={param} onOpen={(id) => navigate('goals', id)} />,
    quests: <QuestsScreen tab={isQuestsTab(param) ? param : 'today'} onTab={(t) => navigate('quests', t === 'today' ? undefined : t)} />,
    stats: <StatsScreen />,
    character: <CharacterScreen theme={theme} onToggleTheme={toggle} />,
  }

  return (
    <GameProvider>
      <ImportLauncherProvider>
        <main key={`${route}/${param ?? ''}`} className="pt-safe mx-auto max-w-xl animate-fade px-4 pb-32">
          <div className="pt-8">{screens[route]}</div>
        </main>
        <BottomNav route={route} onNavigate={navigate} />
        <FeedbackLayer />
      </ImportLauncherProvider>
    </GameProvider>
  )
}
