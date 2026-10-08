import { useState, type ReactNode } from 'react'
import { readPrefs, writePrefs } from './app/prefs'
import { useRoute, type Route } from './app/routes'
import { useTheme } from './app/useTheme'
import { BottomNav } from './components/BottomNav'
import { FeedbackLayer } from './components/FeedbackLayer'
import { CharacterScreen } from './screens/CharacterScreen'
import { GoalsScreen } from './screens/GoalsScreen'
import { HomeScreen } from './screens/HomeScreen'
import { QuestsScreen } from './screens/QuestsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { GameProvider } from './store/GameContext'

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
          navigate('home')
        }}
      />
    )
  }

  const screens: Record<Route, ReactNode> = {
    home: <HomeScreen onOpenGoal={(id) => navigate('goals', id)} />,
    goals: <GoalsScreen goalId={param} onOpen={(id) => navigate('goals', id)} />,
    quests: <QuestsScreen />,
    stats: <StatsScreen />,
    character: <CharacterScreen theme={theme} onToggleTheme={toggle} />,
  }

  return (
    <GameProvider>
      <main key={`${route}/${param ?? ''}`} className="pt-safe mx-auto max-w-xl animate-fade px-4 pb-32">
        <div className="pt-8">{screens[route]}</div>
      </main>
      <BottomNav route={route} onNavigate={navigate} />
      <FeedbackLayer />
    </GameProvider>
  )
}
