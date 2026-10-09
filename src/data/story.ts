// Story mode fixtures. Each legend climbs a 45-fight ladder split into nine
// chapters of five fights. Every 5th fight is a boss battle against one of the
// other nine playable legends, so each journey meets the full roster.

import { fighters, getFighter, type Fighter, type WeaponType } from './fighters'

export interface Minion {
  name: string
  weaponType: WeaponType
  color: string
  accent: string
}

export interface StoryFight {
  stage: number // 1..45
  chapter: number // 1..9
  isBoss: boolean
  opponentName: string
  opponentTitle: string
  weaponType: WeaponType
  color: string
  accent: string
  bossId?: string
  difficulty: number // 0..1, scales AI aggression and opponent health
}

export interface Chapter {
  number: number
  name: string
  location: string
  fights: StoryFight[]
}

const chapterNames = [
  ['The Ember Road', 'Outskirts of the Ashen Citadel'],
  ['Winds of Exile', 'The Whispering Steppe'],
  ['Into the Deep', 'Deepforge Holds'],
  ['Tower of Stars', 'The Pale Tower'],
  ['Moon over Water', 'The Veiled Isles'],
  ['Eye of the Storm', 'Stormcrown Peaks'],
  ['The Long Winter', 'The Frozen Wastes'],
  ['Crypts of Thorn', 'Thornwood Crypts'],
  ['The Last Dawn', 'Sunspire Cathedral'],
] as const

// Nine regions × four regular foes = the 36 non-boss fights.
const minionsByChapter: Minion[][] = [
  [
    { name: 'Ashen Legionnaire', weaponType: 'sword', color: '#6b4a3a', accent: '#ff7a3d' },
    { name: 'Cinder Hound Rider', weaponType: 'spear', color: '#7a3a24', accent: '#ffa04d' },
    { name: 'Smoke Archer', weaponType: 'bow', color: '#4d4d4d', accent: '#ffb347' },
    { name: 'Molten Brute', weaponType: 'hammer', color: '#8a3b1a', accent: '#ffcf70' },
  ],
  [
    { name: 'Steppe Raider', weaponType: 'axes', color: '#6e7b4a', accent: '#d5f2a8' },
    { name: 'Dust Witch', weaponType: 'staff', color: '#8a7a54', accent: '#f5e3a0' },
    { name: 'Gale Outrider', weaponType: 'spear', color: '#3f8a6e', accent: '#c8ffe9' },
    { name: 'Hawk-Eye Ranger', weaponType: 'bow', color: '#4f7a3a', accent: '#e0ffbf' },
  ],
  [
    { name: 'Tunnel Warden', weaponType: 'hammer', color: '#5c5248', accent: '#d9b98a' },
    { name: 'Forge Golem', weaponType: 'hammer', color: '#6b5a44', accent: '#ff9a3d' },
    { name: 'Deep Delver', weaponType: 'axes', color: '#4a4440', accent: '#ccbca0' },
    { name: 'Rune Priest', weaponType: 'staff', color: '#594a3a', accent: '#ffd27a' },
  ],
  [
    { name: 'Tower Acolyte', weaponType: 'staff', color: '#5a4a8a', accent: '#d9ccff' },
    { name: 'Starbound Sentinel', weaponType: 'swordShield', color: '#4a4f8a', accent: '#c7d0ff' },
    { name: 'Glyph Duelist', weaponType: 'sword', color: '#6b4a9a', accent: '#eadbff' },
    { name: 'Astral Familiar', weaponType: 'daggers', color: '#7a5aff', accent: '#ffffff' },
  ],
  [
    { name: 'Tide Ronin', weaponType: 'katana', color: '#3a4f6b', accent: '#9fc4ff' },
    { name: 'Kunai Shade', weaponType: 'daggers', color: '#2d3346', accent: '#aab6d6' },
    { name: 'Lantern Monk', weaponType: 'staff', color: '#5a4a3a', accent: '#ffcf8a' },
    { name: 'Mist Spearman', weaponType: 'spear', color: '#44566b', accent: '#d0e0f0' },
  ],
  [
    { name: 'Thunder Zealot', weaponType: 'spear', color: '#2f5a8a', accent: '#fff36b' },
    { name: 'Cloud Giant Whelp', weaponType: 'hammer', color: '#6a7a8a', accent: '#e0f0ff' },
    { name: 'Static Skirmisher', weaponType: 'daggers', color: '#3a6aa7', accent: '#fff9a0' },
    { name: 'Sky Marksman', weaponType: 'bow', color: '#4a6a8a', accent: '#bfe3ff' },
  ],
  [
    { name: 'Frostbitten Berserker', weaponType: 'axes', color: '#5a7a8a', accent: '#e0f8ff' },
    { name: 'Rime Witch', weaponType: 'staff', color: '#7aa0b0', accent: '#ffffff' },
    { name: 'Glacier Huscarl', weaponType: 'swordShield', color: '#4a6a7a', accent: '#bff0ff' },
    { name: 'Snow Stalker', weaponType: 'bow', color: '#8aa0aa', accent: '#ffffff' },
  ],
  [
    { name: 'Crypt Ghoul', weaponType: 'daggers', color: '#4a3a3f', accent: '#ff8aa3' },
    { name: 'Bone Reaver', weaponType: 'scythe', color: '#6b5a5a', accent: '#ffccd5' },
    { name: 'Thorn Cultist', weaponType: 'staff', color: '#5a1a2a', accent: '#ff5a7a' },
    { name: 'Grave Knight', weaponType: 'sword', color: '#3a2a2f', accent: '#c2183f' },
  ],
  [
    { name: 'Fallen Templar', weaponType: 'swordShield', color: '#8a7a4a', accent: '#fff3b0' },
    { name: 'Sunscorched Inquisitor', weaponType: 'hammer', color: '#a08a3a', accent: '#fff8d6' },
    { name: 'Hollow Seraph', weaponType: 'spear', color: '#b0a070', accent: '#ffffff' },
    { name: 'Eclipse Herald', weaponType: 'katana', color: '#2a2a3a', accent: '#f4c542' },
  ],
]

