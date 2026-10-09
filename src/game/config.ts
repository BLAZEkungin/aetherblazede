import type { Fighter } from '@/data/fighters'
import type { StoryFight } from '@/data/story'
import { getFighter } from '@/data/fighters'
import type { CombatantConfig } from './engine'

export const difficulties = [
  { id: 'easy', label: 'Squire', value: 0.25 },
  { id: 'normal', label: 'Knight', value: 0.55 },
  { id: 'hard', label: 'Legend', value: 0.9 },
] as const

export type DifficultyId = (typeof difficulties)[number]['id']

export function fighterConfig(f: Fighter, ai: boolean, difficulty = 0.5, hpScale = 1): CombatantConfig {
  return {
    name: f.name,
    weaponType: f.weaponType,
    color: f.color,
    accent: f.accent,
    power: f.stats.power,
    speed: f.stats.speed,
    defense: f.stats.defense,
    magic: f.stats.magic,
    ai,
    difficulty,
    hpScale,
  }
}

export function storyOpponentConfig(fight: StoryFight): CombatantConfig {
  if (fight.isBoss && fight.bossId) {
    const boss = getFighter(fight.bossId)!
    return fighterConfig(boss, true, fight.difficulty, 1.1 + fight.difficulty * 0.3)
  }
  const d = fight.difficulty
  const stat = (base: number) => Math.round(Math.min(10, base + d * 5))
  return {
    name: fight.opponentName,
    weaponType: fight.weaponType,
    color: fight.color,
    accent: fight.accent,
    power: stat(3),
    speed: stat(3),
    defense: stat(2),
    magic: stat(3),
    ai: true,
    difficulty: d,
    hpScale: 0.7 + d * 0.4,
  }
}
