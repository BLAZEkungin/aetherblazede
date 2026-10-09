import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, Pause, Play, RotateCcw } from 'lucide-react'
import { CONTROLS, type Battle, type BattleSnapshot, type CombatantConfig } from '@/game/engine'

interface Props {
  p1: CombatantConfig
  p2: CombatantConfig
  label: string
  sublabel?: string
  exit: ReactNode
  onWin?: ReactNode
}

export function BattleView({ p1, p2, label, sublabel, exit, onWin }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const battleRef = useRef<Battle | null>(null)
  const [snap, setSnap] = useState<BattleSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    import('@/game/engine')
      .then(({ Battle }) => {
        if (cancelled || !mountRef.current) return
        try {
          battleRef.current = new Battle(mountRef.current, p1, p2, setSnap)
        } catch {
          setError('Your browser could not start WebGL. Try a different browser or enable hardware acceleration.')
        }
      })
      .catch(() => setError('The arena failed to load. Refresh to try again.'))
    return () => {
      cancelled = true
      battleRef.current?.dispose()
      battleRef.current = null
    }
    // A new pairing (key) remounts this component, so configs are stable here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const key = (code: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      battleRef.current?.setKey(code, true)
    },
    onPointerUp: () => battleRef.current?.setKey(code, false),
    onPointerLeave: () => battleRef.current?.setKey(code, false),
    onPointerCancel: () => battleRef.current?.setKey(code, false),
  })

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-ink text-white" style={{ touchAction: 'none' }}>
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-3 sm:p-5">
        <div className="mx-auto flex max-w-6xl items-start gap-3 sm:gap-6">
          <FighterHud side="left" cfg={p1} s={snap?.p1} />
          <div className="flex w-16 shrink-0 flex-col items-center sm:w-24">
            <div className="clip-blade flex h-14 w-full items-center justify-center border border-white/15 bg-ink/80 font-display text-3xl font-black sm:h-16 sm:text-4xl">
              {snap?.time ?? 99}
            </div>
          </div>
          <FighterHud side="right" cfg={p2} s={snap?.p2} />
        </div>
        <p className="mt-2 text-center font-display text-xs font-bold uppercase tracking-[0.25em] text-white/60 sm:text-sm">
          {label}
          {sublabel && <span className="ml-2 text-gold">{sublabel}</span>}
        </p>
      </div>

      {/* Bottom-left controls */}
      <div className="absolute bottom-4 left-4 z-10 hidden gap-2 sm:flex">
        <div className="pointer-events-auto">{exit}</div>
        <button
          onClick={() => battleRef.current?.togglePause()}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-ink/70 px-3 py-2 text-sm font-semibold text-white/80 backdrop-blur hover:bg-white/10"
        >
          <Pause className="h-4 w-4" /> Pause
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="keyboard-hint pointer-events-none absolute bottom-4 right-4 hidden rounded-lg border border-white/10 bg-ink/70 p-3 text-xs backdrop-blur md:block">
        {CONTROLS.map((c) => (
          <div key={c.label} className="flex justify-between gap-6 py-0.5">
            <span className="text-white/50">{c.label}</span>
            <kbd className="font-mono font-semibold text-white/90">{c.keys}</kbd>
          </div>
        ))}
      </div>

      {/* Countdown / callouts */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {snap?.status === 'countdown' && snap.countdown > 0 && (
          <div key={snap.countdown} className="animate-callout font-display text-8xl font-black text-white text-glow sm:text-9xl">
            {snap.countdown}
          </div>
        )}
        {snap?.callout && snap.status !== 'countdown' && (
          <div key={snap.callout} className="animate-callout text-center font-display text-6xl font-black text-ember text-glow sm:text-8xl">
            {snap.callout}
          </div>
        )}
      </div>

      {/* Pause */}
      {snap?.status === 'paused' && (
        <Overlay>
          <h2 className="font-display text-5xl font-black">Paused</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <OverlayButton onClick={() => battleRef.current?.togglePause()} primary>
              <Play className="h-5 w-5" /> Resume
            </OverlayButton>
            <OverlayButton onClick={() => battleRef.current?.restart()}>
              <RotateCcw className="h-5 w-5" /> Restart
            </OverlayButton>
            {exit}
          </div>
        </Overlay>
      )}

      {/* Result */}
      {snap?.status === 'over' && !snap.callout && (
        <Overlay>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/50">{label}</p>
          <h2 className={`mt-2 font-display text-6xl font-black sm:text-7xl ${snap.winner === 1 ? 'text-gold text-glow' : 'text-white/80'}`}>
            {snap.winner === 1 ? 'Victory' : snap.winner === 2 ? 'Defeat' : 'Draw'}
          </h2>
          <p className="mt-3 text-white/60">
            {snap.winner === 1 ? `${p1.name} stands over ${p2.name}.` : snap.winner === 2 ? `${p2.name} wins this one.` : 'Neither legend yields.'}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {snap.winner === 1 && onWin}
            <OverlayButton onClick={() => battleRef.current?.restart()} primary={snap.winner !== 1}>
              <RotateCcw className="h-5 w-5" /> {snap.winner === 1 ? 'Fight again' : 'Retry'}
            </OverlayButton>
            {exit}
          </div>
        </Overlay>
      )}

      {error && (
        <Overlay>
          <p className="max-w-md text-white/80">{error}</p>
          <div className="mt-6">{exit}</div>
        </Overlay>
      )}

      {/* Touch controls */}
      <div className="touch-controls absolute inset-x-0 bottom-0 items-end justify-between p-4">
        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <TouchBtn {...key('KeyW')}>▲</TouchBtn>
          <span />
          <TouchBtn {...key('KeyA')}>◀</TouchBtn>
          <TouchBtn {...key('KeyS')}>▼</TouchBtn>
          <TouchBtn {...key('KeyD')}>▶</TouchBtn>
        </div>
        <button onClick={() => battleRef.current?.togglePause()} className="mb-2 rounded-full bg-white/10 p-3">
          <Pause className="h-5 w-5" />
        </button>
        <div className="grid grid-cols-3 gap-1.5">
          <TouchBtn {...key('KeyL')} tone="arcane">Magic</TouchBtn>
          <TouchBtn {...key('KeyU')} tone="gold">Ult</TouchBtn>
          <TouchBtn {...key('ShiftLeft')}>Block</TouchBtn>
          <TouchBtn {...key('KeyJ')} tone="ember">Light</TouchBtn>
          <TouchBtn {...key('KeyK')} tone="ember">Heavy</TouchBtn>
          <TouchBtn {...key('Space')}>Dash</TouchBtn>
        </div>
      </div>
    </div>
  )
}

