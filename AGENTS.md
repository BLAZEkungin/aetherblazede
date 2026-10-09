# AGENTS.md

Aetherblade is a browser-based 3D weapon & magic fighting game built with TanStack Start, React 19, Three.js and Tailwind CSS 4, deployed on Netlify.

**Continue from [PLAN.md](./PLAN.md)** — it is the roadmap. Milestone 1 (playable product surface) is done; start with the next unchecked milestone.

## Architecture

```
src/
├── data/
│   ├── fighters.ts   # The 10 playable legends: stats, weapon type, element, colours, move list. Source of truth for roster content.
│   └── story.ts      # Story ladder generator (9 chapters × 5 fights; fight 5/10/…/45 = boss vs another legend), regional minions, demoProgress stub.
├── game/
│   ├── engine.ts     # Self-contained Three.js battle simulation (class Battle). Arena, procedural fighter rigs, weapons, combat, projectiles, AI, camera.
│   └── config.ts     # Maps Fighter / StoryFight data to engine CombatantConfig; difficulty presets.
├── components/
│   ├── BattleView.tsx  # Full-screen battle: mounts the engine, renders HUD, countdown, pause/result overlays, touch controls.
│   ├── FighterBits.tsx # StatBars, ElementBadge, Portrait.
│   └── SiteHeader.tsx  # Header + footer used on non-battle pages.
└── routes/
    ├── index.tsx             # Landing page
    ├── roster/index.tsx      # Roster grid
    ├── roster/$fighterId.tsx # Fighter detail + move list
    ├── story/index.tsx       # Choose a legend for story mode
    ├── story/$fighterId.tsx  # 45-battle ladder
    └── arena.tsx             # Fighter select OR battle, driven by search params
public/img/  # hero.png and fighters/<id>.png — generated key art
```

### Arena search params

`/arena` renders the fighter select screen unless params describe a battle:
- `?p1=<id>&p2=<id>&level=easy|normal|hard` → free play vs AI
- `?p1=<id>&stage=<1-45>` → story battle (opponent derived from `buildStory`)

`BattleView` is keyed by the pairing so a param change remounts a fresh engine.

### Engine notes

- `Battle` owns the renderer, rAF loop and window key listeners; always call `dispose()` (BattleView does on unmount).
- React receives `BattleSnapshot` via `onUpdate` (~20 Hz, plus on state changes). Keep game state inside the engine, not React.
- Weapon behaviour lives in the `PROFILES` table (reach, damage, timings, block factor). `ranged: true` (bow) turns light/heavy attacks into arrow projectiles.
- Characters are built from primitives in `buildRig`; weapons in `buildWeapon`. Weapon local frame: grip at origin, extends along +y; it is rotated +90° on X at the hand.
- Avoid adding dynamic lights per projectile — changing light count recompiles shaders and stutters. Use emissive/additive meshes.
- The engine is loaded with dynamic `import()` inside an effect; it only touches the DOM in the constructor so SSR is safe.

## Conventions

- TypeScript strict, `@/*` alias → `src/*`.
- Tailwind theme tokens in `src/styles.css` (`ink`, `night`, `steel`, `ember`, `gold`, `arcane`, `font-display` = Cinzel).
- Images go through the Netlify Image CDN: `/.netlify/images?url=/img/...&w=<w>&fm=webp` (`portraitUrl()` helper).
- `demoProgress` in `src/data/story.ts` is a stub — replace with persisted progress (Netlify Database) in milestone 2, keeping the same shape `{ [fighterId]: battlesWon }`.
- Story battles are currently all clickable (upcoming ones are dimmed) so every boss can be tried; enforce unlocking once progress persists.
