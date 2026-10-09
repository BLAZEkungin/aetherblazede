import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Crown, Shuffle, Swords } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { BattleView, ExitIcon, exitClass } from '@/components/BattleView'
import { ElementBadge, Portrait, StatBars } from '@/components/FighterBits'
import { fighters, getFighter, type Fighter } from '@/data/fighters'
import { getStoryFight } from '@/data/story'
import { difficulties, fighterConfig, storyOpponentConfig, type DifficultyId } from '@/game/config'

interface ArenaSearch {
  p1?: string
  p2?: string
  stage?: number
  level?: DifficultyId
}

export const Route = createFileRoute('/arena')({
  validateSearch: (s: Record<string, unknown>): ArenaSearch => {
    const stage = Number(s.stage)
    const level = difficulties.find((d) => d.id === s.level)?.id
    return {
      p1: typeof s.p1 === 'string' ? s.p1 : undefined,
      p2: typeof s.p2 === 'string' ? s.p2 : undefined,
      stage: Number.isInteger(stage) && stage >= 1 && stage <= 45 ? stage : undefined,
      level,
    }
  },
  head: () => ({ meta: [{ title: 'Arena — Aetherblade' }] }),
  component: Arena,
})

function Arena() {
  const search = Route.useSearch()
  const p1 = search.p1 ? getFighter(search.p1) : undefined

  if (p1 && search.stage) {
    const fight = getStoryFight(p1.id, search.stage)!
    const next = search.stage < 45 ? search.stage + 1 : undefined
    return (
      <BattleView
        key={`story-${p1.id}-${search.stage}`}
        p1={fighterConfig(p1, false)}
        p2={storyOpponentConfig(fight)}
        label={`Story · Battle ${fight.stage} of 45`}
        sublabel={fight.isBoss ? '★ Boss duel' : undefined}
        exit={
          <Link to="/story/$fighterId" params={{ fighterId: p1.id }} className={exitClass}>
            <ExitIcon className="h-4 w-4" /> Ladder
          </Link>
        }
        onWin={
          next ? (
            <Link to="/arena" search={{ p1: p1.id, stage: next }} className="clip-blade inline-flex items-center gap-2 bg-gold px-6 py-3 font-display font-bold tracking-wider text-ink hover:brightness-110">
              Battle {next} <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link to="/story/$fighterId" params={{ fighterId: p1.id }} className="clip-blade inline-flex items-center gap-2 bg-gold px-6 py-3 font-display font-bold tracking-wider text-ink">
              <Crown className="h-5 w-5" /> Legend complete
            </Link>
          )
        }
      />
    )
  }

  const p2 = search.p2 ? getFighter(search.p2) : undefined
  if (p1 && p2) {
    const level = difficulties.find((d) => d.id === (search.level ?? 'normal'))!
    return (
      <BattleView
        key={`free-${p1.id}-${p2.id}-${level.id}`}
        p1={fighterConfig(p1, false)}
        p2={fighterConfig(p2, true, level.value)}
        label="Free Play"
        sublabel={`${level.label} AI`}
        exit={
          <Link to="/arena" search={{ p1: p1.id }} className={exitClass}>
            <ExitIcon className="h-4 w-4" /> Fighters
          </Link>
        }
      />
    )
  }

  return <FighterSelect initialP1={p1?.id} initialLevel={search.level} />
}

