import type { StatKey } from '../types'

export interface StatDef {
  key: StatKey
  emoji: string
  label: string
  description: string
  /** приглушённый оттенок для полосок прогресса — без кислотных цветов */
  tint: string
}

export const STATS: StatDef[] = [
  { key: 'finance', emoji: '💰', label: 'Finance', description: 'Деньги и финансовая самостоятельность', tint: '#d9c79a' },
  { key: 'career', emoji: '💼', label: 'Career', description: 'Карьера и профессиональные навыки', tint: '#b9a7e8' },
  { key: 'media', emoji: '📱', label: 'Media', description: 'Блог, личный бренд, публичность', tint: '#e0a9c4' },
  { key: 'knowledge', emoji: '🧠', label: 'Knowledge', description: 'Знания и обучение', tint: '#a9bde6' },
  { key: 'energy', emoji: '💃', label: 'Energy', description: 'Энергия, движение, танцы', tint: '#e6b7a5' },
  { key: 'social', emoji: '🤝', label: 'Social', description: 'Знакомства, связи, коммуникация', tint: '#b7d1c4' },
  { key: 'freedom', emoji: '🌍', label: 'Freedom', description: 'Независимость, путешествия, возможности', tint: '#cfc6f2' },
]
