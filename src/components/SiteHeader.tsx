import { Link } from '@tanstack/react-router'
import { Swords } from 'lucide-react'

const nav = [
  { to: '/roster', label: 'Roster' },
  { to: '/story', label: 'Story' },
  { to: '/arena', label: 'Free Play' },
] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-wider text-white">
          <Swords className="h-6 w-6 text-ember" />
          AETHER<span className="text-ember">BLADE</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              activeProps={{ className: 'text-white bg-white/10' }}
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/arena"
            className="ml-2 hidden rounded-md bg-ember px-4 py-2 text-ink shadow-[0_0_20px_rgba(255,122,61,0.4)] transition hover:brightness-110 sm:block"
          >
            Play Now
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10 text-center text-sm text-white/40">
      <p className="font-display tracking-widest text-white/60">AETHERBLADE</p>
      <p className="mt-2">Ten legends. One arena. Forty-five battles to glory.</p>
    </footer>
  )
}
