# Aetherblade

A 3D weapon-and-magic fighting game that runs in the browser. Ten playable legends, each with a signature weapon (sword, bow, warhammer, staff, katana, spear, twin axes, scythe, sword & shield, twin daggers), a school of magic, and their own move list.

- **Free Play**: pick any legend against any AI opponent at three difficulty levels.
- **Story Mode**: each legend fights 45 battles across nine realms. Every 5th battle is a boss duel against one of the other nine playable legends, so every story meets the whole roster.

## Playing

| Input | Action |
| --- | --- |
| W A S D / arrows | Move freely around the arena |
| J | Light weapon attack (arrows for bow users) |
| K | Heavy weapon attack |
| L | Magic spell (costs mana) |
| U | Ultimate (when the gold meter is full) |
| Shift / I | Block |
| Space | Dash |
| Esc / P | Pause |

On touch devices, on-screen controls appear automatically.

## Tech

- [TanStack Start](https://tanstack.com/start) + React 19, file-based routing
- [Three.js](https://threejs.org) for the real-time 3D arena, fighters and effects (all procedural, no model files)
- Tailwind CSS 4
- Fighter portraits and key art generated once and served through the Netlify Image CDN
- Deployed on Netlify

## Running locally

```bash
pnpm install
netlify dev   # or: pnpm dev
```

## Roadmap

See [PLAN.md](./PLAN.md). Next up: saved story progress and player profiles, local two-player versus, combo depth and per-fighter special mechanics, and richer 3D character models.
