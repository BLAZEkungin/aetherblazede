import { elementIcon, portraitUrl, type Fighter, type FighterStats } from '@/data/fighters'

const statLabels: Record<keyof FighterStats, string> = {
  power: 'Power',
  speed: 'Speed',
  range: 'Range',
  defense: 'Defense',
  magic: 'Magic',
}

export function StatBars({ fighter, compact = false }: { fighter: Fighter; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-3'}>
      {(Object.keys(statLabels) as (keyof FighterStats)[]).map((k) => (
        <div key={k} className="flex items-center gap-3">
          <span className={`w-16 shrink-0 font-semibold uppercase tracking-wider text-white/50 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {statLabels[k]}
          </span>
          <div className={`flex flex-1 gap-0.5 ${compact ? 'h-1.5' : 'h-2.5'}`}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ background: i < fighter.stats[k] ? fighter.color : 'rgb(255 255 255 / 0.08)' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ElementBadge({ fighter }: { fighter: Fighter }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ borderColor: fighter.color + '66', color: fighter.accent, background: fighter.color + '1f' }}
    >
      {elementIcon[fighter.element]} {fighter.element}
    </span>
  )
}

export function Portrait({ fighter, width = 500, className = '' }: { fighter: Fighter; width?: number; className?: string }) {
  return (
    <img
      src={portraitUrl(fighter.id, width)}
      alt={`${fighter.name}, ${fighter.title}`}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  )
}
