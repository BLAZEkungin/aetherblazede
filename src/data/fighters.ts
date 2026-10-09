// Roster fixtures — the ten playable legends of Aetherblade.
// Static game-design data: later milestones keep this as the source of truth
// for fighter definitions and persist only player progress.

export type WeaponType =
  | 'sword'
  | 'bow'
  | 'hammer'
  | 'staff'
  | 'katana'
  | 'spear'
  | 'axes'
  | 'scythe'
  | 'swordShield'
  | 'daggers'

export type Element =
  | 'Fire'
  | 'Wind'
  | 'Earth'
  | 'Arcane'
  | 'Shadow'
  | 'Lightning'
  | 'Frost'
  | 'Blood'
  | 'Light'
  | 'Venom'

export type AbilityKind = 'weapon' | 'magic' | 'ultimate'

export interface Ability {
  name: string
  kind: AbilityKind
  key: string
  description: string
}

export interface FighterStats {
  power: number
  speed: number
  range: number
  defense: number
  magic: number
}

export interface Fighter {
  id: string
  name: string
  title: string
  weapon: string
  weaponType: WeaponType
  element: Element
  color: string
  accent: string
  realm: string
  quote: string
  bio: string
  stats: FighterStats
  abilities: Ability[]
}

export const fighters: Fighter[] = [
  {
    id: 'kael',
    name: 'Kael Ashborne',
    title: 'The Ember Knight',
    weapon: 'Cinderfang Longsword',
    weaponType: 'sword',
    element: 'Fire',
    color: '#e8552b',
    accent: '#ffb347',
    realm: 'Ashen Citadel',
    quote: 'Every scar is a coal. I burn brighter for each.',
    bio: 'The last knight of a citadel swallowed by volcanic fire, Kael bound the flame to his blade rather than let it take him. Balanced, relentless, and impossible to put out.',
    stats: { power: 8, speed: 6, range: 5, defense: 6, magic: 6 },
    abilities: [
      { name: 'Cinder Slash', kind: 'weapon', key: 'J', description: 'A fast three-hit sword combo that leaves trails of embers.' },
      { name: 'Molten Cleave', kind: 'weapon', key: 'K', description: 'An overhead heavy strike that breaks guards.' },
      { name: 'Flame Lance', kind: 'magic', key: 'L', description: 'Hurls a spear of fire straight at the enemy.' },
      { name: 'Phoenix Rebirth', kind: 'ultimate', key: 'U', description: 'Erupts in a ring of fire, scorching everything nearby.' },
    ],
  },
  {
    id: 'lyra',
    name: 'Lyra Windrunner',
    title: 'Huntress of the Gale',
    weapon: 'Skysong Longbow',
    weaponType: 'bow',
    element: 'Wind',
    color: '#3fc59a',
    accent: '#c8ffe9',
    realm: 'Whispering Steppe',
    quote: 'You will hear the wind before you feel the arrow.',
    bio: 'Raised by nomads who read the sky like a map, Lyra fights from range and never stays still. Close the gap on her if you can — the wind rarely lets you.',
    stats: { power: 5, speed: 9, range: 10, defense: 4, magic: 6 },
    abilities: [
      { name: 'Gale Arrow', kind: 'weapon', key: 'J', description: 'A rapid-fire arrow that travels the length of the arena.' },
      { name: 'Piercing Shot', kind: 'weapon', key: 'K', description: 'A fully drawn arrow that hits hard and flies fast.' },
      { name: 'Cyclone Burst', kind: 'magic', key: 'L', description: 'A whirling bolt of wind that knocks enemies back.' },
      { name: 'Thousand Feathers', kind: 'ultimate', key: 'U', description: 'Rains a volley of wind-charged arrows in a wide arc.' },
    ],
  },
  {
    id: 'thorne',
    name: 'Thorne Ironvow',
    title: 'The Mountain Breaker',
    weapon: 'Gravemaul Warhammer',
    weaponType: 'hammer',
    element: 'Earth',
    color: '#b07d3c',
    accent: '#e9d29a',
    realm: 'Deepforge Holds',
    quote: 'Mountains do not move. I do.',
    bio: 'A dwarven-blooded smith-warrior who swore an iron vow to guard the deep forges. Slow to swing, but each blow lands like a landslide.',
    stats: { power: 10, speed: 3, range: 5, defense: 9, magic: 4 },
    abilities: [
      { name: 'Anvil Strike', kind: 'weapon', key: 'J', description: 'A crushing horizontal swing of the maul.' },
      { name: 'Quake Slam', kind: 'weapon', key: 'K', description: 'Brings the hammer down with ground-shaking force.' },
      { name: 'Boulder Toss', kind: 'magic', key: 'L', description: 'Rips a boulder from the earth and launches it.' },
      { name: 'Tectonic Fury', kind: 'ultimate', key: 'U', description: 'Shatters the arena floor in a massive shockwave.' },
    ],
  },
  {
    id: 'seren',
    name: 'Seren Moonveil',
    title: 'Archmage of the Pale Tower',
    weapon: 'Lunaris Staff',
    weaponType: 'staff',
    element: 'Arcane',
    color: '#8f6bff',
    accent: '#e2d6ff',
    realm: 'Pale Tower',
    quote: 'Magic is just patience, sharpened.',
    bio: 'The youngest archmage the Pale Tower has ever crowned. Seren is fragile up close, but her arcane barrage controls the entire arena.',
    stats: { power: 5, speed: 5, range: 8, defense: 4, magic: 10 },
    abilities: [
      { name: 'Staff Sweep', kind: 'weapon', key: 'J', description: 'A quick staff strike to keep enemies at bay.' },
      { name: 'Moonhammer', kind: 'weapon', key: 'K', description: 'A crushing two-handed blow charged with arcane force.' },
      { name: 'Astral Orb', kind: 'magic', key: 'L', description: 'Launches a homing orb of pure arcane energy. Costs less mana.' },
      { name: 'Eclipse Nova', kind: 'ultimate', key: 'U', description: 'Detonates a lunar nova that devastates the area around her.' },
    ],
  },
  {
    id: 'ryuji',
    name: 'Ryuji Kage',
    title: 'The Silent Blade',
    weapon: 'Yoru no Kiba Katana',
    weaponType: 'katana',
    element: 'Shadow',
    color: '#5a6c8c',
    accent: '#c0cbe0',
    realm: 'Veiled Isles',
    quote: 'The cut you see is not the one that kills.',
    bio: 'An exiled shadow-clan swordsman who walks between moonlight and darkness. Ryuji wins with speed and precision, punishing any opening.',
    stats: { power: 7, speed: 10, range: 5, defense: 4, magic: 6 },
    abilities: [
      { name: 'Iaido Flash', kind: 'weapon', key: 'J', description: 'A lightning-fast draw cut.' },
      { name: 'Crescent Rend', kind: 'weapon', key: 'K', description: 'A wide arcing slash with long reach.' },
      { name: 'Shadow Shuriken', kind: 'magic', key: 'L', description: 'Throws a spinning blade of condensed shadow.' },
      { name: 'Thousand Cuts', kind: 'ultimate', key: 'U', description: 'Vanishes into shadow and slashes everything around him.' },
    ],
  },
  {
    id: 'vex',
    name: 'Vex Stormcaller',
    title: 'Herald of the Tempest',
    weapon: 'Thunderpike Spear',
    weaponType: 'spear',
    element: 'Lightning',
    color: '#3aa7ff',
    accent: '#fff36b',
    realm: 'Stormcrown Peaks',
    quote: 'Thunder is just the sky agreeing with me.',
    bio: 'A storm-touched warrior who caught a lightning bolt on her spear and never let go. Vex controls space with long reach and crackling strikes.',
    stats: { power: 7, speed: 7, range: 8, defense: 5, magic: 7 },
    abilities: [
      { name: 'Thunder Thrust', kind: 'weapon', key: 'J', description: 'A long-reaching spear jab.' },
      { name: 'Skyfall Sweep', kind: 'weapon', key: 'K', description: 'A spinning spear sweep that hits hard.' },
      { name: 'Chain Bolt', kind: 'magic', key: 'L', description: 'Fires a fast bolt of lightning.' },
      { name: 'Wrath of the Storm', kind: 'ultimate', key: 'U', description: 'Calls a storm surge that electrifies the ground around her.' },
    ],
  },
  {
    id: 'mara',
    name: 'Mara Frostfang',
    title: 'Jarl of the Frozen Wastes',
    weapon: 'Twin Rimeaxes',
    weaponType: 'axes',
    element: 'Frost',
    color: '#7fd8ff',
    accent: '#ffffff',
    realm: 'Frozen Wastes',
    quote: 'Winter does not ask. Winter takes.',
    bio: 'Chieftain of the northern clans, Mara wields twin axes carved from glacier ice. Aggressive and tough, she freezes enemies in their tracks.',
    stats: { power: 8, speed: 6, range: 4, defense: 7, magic: 5 },
    abilities: [
      { name: 'Rime Rend', kind: 'weapon', key: 'J', description: 'Rapid alternating axe chops.' },
      { name: 'Glacier Split', kind: 'weapon', key: 'K', description: 'Both axes crash down at once.' },
      { name: 'Frost Shard', kind: 'magic', key: 'L', description: 'Launches a jagged shard of ice.' },
      { name: 'Endless Winter', kind: 'ultimate', key: 'U', description: 'Unleashes a blizzard burst around her.' },
    ],
  },
  {
    id: 'oren',
    name: 'Oren Bloodthorn',
    title: 'The Crimson Reaper',
    weapon: 'Vespertine Scythe',
    weaponType: 'scythe',
    element: 'Blood',
    color: '#c2183f',
    accent: '#ff8aa3',
    realm: 'Thornwood Crypts',
    quote: 'Your heartbeat is loud. Let me quiet it.',
    bio: 'A crypt-born blood mage whose scythe drinks from every wound. Oren trades health for power and turns long fights into his hunting ground.',
    stats: { power: 8, speed: 5, range: 7, defense: 5, magic: 8 },
    abilities: [
      { name: 'Reaping Arc', kind: 'weapon', key: 'J', description: 'A wide scythe slash with deceptive reach.' },
      { name: 'Harvest', kind: 'weapon', key: 'K', description: 'A heavy hooking strike that drains life.' },
      { name: 'Blood Lance', kind: 'magic', key: 'L', description: 'Fires a crimson spike of hardened blood.' },
      { name: 'Crimson Moon', kind: 'ultimate', key: 'U', description: 'A blood-red eruption that heals Oren as it hurts.' },
    ],
  },
  {
    id: 'isolde',
    name: 'Isolde Dawnshield',
    title: 'Paladin of the First Light',
    weapon: 'Solace Blade & Aegis',
    weaponType: 'swordShield',
    element: 'Light',
    color: '#f4c542',
    accent: '#fff8d6',
    realm: 'Sunspire Cathedral',
    quote: 'I am the wall between you and the dark.',
    bio: 'Sworn protector of the Sunspire, Isolde fights behind a radiant shield. The sturdiest defender in the roster, with holy magic to punish the reckless.',
    stats: { power: 6, speed: 5, range: 4, defense: 10, magic: 7 },
    abilities: [
      { name: 'Oathstrike', kind: 'weapon', key: 'J', description: 'A disciplined sword thrust.' },
      { name: 'Aegis Bash', kind: 'weapon', key: 'K', description: 'Slams the shield forward to stagger foes.' },
      { name: 'Radiant Bolt', kind: 'magic', key: 'L', description: 'A blessed bolt of searing light.' },
      { name: 'Dawnbreak', kind: 'ultimate', key: 'U', description: 'A burst of holy light that heals her and burns enemies.' },
    ],
  },
  {
    id: 'zephra',
    name: 'Zephra Venomkiss',
    title: 'The Viper Queen',
    weapon: 'Twin Fangs Daggers',
    weaponType: 'daggers',
    element: 'Venom',
    color: '#8bd13a',
    accent: '#e3ff9e',
    realm: 'Sunken Bazaar',
    quote: 'One kiss. That is all it takes.',
    bio: 'Queen of the underground assassins guild. Zephra darts in and out with twin poisoned daggers, wearing enemies down before they can react.',
    stats: { power: 6, speed: 10, range: 3, defense: 3, magic: 7 },
    abilities: [
      { name: 'Fang Flurry', kind: 'weapon', key: 'J', description: 'A blinding flurry of dagger stabs.' },
      { name: 'Viper Lunge', kind: 'weapon', key: 'K', description: 'A leaping double stab.' },
      { name: 'Toxic Spit', kind: 'magic', key: 'L', description: 'Flings a glob of corrosive venom.' },
      { name: 'Serpent Bloom', kind: 'ultimate', key: 'U', description: 'A toxic cloud that bursts out around her.' },
    ],
  },
]

export function getFighter(id: string): Fighter | undefined {
  return fighters.find((f) => f.id === id)
}

export function portraitUrl(id: string, width = 600) {
  return `/.netlify/images?url=/img/fighters/${id}.png&w=${width}&fm=webp`
}

export const elementIcon: Record<Element, string> = {
  Fire: '🔥',
  Wind: '🌪️',
  Earth: '⛰️',
  Arcane: '🔮',
  Shadow: '🌑',
  Lightning: '⚡',
  Frost: '❄️',
  Blood: '🩸',
  Light: '☀️',
  Venom: '🐍',
}
