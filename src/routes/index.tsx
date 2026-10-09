import { Link, createFileRoute } from '@tanstack/react-router'
import { Crown, Flame, Gamepad2, Shield, Sparkles, Swords, Target } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { ElementBadge, Portrait } from '@/components/FighterBits'
import { fighters } from '@/data/fighters'

export const Route = createFileRoute('/')({
  component: Home,
})

const pillars = [
  {
    icon: Swords,
    title: 'Steel in every hand',
    body: 'Longswords, katanas, warhammers, spears, scythes, twin axes and daggers — every weapon has its own reach, speed and weight.',
  },
  {
    icon: Target,
    title: 'Bows that change the fight',
    body: 'Kite your opponent across the arena with real arrow projectiles, charged shots and a fan-volley ultimate.',
  },
  {
    icon: Sparkles,
    title: 'Ten schools of magic',
    body: 'Fire, wind, earth, arcane, shadow, lightning, frost, blood, light and venom. Spend mana on spells, then unleash an ultimate.',
  },
  {
    icon: Shield,
    title: 'Block, dash, punish',
    body: 'Guard against heavy blows, dash through danger and counter-attack. Free 3D movement around a living arena.',
  },
]

function Home() {
  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src="/.netlify/images?url=/img/hero.png&w=1920&fm=webp"
          alt="A flame-sword knight clashes with a storm archer in a floating colosseum"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/30 to-transparent" />
        <div className="mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-end px-5 pb-20 pt-32">
          <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-ember">
            <Flame className="h-3.5 w-3.5" /> 3D weapon &amp; magic fighter
          </p>
          <h1 className="font-display text-6xl font-black leading-[0.95] tracking-wide text-white text-glow sm:text-8xl">
            AETHER<span className="text-ember">BLADE</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
            Ten legends. Swords, bows, hammers and spells. Fight anyone in free play, or carve your way through a
            45-battle story where every fifth duel is against another legend.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/arena"
              className="clip-blade inline-flex items-center gap-2 bg-ember px-8 py-4 font-display text-lg font-bold tracking-wider text-ink shadow-[0_0_40px_rgba(255,122,61,0.45)] transition hover:brightness-110"
            >
              <Gamepad2 className="h-5 w-5" /> Free Play
            </Link>
            <Link
              to="/story"
              className="clip-blade inline-flex items-center gap-2 border border-white/20 bg-white/5 px-8 py-4 font-display text-lg font-bold tracking-wider text-white backdrop-blur transition hover:bg-white/10"
            >
              <Crown className="h-5 w-5 text-gold" /> Story Mode
            </Link>
          </div>
        </div>
      </section>

      {/* Roster strip */}
      <section className="bg-rune py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-arcane">The Roster</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">Choose your legend</h2>
            </div>
            <Link to="/roster" className="text-sm font-semibold text-white/60 hover:text-white">
              View all fighters →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {fighters.map((f) => (
              <Link
                key={f.id}
                to="/roster/$fighterId"
                params={{ fighterId: f.id }}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-steel"
                style={{ boxShadow: `inset 0 -80px 60px -20px ${f.color}55` }}
              >
                <Portrait fighter={f} width={400} className="transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <ElementBadge fighter={f} />
                  <p className="mt-1.5 font-display text-lg font-bold leading-tight text-white">{f.name}</p>
                  <p className="text-xs text-white/60">{f.weapon}</p>
                </div>
                <div className="absolute inset-0 rounded-xl ring-2 ring-transparent transition group-hover:ring-[color:var(--c)]" style={{ ['--c' as string]: f.color }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Combat pillars */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-ember">Combat</p>
          <h2 className="mt-2 max-w-2xl font-display text-4xl font-bold text-white sm:text-5xl">Weapons first. Magic always.</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-2xl border border-white/10 bg-night p-6">
                <p.icon className="h-8 w-8 text-ember" />
                <h3 className="mt-5 font-display text-xl font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="relative overflow-hidden border-y border-white/5 bg-night py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold">Story Mode</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">45 battles. 9 bosses. 1 legend.</h2>
            <p className="mt-5 text-lg text-white/70">
              Every legend walks their own path across nine realms. Fight four of each realm's warriors, then face the
              realm's champion — one of the other nine playable legends — in a boss duel. Beat all nine to finish
              your story.
            </p>
            <Link
              to="/story"
              className="clip-blade mt-8 inline-flex items-center gap-2 bg-gold px-7 py-3.5 font-display font-bold tracking-wider text-ink transition hover:brightness-110"
            >
              <Crown className="h-5 w-5" /> Begin a journey
            </Link>
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {Array.from({ length: 45 }, (_, i) => {
              const boss = (i + 1) % 5 === 0
              return (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-md text-xs font-bold ${
                    boss ? 'bg-gold text-ink shadow-[0_0_16px_rgba(244,197,66,0.5)]' : 'bg-white/5 text-white/40'
                  }`}
                >
                  {boss ? <Crown className="h-4 w-4" /> : i + 1}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">The arena is waiting.</h2>
        <p className="mt-4 text-white/60">Playable right in your browser. Keyboard or touch.</p>
        <Link
          to="/arena"
          className="clip-blade mt-8 inline-flex items-center gap-2 bg-ember px-10 py-4 font-display text-lg font-bold tracking-wider text-ink shadow-[0_0_40px_rgba(255,122,61,0.45)] transition hover:brightness-110"
        >
          <Swords className="h-5 w-5" /> Enter the Arena
        </Link>
      </section>

      <SiteFooter />
    </div>
  )
}