function FighterHud({ side, cfg, s }: { side: 'left' | 'right'; cfg: CombatantConfig; s?: BattleSnapshot['p1'] }) {
  const hp = s ? (s.hp / s.maxHp) * 100 : 100
  const mana = s?.mana ?? 50
  const ult = s?.ult ?? 0
  const right = side === 'right'
  return (
    <div className={`flex-1 ${right ? 'text-right' : ''}`}>
      <div className={`flex items-baseline gap-2 ${right ? 'flex-row-reverse' : ''}`}>
        <span className="font-display text-sm font-bold drop-shadow sm:text-xl">{cfg.name}</span>
        <span className="hidden text-xs font-semibold text-white/50 sm:inline">{s ? Math.ceil(s.hp) : ''}</span>
      </div>
      <div className={`mt-1 h-4 overflow-hidden rounded-sm border border-white/20 bg-black/60 sm:h-5 ${right ? 'flex justify-end' : ''}`}>
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${hp}%`,
            background: hp > 50 ? `linear-gradient(90deg, ${cfg.color}, ${cfg.accent})` : hp > 25 ? '#f4c542' : '#e83a3a',
          }}
        />
      </div>
      <div className={`mt-1 flex gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
        <div className={`h-1.5 w-1/2 overflow-hidden rounded-full bg-black/60 ${right ? 'flex justify-end' : ''}`}>
          <div className="h-full bg-sky-400" style={{ width: `${mana}%` }} />
        </div>
        <div className={`h-1.5 w-1/2 overflow-hidden rounded-full bg-black/60 ${right ? 'flex justify-end' : ''}`}>
          <div className={`h-full ${ult >= 100 ? 'animate-pulse bg-gold' : 'bg-gold/70'}`} style={{ width: `${ult}%` }} />
        </div>
      </div>
      <div className={`mt-0.5 flex text-[9px] font-bold uppercase tracking-wider text-white/40 ${right ? 'flex-row-reverse' : ''}`}>
        <span className="w-1/2">Mana</span>
        <span className={`w-1/2 ${ult >= 100 ? 'text-gold' : ''}`}>{ult >= 100 ? 'Ultimate ready' : 'Ultimate'}</span>
      </div>
    </div>
  )
}

function Overlay({ children }: { children: ReactNode }) {
  return <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/75 p-6 text-center backdrop-blur-sm">{children}</div>
}

export function OverlayButton({ children, onClick, primary }: { children: ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`clip-blade inline-flex items-center gap-2 px-6 py-3 font-display font-bold tracking-wider transition hover:brightness-110 ${
        primary ? 'bg-ember text-ink' : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export const exitClass =
  'clip-blade inline-flex items-center gap-2 border border-white/20 bg-white/5 px-5 py-3 font-display font-bold tracking-wider text-white transition hover:bg-white/10'

export { ArrowLeft as ExitIcon }

const tones = {
  ember: 'bg-ember/80 text-ink',
  arcane: 'bg-arcane/80',
  gold: 'bg-gold/80 text-ink',
  none: 'bg-white/10',
}

function TouchBtn({ children, tone = 'none', ...rest }: { children: ReactNode; tone?: keyof typeof tones } & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex h-14 w-14 items-center justify-center rounded-xl text-xs font-bold backdrop-blur active:scale-95 ${tones[tone]}`}>
      {children}
    </button>
  )
}
