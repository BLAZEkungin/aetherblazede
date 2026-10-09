# Aetherblade — Roadmap

Aetherblade is a 3D weapon & magic fighting game: 10 legends, free play, and a 45-battle story per legend with a boss duel every 5th fight against another playable legend.

## ✅ Milestone 1 — Playable product surface
- Landing page with key art, roster preview and story overview
- Roster and fighter detail pages (stats, weapon, element, move list)
- Story mode: legend select and the 45-battle ladder (9 realms × 4 warriors + 1 legend boss)
- 3D arena (Three.js): free movement, light/heavy weapon attacks, bow projectiles, magic spells with mana, ultimates, block, dash, AI with 3 difficulties, HUD, countdown, KO/time-out, pause, rematch, touch controls
- Story battles playable end-to-end with "next battle" chaining

## Milestone 2 — Saved progress
- Netlify Database (Drizzle) tables: players, story_progress (player × fighter × highest stage), battle_results
- Anonymous player id (cookie) so progress works without an account
- Replace `demoProgress` with real data; unlock story battles sequentially; record wins from BattleView

## Milestone 3 — Accounts & profiles
- Netlify Identity sign-in, claim anonymous progress on sign-up
- Profile page: completion per legend, bosses defeated, win/loss stats

## Milestone 4 — Deeper combat
- Combo strings (chained light attacks), launchers and juggles
- Per-fighter mechanics: Oren life-steal stacks, Zephra poison DoT, Mara freeze slow, Isolde parry, Lyra charge-shot
- Hit reactions, guard-break meter, best-of-3 rounds
- Sound effects and music

## Milestone 5 — Versus & presentation
- Local two-player versus (shared keyboard + gamepad API)
- Story cutscene cards before each boss and an ending per legend
- Multiple arenas themed per realm (ladder chapter picks the stage)
- Upgraded 3D character models and animations (glTF) replacing the procedural rigs

## Milestone 6 — Online (stretch)
- Global leaderboards for fastest story clears
- Online versus via WebRTC / realtime relay
