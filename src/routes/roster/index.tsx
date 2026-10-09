import { Link, createFileRoute } from '@tanstack/react-router'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { ElementBadge, Portrait, StatBars } from '@/components/FighterBits'
import { fighters } from '@/data/fighters'

export const Route = createFileRoute('/roster/')({
  head: () => ({ meta: [{ title: 'Roster — Aetherblade' }] }),
  component: Roster,
})

function Roster() {
  return (
    <div className="min-h-screen bg-ink bg-rune">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-16">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-arcane">The Ten Legends</p>
        <h1 className="mt-2 font-display text-5xl font-bold text-white">Roster</h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Every legend carries a signature weapon and commands one school of magic. Learn their strengths — you will
          face all of them as bosses in story mode.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {fighters.map((f) => (
            <Link
              key={f.id}
              to="/roster/$fighterId"
              params={{ fighterId: f.id }}
              className="group flex overflow-hidden rounded-2xl border border-white/10 bg-night transition hover:border-white/25"
            >
              <div className="relative w-2/5 shrink-0 overflow-hidden">
                <Portrait fighter={f} width={360} className="transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-night" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <ElementBadge fighter={f} />
                <h2 className="mt-2 font-display text-2xl font-bold text-white">{f.name}</h2>
                <p className="text-sm font-semibold" style={{ color: f.accent }}>
                  {f.title}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{f.weapon}</p>
                <div className="mt-auto pt-5">
                  <StatBars fighter={f} compact />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
