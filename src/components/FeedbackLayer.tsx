import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { achievementById } from '../config/achievements'
import { statDef } from '../config/stats'
import { useGame } from '../store/GameContext'
import type { GameEffect } from '../types'
import { days, money } from '../utils/format'
import { Button } from './Button'

const BIG: GameEffect['type'][] = ['level', 'bossDefeated', 'achievement']

/** Короткие строки результата: «+25 XP», «Career +10 XP», «🐉 −10 HP» */
function lines(effects: GameEffect[]): string[] {
  const out: string[] = []
  for (const e of effects) {
    if (e.type === 'quest') {
      out.push(`+${e.xp} XP · +${e.gold} gold`)
      out.push(`${statDef(e.stat).emoji} ${statDef(e.stat).label} +${e.statXp} XP`)
    }
    if (e.type === 'statLevel') out.push(`${statDef(e.stat).label} → Lv ${e.level}`)
    if (e.type === 'bossHit') out.push(`${e.emoji} ${e.name} −${e.damage} HP`)
    if (e.type === 'milestone') out.push(`🎯 ${e.title} · +${e.xp} XP`)
    if (e.type === 'income') out.push(`💰 +${money(e.amount)} записано`)
    if (e.type === 'streak' && e.days > 1) out.push(`🔥 ${days(e.days)} подряд${e.shieldUsed ? ' · щит сработал 🛡' : ''}`)
  }
  return out
}

export function FeedbackLayer() {
  const { effects, clearEffects } = useGame()
  const big = effects.some((e) => BIG.includes(e.type))

  useEffect(() => {
    if (!effects.length || big) return
    const t = setTimeout(clearEffects, 3200)
    return () => clearTimeout(t)
  }, [effects, big, clearEffects])

  if (!effects.length) return null
  const quest = effects.find((e) => e.type === 'quest')
  const heading = quest ? (quest.status === 'partial' ? 'Progress made' : 'Quest completed') : effects[0].type === 'income' ? 'Real money' : 'Progress'

  if (!big) {
    return createPortal(
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pb-safe">
        <button
          onClick={clearEffects}
          className="pointer-events-auto w-full max-w-sm animate-rise rounded-3xl border border-line bg-bg/90 p-4 text-left shadow-2xl backdrop-blur-xl"
        >
          <p className="eyebrow text-accent">{heading}</p>
          <ul className="mt-1.5 space-y-0.5">
            {lines(effects).map((l, i) => (
              <li key={i} className={i === 0 ? 'text-xl font-semibold' : 'text-sm text-muted'}>
                {l}
              </li>
            ))}
          </ul>
        </button>
      </div>,
      document.body,
    )
  }

  const level = effects.find((e) => e.type === 'level')
  const boss = effects.find((e) => e.type === 'bossDefeated')
  const achievements = effects.filter((e) => e.type === 'achievement')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-black/70 backdrop-blur-sm" onClick={clearEffects} />
      <div className="relative w-full max-w-sm animate-rise overflow-hidden rounded-[32px] border border-line bg-bg p-6 text-center shadow-2xl">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full opacity-50 blur-3xl" style={{ background: 'var(--accent)' }} />
        <div className="relative">
          {level && (
            <>
              <p className="eyebrow text-accent">Level up</p>
              <p className="mt-2 text-7xl leading-none font-semibold tracking-tight">{level.level}</p>
              <p className="mt-2 font-display text-2xl italic">{level.title}</p>
            </>
          )}
          {boss && boss.type === 'bossDefeated' && (
            <div className={level ? 'mt-6' : ''}>
              <p className="text-5xl">{boss.emoji}</p>
              <p className="eyebrow mt-3 text-accent">Boss defeated</p>
              <p className="mt-1 font-display text-2xl font-semibold">{boss.name}</p>
              <p className="mt-1 text-sm text-muted">
                +{boss.xp} XP · +{boss.gold} gold{boss.next ? ` · следующий: ${boss.next}` : ''}
              </p>
            </div>
          )}
          {achievements.length > 0 && (
            <div className="mt-6 space-y-2">
              {achievements.map((a) => {
                const def = a.type === 'achievement' ? achievementById(a.id) : undefined
                return (
                  def && (
                    <div key={def.id} className="flex items-center gap-3 rounded-2xl bg-accent-soft p-3 text-left">
                      <span className="text-2xl">{def.emoji}</span>
                      <span>
                        <span className="block text-[11px] font-semibold tracking-[0.12em] text-accent uppercase">Achievement unlocked</span>
                        <span className="block font-semibold">{def.title}</span>
                      </span>
                    </div>
                  )
                )
              })}
            </div>
          )}
          <ul className="mt-5 space-y-0.5 text-sm text-muted">
            {lines(effects).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
          <Button className="mt-6 w-full" onClick={clearEffects}>
            Дальше — в реальную жизнь
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