function FighterSelect({ initialP1, initialLevel }: { initialP1?: string; initialLevel?: DifficultyId }) {
  const navigate = useNavigate()
  const [pick, setPick] = useState<'p1' | 'p2'>(initialP1 ? 'p2' : 'p1')
  const [p1, setP1] = useState(initialP1 ?? fighters[0].id)
  const [p2, setP2] = useState(() => {
    const others = fighters.filter((f) => f.id !== (initialP1 ?? fighters[0].id))
    return others[Math.floor(others.length / 2)].id
  })
  const [level, setLevel] = useState<DifficultyId>(initialLevel ?? 'normal')
  const f1 = getFighter(p1)!
  const f2 = getFighter(p2)!

  const choose = (id: string) => {
    if (pick === 'p1') {
      setP1(id)
      setPick('p2')
    } else setP2(id)
  }
  const random = () => setP2(fighters[Math.floor(Math.random() * fighters.length)].id)
  const start = () => navigate({ to: '/arena', search: { p1, p2, level } })

  return (
    <div className="min-h-screen bg-ink bg-rune">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-ember">Free Play</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-white sm:text-5xl">Choose your duel</h1>
        </div>

        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <SelectedCard label="You" fighter={f1} active={pick === 'p1'} onClick={() => setPick('p1')} />
          <div className="flex items-center justify-center">
            <span className="font-display text-5xl font-black text-white/20">VS</span>
          </div>
          <SelectedCard label="Opponent · AI" fighter={f2} active={pick === 'p2'} onClick={() => setPick('p2')} right />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-2 text-xs font-bold uppercase tracking-widest text-white/40">Choosing for</span>
          {(['p1', 'p2'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPick(p)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${pick === p ? 'bg-white text-ink' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
            >
              {p === 'p1' ? 'You' : 'Opponent'}
            </button>
          ))}
          <button onClick={random} className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-white/60 hover:bg-white/10">
            <Shuffle className="h-4 w-4" /> Random opponent
          </button>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3 lg:grid-cols-10">
          {fighters.map((f) => {
            const isP1 = f.id === p1
            const isP2 = f.id === p2
            return (
              <button
                key={f.id}
                onClick={() => choose(f.id)}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-steel transition hover:-translate-y-0.5"
                style={{ borderColor: isP1 ? '#ff7a3d' : isP2 ? '#8f6bff' : 'rgb(255 255 255 / 0.08)' }}
                aria-label={f.name}
              >
                <Portrait fighter={f} width={200} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                <span className="absolute inset-x-0 bottom-1 text-center font-display text-[10px] font-bold leading-tight text-white sm:text-xs">
                  {f.name.split(' ')[0]}
                </span>
                {(isP1 || isP2) && (
                  <span
                    className="absolute right-1 top-1 rounded px-1 text-[9px] font-black"
                    style={{ background: isP1 ? '#ff7a3d' : '#8f6bff', color: '#0b0a14' }}
                  >
                    {isP1 && isP2 ? 'P1·AI' : isP1 ? 'P1' : 'AI'}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => setLevel(d.id)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                  level === d.id ? 'border-ember bg-ember/15 text-ember' : 'border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            onClick={start}
            className="clip-blade inline-flex items-center gap-2 bg-ember px-12 py-4 font-display text-xl font-bold tracking-wider text-ink shadow-[0_0_40px_rgba(255,122,61,0.45)] transition hover:brightness-110"
          >
            <Swords className="h-6 w-6" /> Fight!
          </button>
          <p className="text-xs text-white/40">Keyboard: WASD move · J/K attack · L magic · U ultimate · Shift block · Space dash</p>
        </div>
      </main>
    </div>
  )
}

function SelectedCard({ label, fighter: f, active, onClick, right }: { label: string; fighter: Fighter; active: boolean; onClick: () => void; right?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex overflow-hidden rounded-2xl border-2 bg-night text-left transition ${right ? 'flex-row-reverse text-right' : ''}`}
      style={{ borderColor: active ? f.color : 'rgb(255 255 255 / 0.08)', boxShadow: active ? `0 0 40px ${f.color}40` : undefined }}
    >
      <div className="relative w-2/5 shrink-0">
        <Portrait fighter={f} width={360} />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{label}</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">{f.name}</h2>
        <p className="text-sm font-semibold" style={{ color: f.accent }}>
          {f.title}
        </p>
        <div className={`mt-2 ${right ? 'self-end' : ''}`}>
          <ElementBadge fighter={f} />
        </div>
        <p className="mt-2 text-xs uppercase tracking-wider text-white/40">{f.weapon}</p>
        <div className="mt-auto pt-4 text-left">
          <StatBars fighter={f} compact />
        </div>
      </div>
    </button>
  )
}