const tierTitles = ['Initiate', 'Veteran', 'Elite', 'Champion']

// Rotate the roster so each legend meets the other nine in a distinct order.
export function bossOrder(fighterId: string): Fighter[] {
  const i = fighters.findIndex((f) => f.id === fighterId)
  const others: Fighter[] = []
  for (let step = 1; step < fighters.length; step++) {
    others.push(fighters[(i + step * 3) % fighters.length])
  }
  // step*3 mod 10 covers all nine others because gcd(3, 10) = 1
  return others
}

export function buildStory(fighterId: string): Chapter[] {
  const bosses = bossOrder(fighterId)
  return chapterNames.map(([name, location], c) => {
    const fights: StoryFight[] = []
    for (let n = 0; n < 5; n++) {
      const stage = c * 5 + n + 1
      const difficulty = Math.min(1, 0.12 + (stage - 1) / 44 * 0.85)
      if (n === 4) {
        const boss = bosses[c]
        fights.push({
          stage,
          chapter: c + 1,
          isBoss: true,
          opponentName: boss.name,
          opponentTitle: boss.title,
          weaponType: boss.weaponType,
          color: boss.color,
          accent: boss.accent,
          bossId: boss.id,
          difficulty: Math.min(1, difficulty + 0.1),
        })
      } else {
        const m = minionsByChapter[c][n]
        fights.push({
          stage,
          chapter: c + 1,
          isBoss: false,
          opponentName: m.name,
          opponentTitle: `${tierTitles[n]} of ${location.replace(/^The /, '')}`,
          weaponType: m.weaponType,
          color: m.color,
          accent: m.accent,
          difficulty,
        })
      }
    }
    return { number: c + 1, name, location, fights }
  })
}

export function getStoryFight(fighterId: string, stage: number): StoryFight | undefined {
  if (!getFighter(fighterId)) return undefined
  return buildStory(fighterId)
    .flatMap((c) => c.fights)
    .find((f) => f.stage === stage)
}

// Stubbed progress — replaced by persisted per-player progress in a later milestone.
export const demoProgress: Record<string, number> = {
  kael: 7,
  lyra: 3,
}
