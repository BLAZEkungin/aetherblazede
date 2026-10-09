import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Check, Crown, Lock, Swords } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/components/SiteHeader'
import { ElementBadge, Portrait } from '@/components/FighterBits'
import { getFighter, portraitUrl } from '@/data/fighters'
import { buildStory, demoProgress } from '@/data/story'

export const Route = createFileRoute('/story/$fighterId')({
  loader: ({ params }) => {
    const fighter = getFighter(params.fighterId)
    if (!fighter) throw notFound()
    return { fighter, chapters: buildStory(fighter.id) }
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.fighter.name ?? 'Story'} — Story Mode — Aetherblade` }] }),
  component: StoryLadder,
})

function StoryLadder() {
  const { fighter: f, chapters } = Route.useLoaderData()
  const done = demoProgress[f.id] ?? 0
  const current = Math.min(45, done + 1)

  return (
    <div className="min-h-screen bg-ink">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 15% 50%, ${f.color}40, transparent 50%)` }} />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:flex-row sm:items-center">
          <div className="h-44 w-36 shrink-0 overflow-hidden rounded-2xl border border-white/15" style={{ boxShadow: `0 0 50px ${f.color}55` }}>
            <Portrait fighter={f} width={300} />
          </div>
          <div className="flex-1">
            <ElementBadge fighter={f} />
            <h1 className="mt-2 font-display text-4xl font-black text-white sm:text-5xl">The Path of {f.name.split(' ')[0]}</h1>
            <p className="mt-2 max-w-xl text-white/60">
              {f.name} sets out from the {f.realm} to prove there is only one true Aetherblade. Nine realms, nine
              legends — and forty-five battles between here and the crown.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link
                to="/arena"
                search={{ p1: f.id, stage: current }}
                className="clip-blade inline-flex items-center gap-2 px-6 py-3 font-display font-bold tracking-wider text-ink transition hover:brightness-110"
                style={{ background: f.color }}
              >
                <Swords className="h-5 w-5" /> {done === 0 ? 'Begin' : 'Continue'} — Battle {current}
              </Link>
              <span className="text-sm text-white/50">
                {done}/45 battles · {Math.floor(done / 5)}/9 bosses defeated
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-12">
        {chapters.map((c) => {
          const boss = c.fights[4]
          return (
            <section key={c.number} className="rounded-2xl border border-white/10 bg-night p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-white">
                  <span className="mr-3 text-white/30">{String(c.number).padStart(2, '0')}</span>
                  {c.name}
                </h2>
                <p className="text-sm text-white/40">{c.location}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {c.fights.map((fight) => {
                  const won = fight.stage <= done
                  const isCurrent = fight.stage === current
                  const locked = fight.stage > current
                  const body = (
                    <>
                      {fight.isBoss && fight.bossId ? (
                        <div className="relative -mx-4 -mt-4 mb-3 h-28 overflow-hidden rounded-t-xl">
                          <img src={portraitUrl(fight.bossId, 400)} alt="" className={`h-full w-full object-cover object-top ${locked ? 'grayscale' : ''}`} loading="lazy" />
                          <div className="absolute inset-0 bg-gradient-to-t from-night to-transparent" />
                          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink">
                            <Crown className="h-3 w-3" /> Boss
                          </span>
                        </div>
                      ) : (
                        <div className="mb-3 h-1.5 w-12 rounded-full" style={{ background: fight.color }} />
                      )}
                      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Battle {fight.stage}</p>
                      <p className="mt-0.5 font-display text-lg font-bold leading-tight text-white">{fight.opponentName}</p>
                      <p className="mt-0.5 text-xs text-white/50">{fight.opponentTitle}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="capitalize text-white/40">{fight.weaponType === 'swordShield' ? 'sword & shield' : fight.weaponType}</span>
                        {won ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                            <Check className="h-3.5 w-3.5" /> Won
                          </span>
                        ) : locked ? (
                          <Lock className="h-3.5 w-3.5 text-white/30" />
                        ) : (
                          <span className="font-semibold" style={{ color: f.accent }}>
                            Fight →
                          </span>
                        )}
                      </div>
                    </>
                  )
                  const cls = `relative block rounded-xl border p-4 transition ${
                    fight.isBoss ? 'border-gold/40 bg-gold/[0.04]' : 'border-white/10 bg-white/[0.02]'
                  } ${isCurrent ? 'ring-2' : ''} ${locked ? 'opacity-60 hover:opacity-90' : ''} hover:border-white/30 hover:bg-white/[0.05]`
                  return (
                    <Link
                      key={fight.stage}
                      to="/arena"
                      search={{ p1: f.id, stage: fight.stage }}
                      className={cls}
                      style={isCurrent ? { ['--tw-ring-color' as string]: f.color } : undefined}
                    >
                      {body}
                    </Link>
                  )
                })}
              </div>
              <p className="mt-4 text-xs text-white/40">
                Realm champion: <span className="text-gold">{boss.opponentName}</span>, {boss.opponentTitle}
              </p>
            </section>
          )
        })}
      </main>
      <SiteFooter />
    </div>
  )
}
