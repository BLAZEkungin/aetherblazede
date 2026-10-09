import { Link, createFileRoute } from '@tanstack/react-router'
import { Crown } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { ElementBadge, Portrait } from '@/components/FighterBits'
import { fighters } from '@/data/fighters'
import { demoProgress } from '@/data/story'

export const Route = createFileRoute('/story/')({
  head: () => ({ meta: [{ title: 'Story Mode — Aetherblade' }] }),
  component: StorySelect,
})

function StorySelect() {
  return (
    <div className="min-h-screen bg-ink bg-rune">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold">Story Mode</p>
        <h1 className="mt-2 font-display text-5xl font-bold text-white">Whose legend will you write?</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Each journey is 45 battles across nine realms. Every fifth battle is a boss duel against another playable
          legend.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {fighters.map((f) => {
            const done = demoProgress[f.id] ?? 0
            return (
              <Link
                key={f.id}
                to="/story/$fighterId"
                params={{ fighterId: f.id }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-night transition hover:-translate-y-1 hover:border-white/30"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Portrait fighter={f} width={360} className="transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-transparent" />
                  <div className="absolute left-3 top-3">
                    <ElementBadge fighter={f} />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-display text-lg font-bold leading-tight text-white">{f.name}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${(done / 45) * 100}%`, background: f.color }} />
                  </div>
                  <p className="mt-1.5 flex items-center justify-between text-xs text-white/50">
                    <span>{done === 0 ? 'Not started' : `${done} / 45 battles`}</span>
                    <span className="inline-flex items-center gap-1">
                      <Crown className="h-3 w-3 text-gold" /> {Math.floor(done / 5)}/9
                    </span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
