import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Crown, Gamepad2, Sparkles, Swords, Zap } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { ElementBadge, Portrait, StatBars } from '@/components/FighterBits'
import { fighters, getFighter, type AbilityKind } from '@/data/fighters'

export const Route = createFileRoute('/roster/$fighterId')({
  loader: ({ params }) => {
    const fighter = getFighter(params.fighterId)
    if (!fighter) throw notFound()
    return fighter
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.name ?? 'Fighter'} — Aetherblade` }] }),
  component: FighterPage,
})

const kindMeta: Record<AbilityKind, { label: string; icon: typeof Swords }> = {
  weapon: { label: 'Weapon', icon: Swords },
  magic: { label: 'Magic', icon: Sparkles },
  ultimate: { label: 'Ultimate', icon: Zap },
}

function FighterPage() {
  const f = Route.useLoaderData()
  const idx = fighters.findIndex((x) => x.id === f.id)
  const prev = fighters[(idx + fighters.length - 1) % fighters.length]
  const next = fighters[(idx + 1) % fighters.length]

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 30% 20%, ${f.color}33, transparent 55%)` }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[5fr_7fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10" style={{ boxShadow: `0 0 80px ${f.color}40` }}>
            <Portrait fighter={f} width={800} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-6 font-display text-lg italic text-white/90">“{f.quote}”</p>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <ElementBadge fighter={f} />
              <span className="text-xs uppercase tracking-widest text-white/40">{f.realm}</span>
            </div>
            <h1 className="mt-3 font-display text-5xl font-black text-white sm:text-6xl">{f.name}</h1>
            <p className="mt-1 font-display text-xl font-semibold" style={{ color: f.accent }}>
              {f.title}
            </p>
            <p className="mt-5 max-w-2xl leading-relaxed text-white/70">{f.bio}</p>

            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Attributes</h2>
                <StatBars fighter={f} />
              </div>
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Signature weapon</h2>
                <p className="font-display text-2xl font-bold text-white">{f.weapon}</p>
                <p className="mt-1 text-sm text-white/50">Element: {f.element}</p>
              </div>
            </div>

            <h2 className="mb-4 mt-10 text-xs font-bold uppercase tracking-[0.2em] text-white/50">Move list</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {f.abilities.map((a) => {
                const K = kindMeta[a.kind]
                return (
                  <div key={a.name} className="rounded-xl border border-white/10 bg-night p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: f.accent }}>
                        <K.icon className="h-3.5 w-3.5" /> {K.label}
                      </span>
                      <kbd className="rounded border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-xs text-white/80">{a.key}</kbd>
                    </div>
                    <p className="mt-2 font-display text-lg font-bold text-white">{a.name}</p>
                    <p className="mt-1 text-sm text-white/60">{a.description}</p>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to="/arena"
                search={{ p1: f.id }}
                className="clip-blade inline-flex items-center gap-2 px-7 py-3.5 font-display font-bold tracking-wider text-ink transition hover:brightness-110"
                style={{ background: f.color }}
              >
                <Gamepad2 className="h-5 w-5" /> Play as {f.name.split(' ')[0]}
              </Link>
              <Link
                to="/story/$fighterId"
                params={{ fighterId: f.id }}
                className="clip-blade inline-flex items-center gap-2 border border-white/20 bg-white/5 px-7 py-3.5 font-display font-bold tracking-wider text-white transition hover:bg-white/10"
              >
                <Crown className="h-5 w-5 text-gold" /> Story
              </Link>
            </div>

            <div className="mt-12 flex justify-between border-t border-white/10 pt-6 text-sm">
              <Link to="/roster/$fighterId" params={{ fighterId: prev.id }} className="text-white/50 hover:text-white">
                ← {prev.name}
              </Link>
              <Link to="/roster/$fighterId" params={{ fighterId: next.id }} className="text-white/50 hover:text-white">
                {next.name} →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
