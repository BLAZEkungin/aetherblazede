// Aetherblade combat engine — a self-contained Three.js battle simulation.
// The React layer creates a Battle, receives HUD snapshots via onUpdate and
// disposes it on unmount. No React or DOM state lives in here beyond the canvas.

import * as THREE from 'three'
import type { WeaponType } from '../data/fighters'

export interface CombatantConfig {
  name: string
  weaponType: WeaponType
  color: string
  accent: string
  power: number // 1..10
  speed: number
  defense: number
  magic: number
  ai: boolean
  difficulty: number // 0..1, AI only
  hpScale?: number
}

export interface CombatantSnapshot {
  name: string
  hp: number
  maxHp: number
  mana: number
  ult: number
}

export type BattleStatus = 'countdown' | 'fighting' | 'paused' | 'over'

export interface BattleSnapshot {
  p1: CombatantSnapshot
  p2: CombatantSnapshot
  time: number
  status: BattleStatus
  countdown: number
  winner: 0 | 1 | 2 | null // 0 = draw
  callout: string | null
}

interface WeaponProfile {
  reach: number
  light: { dmg: number; dur: number; hit: number }
  heavy: { dmg: number; dur: number; hit: number }
  ranged?: boolean
  castCost: number
  blockFactor: number
}

const PROFILES: Record<WeaponType, WeaponProfile> = {
  sword: { reach: 2.3, light: { dmg: 8, dur: 0.38, hit: 0.16 }, heavy: { dmg: 16, dur: 0.75, hit: 0.42 }, castCost: 25, blockFactor: 0.2 },
  katana: { reach: 2.4, light: { dmg: 7, dur: 0.3, hit: 0.12 }, heavy: { dmg: 15, dur: 0.62, hit: 0.34 }, castCost: 25, blockFactor: 0.2 },
  hammer: { reach: 2.5, light: { dmg: 11, dur: 0.55, hit: 0.28 }, heavy: { dmg: 22, dur: 1.0, hit: 0.6 }, castCost: 28, blockFactor: 0.15 },
  axes: { reach: 1.9, light: { dmg: 8, dur: 0.34, hit: 0.14 }, heavy: { dmg: 17, dur: 0.7, hit: 0.4 }, castCost: 25, blockFactor: 0.2 },
  spear: { reach: 3.2, light: { dmg: 7, dur: 0.4, hit: 0.18 }, heavy: { dmg: 15, dur: 0.75, hit: 0.42 }, castCost: 25, blockFactor: 0.2 },
  scythe: { reach: 3.0, light: { dmg: 8, dur: 0.45, hit: 0.22 }, heavy: { dmg: 17, dur: 0.8, hit: 0.45 }, castCost: 25, blockFactor: 0.2 },
  staff: { reach: 2.4, light: { dmg: 6, dur: 0.4, hit: 0.18 }, heavy: { dmg: 13, dur: 0.7, hit: 0.4 }, castCost: 16, blockFactor: 0.25 },
  swordShield: { reach: 2.1, light: { dmg: 7, dur: 0.36, hit: 0.15 }, heavy: { dmg: 14, dur: 0.7, hit: 0.38 }, castCost: 25, blockFactor: 0.05 },
  daggers: { reach: 1.7, light: { dmg: 5, dur: 0.22, hit: 0.1 }, heavy: { dmg: 12, dur: 0.5, hit: 0.25 }, castCost: 22, blockFactor: 0.25 },
  bow: { reach: 1.6, light: { dmg: 6, dur: 0.4, hit: 0.2 }, heavy: { dmg: 14, dur: 0.85, hit: 0.55 }, ranged: true, castCost: 25, blockFactor: 0.25 },
}

const ARENA_RADIUS = 13.5
const ROUND_TIME = 99
const MAX_MANA = 100
const MAX_ULT = 100

type Action = 'idle' | 'light' | 'heavy' | 'cast' | 'ult' | 'dash' | 'hit' | 'ko'

interface Rig {
  root: THREE.Group
  body: THREE.Group
  armR: THREE.Group
  armL: THREE.Group
  legR: THREE.Group
  legL: THREE.Group
  glowMats: THREE.MeshStandardMaterial[]
}

class Combatant {
  cfg: CombatantConfig
  profile: WeaponProfile
  rig: Rig
  pos = new THREE.Vector3()
  vel = new THREE.Vector3()
  moveDir = new THREE.Vector3()
  facing = 0
  hp: number
  maxHp: number
  mana = 50
  ult = 0
  action: Action = 'idle'
  actionTime = 0
  actionDur = 0
  actionFired = false
  blocking = false
  stun = 0
  invuln = 0
  walkPhase = 0
  flash = 0
  // AI scratch state
  aiThink = 0
  aiBlockFor = 0
  aiStrafe = 1

  constructor(cfg: CombatantConfig) {
    this.cfg = cfg
    this.profile = PROFILES[cfg.weaponType]
    this.maxHp = Math.round((110 + cfg.defense * 6) * (cfg.hpScale ?? 1))
    this.hp = this.maxHp
    this.rig = buildRig(cfg)
  }

  get moveSpeed() {
    return 3.4 + this.cfg.speed * 0.3
  }
  get powerMult() {
    return 0.75 + this.cfg.power * 0.05
  }
  get magicMult() {
    return 0.7 + this.cfg.magic * 0.06
  }
  get busy() {
    return this.action !== 'idle'
  }
  canAct() {
    return this.action === 'idle' && this.stun <= 0
  }
  start(action: Action, dur: number) {
    this.action = action
    this.actionTime = 0
    this.actionDur = dur
    this.actionFired = false
    this.blocking = false
  }
}

interface Projectile {
  mesh: THREE.Object3D
  vel: THREE.Vector3
  owner: Combatant
  target: Combatant
  dmg: number
  life: number
  homing: number
  heavy: boolean
}

interface Effect {
  mesh: THREE.Mesh
  life: number
  maxLife: number
  grow: number
}

// ---------- Mesh construction ----------

function mat(color: THREE.ColorRepresentation, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25, ...opts })
}

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true
      c.receiveShadow = true
    }
  })
  return o
}

function buildWeapon(type: WeaponType, accent: string, glow: THREE.MeshStandardMaterial[]): { main: THREE.Group; off?: THREE.Group } {
  const steel = mat('#c9ccd4', { metalness: 0.85, roughness: 0.25 })
  const dark = mat('#3a2a20', { roughness: 0.8 })
  const glowMat = mat(accent, { emissive: accent, emissiveIntensity: 0.6, metalness: 0.4 })
  glow.push(glowMat)
  const g = new THREE.Group()

  const grip = (len = 0.28) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 8), dark)
    return m
  }

  switch (type) {
    case 'sword':
    case 'swordShield':
    case 'katana': {
      const curved = type === 'katana'
      const blade = new THREE.Mesh(new THREE.BoxGeometry(curved ? 0.05 : 0.09, curved ? 1.2 : 1.05, 0.025), curved ? steel : glowMat)
      blade.position.y = curved ? 0.75 : 0.68
      if (curved) blade.rotation.z = 0.06
      const guard = new THREE.Mesh(new THREE.BoxGeometry(curved ? 0.12 : 0.32, 0.05, 0.08), curved ? glowMat : steel)
      guard.position.y = 0.14
      g.add(grip(), blade, guard)
      break
    }
    case 'hammer': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8), dark)
      shaft.position.y = 0.5
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.32), mat('#6d6a66', { metalness: 0.6 }))
      head.position.y = 1.15
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.34), glowMat)
      band.position.y = 1.15
      g.add(shaft, head, band)
      break
    }
    case 'axes':
    case 'daggers': {
      const makeOne = () => {
        const w = new THREE.Group()
        if (type === 'axes') {
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), dark)
          shaft.position.y = 0.25
          const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16, 1, false, 0, Math.PI), glowMat)
          blade.rotation.z = Math.PI / 2
          blade.position.set(0, 0.5, 0)
          w.add(shaft, blade)
        } else {
          const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.45, 4), glowMat)
          blade.position.y = 0.33
          const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.05), steel)
          guard.position.y = 0.1
          w.add(grip(0.16), blade, guard)
        }
        return w
      }
      const off = makeOne()
      g.add(makeOne())
      return { main: g, off }
    }
    case 'spear': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8), dark)
      shaft.position.y = 0.55
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), glowMat)
      tip.position.y = 1.85
      g.add(shaft, tip)
      break
    }
    case 'scythe': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.9, 8), dark)
      shaft.position.y = 0.65
      const blade = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 6, 24, Math.PI * 0.55), glowMat)
      blade.scale.set(1, 1, 0.4)
      blade.position.set(-0.55, 1.55, 0)
      blade.rotation.z = -0.15
      g.add(shaft, blade)
      break
    }
    case 'staff': {
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.8, 8), dark)
      shaft.position.y = 0.55
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), glowMat)
      orb.position.y = 1.55
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 24), steel)
      ring.position.y = 1.55
      g.add(shaft, orb, ring)
      break
    }
    case 'bow': {
      // Holder frame: x maps to backward, y is up — limbs curve back toward the archer.
      const holder = new THREE.Group()
      const arcLen = 2.3
      const r = 0.62
      const limb = new THREE.Mesh(new THREE.TorusGeometry(r, 0.028, 6, 28, arcLen), mat('#5b3a22'))
      limb.rotation.z = Math.PI - arcLen / 2
      limb.position.x = r
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2 * r * Math.sin(arcLen / 2), 4), glowMat)
      string.position.x = r * (1 - Math.cos(arcLen / 2))
      holder.add(limb, string)
      holder.rotation.y = Math.PI / 2
      g.add(holder)
      // a quiver arrow in the draw hand
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 4), mat('#d8c9a8'))
      arrow.position.y = 0.3
      const off = new THREE.Group()
      off.add(arrow)
      // bow lives in the off (left) hand, arrow in the main hand
      return { main: off, off: g }
    }
  }
  return { main: g }
}

function buildRig(cfg: CombatantConfig): Rig {
  const glowMats: THREE.MeshStandardMaterial[] = []
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)

  const armor = mat(cfg.color, { metalness: 0.45, roughness: 0.45 })
  const trim = mat(cfg.accent, { emissive: cfg.accent, emissiveIntensity: 0.25, metalness: 0.6 })
  const cloth = mat(new THREE.Color(cfg.color).multiplyScalar(0.45), { roughness: 0.9 })
  const skin = mat('#d9a98a', { roughness: 0.7, metalness: 0 })
  glowMats.push(trim)

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.45, 6, 12), armor)
  torso.position.y = 1.32
  torso.scale.set(1.1, 1, 0.75)
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.09, 16), trim)
  belt.position.y = 1.02
  belt.scale.z = 0.8
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), skin)
  head.position.y = 1.9
  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), armor)
  helm.position.y = 1.92
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 6), trim)
  crest.position.set(0, 2.15, -0.04)
  crest.rotation.x = -0.4
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), trim)
  visor.position.set(0, 1.9, 0.18)
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.1), new THREE.MeshStandardMaterial({ color: cloth.color, side: THREE.DoubleSide, roughness: 0.9 }))
  cape.position.set(0, 1.12, -0.26)
  cape.rotation.x = 0.12
  body.add(torso, belt, head, helm, crest, visor, cape)

  for (const side of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), trim)
    pad.position.set(side * 0.4, 1.62, 0)
    pad.scale.set(1.2, 0.8, 1)
    body.add(pad)
  }

  const makeLimb = (len: number, radius: number, material: THREE.Material) => {
    const pivot = new THREE.Group()
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 4, 10), material)
    limb.position.y = -len / 2 - radius
    pivot.add(limb)
    return pivot
  }

  const armR = makeLimb(0.48, 0.085, armor)
  armR.position.set(-0.42, 1.58, 0)
  const armL = makeLimb(0.48, 0.085, armor)
  armL.position.set(0.42, 1.58, 0)
  const legR = makeLimb(0.62, 0.11, cloth)
  legR.position.set(-0.16, 0.95, 0)
  const legL = makeLimb(0.62, 0.11, cloth)
  legL.position.set(0.16, 0.95, 0)
  for (const leg of [legR, legL]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.32), armor)
    boot.position.set(0, -0.9, 0.05)
    leg.add(boot)
  }
  body.add(armR, armL, legR, legL)

  const { main, off } = buildWeapon(cfg.weaponType, cfg.accent, glowMats)
  const hand = (arm: THREE.Group, w: THREE.Group) => {
    w.position.y = -0.72
    w.rotation.x = Math.PI / 2
    arm.add(w)
  }
  hand(armR, main)
  if (off) hand(armL, off)

  if (cfg.weaponType === 'swordShield') {
    const shield = new THREE.Group()
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), armor)
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), trim)
    boss.position.y = 0.05
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 6, 24), trim)
    rim.rotation.x = Math.PI / 2
    shield.add(disc, boss, rim)
    shield.rotation.x = Math.PI / 2
    shield.position.set(0.05, -0.5, 0.12)
    armL.add(shield)
  }

  shadowed(root)
  return { root, body, armR, armL, legR, legL, glowMats }
}

// ---------- Battle ----------

export class Battle {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private container: HTMLElement
  private onUpdate: (s: BattleSnapshot) => void
  private p1: Combatant
  private p2: Combatant
  private projectiles: Projectile[] = []
  private effects: Effect[] = []
  private keys = new Set<string>()
  private pressed = new Set<string>()
  private raf = 0
  private last = 0
  private time = ROUND_TIME
  private status: BattleStatus = 'countdown'
  private countdown = 3.2
  private winner: 0 | 1 | 2 | null = null
  private callout: string | null = null
  private calloutTime = 0
  private hitstop = 0
  private slowmo = 1
  private overTimer = 0
  private shake = 0
  private camSide = new THREE.Vector3(0, 0, 1)
  private camPos = new THREE.Vector3(0, 6, 14)
  private camLook = new THREE.Vector3()
  private emitTimer = 0
  private resizeObs: ResizeObserver
  private clockT = 0
  private disposed = false

  constructor(container: HTMLElement, p1: CombatantConfig, p2: CombatantConfig, onUpdate: (s: BattleSnapshot) => void) {
    this.container = container
    this.onUpdate = onUpdate
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.display = 'block'

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    this.buildArena()

    this.p1 = new Combatant(p1)
    this.p2 = new Combatant(p2)
    this.scene.add(this.p1.rig.root, this.p2.rig.root)
    this.resetPositions()

    this.resize()
    this.resizeObs = new ResizeObserver(() => this.resize())
    this.resizeObs.observe(container)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)

    this.last = performance.now()
    this.raf = requestAnimationFrame(this.loop)
    this.emit()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.resizeObs.disconnect()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.geometry.dispose()
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        mats.forEach((x) => x.dispose())
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  restart() {
    for (const c of [this.p1, this.p2]) {
      c.hp = c.maxHp
      c.mana = 50
      c.ult = 0
      c.action = 'idle'
      c.stun = 0
      c.blocking = false
      c.rig.root.rotation.set(0, 0, 0)
      c.rig.body.rotation.set(0, 0, 0)
      c.rig.body.position.set(0, 0, 0)
    }
    this.projectiles.forEach((p) => this.scene.remove(p.mesh))
    this.projectiles = []
    this.resetPositions()
    this.time = ROUND_TIME
    this.status = 'countdown'
    this.countdown = 3.2
    this.winner = null
    this.slowmo = 1
    this.overTimer = 0
    this.emit()
  }

  togglePause() {
    if (this.status === 'fighting') this.status = 'paused'
    else if (this.status === 'paused') {
      this.status = 'fighting'
      this.last = performance.now()
    }
    this.emit()
  }

  // Touch / on-screen controls feed the same input set as the keyboard.
  setKey(code: string, down: boolean) {
    if (down) {
      if (!this.keys.has(code)) this.pressed.add(code)
      this.keys.add(code)
    } else this.keys.delete(code)
  }

  private resetPositions() {
    this.p1.pos.set(-4, 0, 0)
    this.p2.pos.set(4, 0, 0)
    this.camSide.set(0, 0, 1)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const code = e.code
    if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI', 'ShiftLeft', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault()
    if (code === 'Escape' || code === 'KeyP') {
      this.togglePause()
      return
    }
    this.setKey(code, true)
  }
  private onKeyUp = (e: KeyboardEvent) => this.setKey(e.code, false)
  private onBlur = () => this.keys.clear()

  private resize() {
    const w = this.container.clientWidth || 1
    const h = this.container.clientHeight || 1
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.fov = w / h < 1 ? 65 : 50
    this.camera.updateProjectionMatrix()
  }

  private buildArena() {
    const s = this.scene
    s.background = new THREE.Color('#0b0a14')
    s.fog = new THREE.Fog('#0b0a14', 26, 70)

    s.add(new THREE.HemisphereLight('#8a9cff', '#2a1a10', 0.7))
    const sun = new THREE.DirectionalLight('#ffe2c0', 2.2)
    sun.position.set(8, 18, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    const sc = sun.shadow.camera
    sc.left = -18
    sc.right = 18
    sc.top = 18
    sc.bottom = -18
    sc.near = 1
    sc.far = 50
    sun.shadow.bias = -0.0005
    s.add(sun)
    const rim = new THREE.DirectionalLight('#7a5cff', 1.2)
    rim.position.set(-10, 8, -12)
    s.add(rim)

    // Floor: stone disc with procedural tile texture
    const tex = makeStoneTexture()
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 6)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    s.add(floor)

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(16, 17.5, 2.5, 64, 1, true), mat('#2a2530', { roughness: 1 }))
    plinth.position.y = -1.25
    s.add(plinth)

    const runeMat = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.55 })
    const ring = new THREE.Mesh(new THREE.RingGeometry(ARENA_RADIUS + 0.2, ARENA_RADIUS + 0.45, 96), runeMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    s.add(ring)
    const inner = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 64), new THREE.MeshBasicMaterial({ color: '#8f6bff', transparent: true, opacity: 0.35 }))
    inner.rotation.x = -Math.PI / 2
    inner.position.y = 0.02
    s.add(inner)

    // Ring of broken pillars with braziers
    const stone = mat('#4a4450', { roughness: 0.95 })
    const fire = new THREE.MeshBasicMaterial({ color: '#ffa24d' })
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const h = 4 + ((i * 37) % 5)
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, h, 10), stone)
      pillar.position.set(Math.cos(a) * 17.5, h / 2 - 0.5, Math.sin(a) * 17.5)
      pillar.castShadow = true
      s.add(pillar)
      if (i % 2 === 0) {
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), fire)
        flame.position.set(pillar.position.x, h - 0.2, pillar.position.z)
        flame.userData.flicker = i
        s.add(flame)
      }
    }
    const torchA = new THREE.PointLight('#ff8a3d', 40, 30, 1.6)
    torchA.position.set(0, 6, -16)
    const torchB = new THREE.PointLight('#ff8a3d', 30, 30, 1.6)
    torchB.position.set(0, 6, 16)
    s.add(torchA, torchB)

    // Starfield
    const starGeo = new THREE.BufferGeometry()
    const pts: number[] = []
    for (let i = 0; i < 900; i++) {
      const r = 80 + Math.random() * 30
      const th = Math.random() * Math.PI * 2
      const ph = Math.random() * Math.PI * 0.45
      pts.push(Math.cos(th) * Math.sin(ph) * r, Math.cos(ph) * r * 0.8 + 5, Math.sin(th) * Math.sin(ph) * r)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    s.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#cfd6ff', size: 0.35, fog: false })))

    // Floating rocks around the arena for depth
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2
      const r = 24 + Math.random() * 18
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + Math.random() * 1.6, 0), stone)
      rock.position.set(Math.cos(a) * r, -2 + Math.random() * 10, Math.sin(a) * r)
      rock.rotation.set(Math.random() * 3, Math.random() * 3, 0)
      rock.userData.float = Math.random() * 10
      s.add(rock)
    }
  }

  private loop = (now: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    let dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.clockT += dt

    if (this.status === 'paused') {
      this.render(0)
      return
    }

    if (this.hitstop > 0) {
      this.hitstop -= dt
      dt = 0
    }
    dt *= this.slowmo

    if (this.status === 'countdown') {
      this.countdown -= dt
      if (this.countdown <= 0) {
        this.status = 'fighting'
        this.say('FIGHT!')
      }
    } else if (this.status === 'fighting') {
      this.time = Math.max(0, this.time - dt)
      if (this.time <= 0) this.finish('TIME')
    } else if (this.status === 'over') {
      this.overTimer += dt / Math.max(this.slowmo, 0.01)
      if (this.overTimer > 1.2) this.slowmo = THREE.MathUtils.lerp(this.slowmo, 1, 0.1)
    }

    const live = this.status === 'fighting'
    this.updatePlayer(this.p1, this.p2, dt, live)
    if (this.p2.cfg.ai) this.updateAI(this.p2, this.p1, dt, live)
    this.simulate(this.p1, this.p2, dt)
    this.simulate(this.p2, this.p1, dt)
    this.separate()
    this.updateProjectiles(dt)
    this.updateEffects(dt)
    this.pressed.clear()

    if (this.calloutTime > 0) {
      this.calloutTime -= dt
      if (this.calloutTime <= 0) this.callout = null
    }

    this.render(dt)
    this.emitTimer -= dt
    if (this.emitTimer <= 0) {
      this.emitTimer = 0.05
      this.emit()
    }
  }

  private say(text: string, dur = 1.1) {
    this.callout = text
    this.calloutTime = dur
    this.emit()
  }

  private finish(reason: 'KO' | 'TIME') {
    if (this.status === 'over') return
    this.status = 'over'
    const r1 = this.p1.hp / this.p1.maxHp
    const r2 = this.p2.hp / this.p2.maxHp
    this.winner = r1 === r2 ? 0 : r1 > r2 ? 1 : 2
    if (reason === 'KO') this.slowmo = 0.25
    this.say(reason === 'KO' ? 'K.O.' : 'TIME!', reason === 'KO' ? 1.4 : 1.8)
  }

  private emit() {
    const snap = (c: Combatant): CombatantSnapshot => ({
      name: c.cfg.name,
      hp: Math.max(0, c.hp),
      maxHp: c.maxHp,
      mana: c.mana,
      ult: c.ult,
    })
    this.onUpdate({
      p1: snap(this.p1),
      p2: snap(this.p2),
      time: Math.ceil(this.time),
      status: this.status,
      countdown: Math.ceil(this.countdown),
      winner: this.winner,
      callout: this.callout,
    })
  }

  // ----- control -----

  private trigger(me: Combatant, kind: 'light' | 'heavy' | 'cast' | 'ult' | 'dash') {
    if (!me.canAct()) return
    const p = me.profile
    if (kind === 'light') me.start('light', p.light.dur)
    else if (kind === 'heavy') me.start('heavy', p.heavy.dur)
    else if (kind === 'cast') {
      if (me.mana < p.castCost) return
      me.mana -= p.castCost
      me.start('cast', 0.5)
    } else if (kind === 'ult') {
      if (me.ult < MAX_ULT) return
      me.ult = 0
      me.start('ult', 1.0)
      this.say(me.cfg.name.split(' ')[0].toUpperCase() + ' UNLEASHED', 1)
    } else if (kind === 'dash') {
      me.start('dash', 0.28)
      me.invuln = 0.22
      const dir = me.moveDir.lengthSq() > 0.01 ? me.moveDir.clone().normalize() : new THREE.Vector3(Math.sin(me.facing), 0, Math.cos(me.facing)).multiplyScalar(-1)
      me.vel.copy(dir.multiplyScalar(me.moveSpeed * 3.4))
    }
  }

  private updatePlayer(me: Combatant, foe: Combatant, _dt: number, live: boolean) {
    me.moveDir.set(0, 0, 0)
    me.blocking = false
    if (!live || me.hp <= 0) return
    const k = this.keys
    const fwd = new THREE.Vector3()
    this.camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x)
    const x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0)
    const z = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
    me.moveDir.addScaledVector(right, x).addScaledVector(fwd, z)
    if (me.moveDir.lengthSq() > 1) me.moveDir.normalize()

    const pr = this.pressed
    if (pr.has('KeyJ')) this.trigger(me, 'light')
    else if (pr.has('KeyK')) this.trigger(me, 'heavy')
    else if (pr.has('KeyL')) this.trigger(me, 'cast')
    else if (pr.has('KeyU')) this.trigger(me, 'ult')
    else if (pr.has('Space')) this.trigger(me, 'dash')
    if ((k.has('KeyI') || k.has('ShiftLeft') || k.has('ShiftRight')) && me.canAct()) me.blocking = true
    void foe
  }

  private updateAI(me: Combatant, foe: Combatant, dt: number, live: boolean) {
    me.moveDir.set(0, 0, 0)
    if (!live || me.hp <= 0) {
      me.blocking = false
      return
    }
    const d = me.pos.distanceTo(foe.pos)
    const diff = me.cfg.difficulty
    const ranged = me.profile.ranged || me.cfg.weaponType === 'staff'
    const preferred = ranged ? 8 : me.profile.reach * 0.8

    if (me.aiBlockFor > 0) {
      me.aiBlockFor -= dt
      me.blocking = me.canAct()
      return
    }
    me.blocking = false

    me.aiThink -= dt
    const toFoe = foe.pos.clone().sub(me.pos).setY(0).normalize()
    const side = new THREE.Vector3(-toFoe.z, 0, toFoe.x)

    // Movement every frame toward preferred range plus a strafe
    if (d > preferred + 0.6) me.moveDir.copy(toFoe)
    else if (d < preferred - 1.5 && ranged) me.moveDir.copy(toFoe).multiplyScalar(-1)
    me.moveDir.addScaledVector(side, me.aiStrafe * (ranged ? 0.7 : 0.35))
    if (me.moveDir.lengthSq() > 1) me.moveDir.normalize()

    if (me.aiThink > 0) return
    me.aiThink = THREE.MathUtils.lerp(0.55, 0.16, diff) + Math.random() * 0.2
    if (Math.random() < 0.15) me.aiStrafe *= -1

    const foeThreat = (foe.action === 'light' || foe.action === 'heavy') && d < foe.profile.reach + 1.2
    const incoming = this.projectiles.some((p) => p.target === me && p.mesh.position.distanceTo(me.pos) < 6)
    if ((foeThreat || incoming) && Math.random() < 0.15 + diff * 0.55) {
      if (Math.random() < 0.3 + diff * 0.3) {
        me.moveDir.copy(side).multiplyScalar(me.aiStrafe)
        this.trigger(me, 'dash')
      } else me.aiBlockFor = 0.35 + Math.random() * 0.3
      return
    }
    if (me.ult >= MAX_ULT && (ranged || d < 5)) return this.trigger(me, 'ult')
    if (me.mana >= me.profile.castCost && d > 4.5 && Math.random() < 0.25 + diff * 0.3) return this.trigger(me, 'cast')
    if (me.profile.ranged && d > 2.5) return this.trigger(me, Math.random() < 0.3 ? 'heavy' : 'light')
    if (d <= me.profile.reach + 0.3 && Math.random() < 0.45 + diff * 0.45) {
      this.trigger(me, Math.random() < 0.3 + diff * 0.15 ? 'heavy' : 'light')
    }
  }

  // ----- simulation -----

  private simulate(me: Combatant, foe: Combatant, dt: number) {
    if (dt <= 0) return this.animate(me, 0)
    me.mana = Math.min(MAX_MANA, me.mana + dt * (6 + me.cfg.magic * 0.5))
    me.invuln = Math.max(0, me.invuln - dt)
    me.flash = Math.max(0, me.flash - dt * 4)

    // face the opponent (lock-on)
    if (me.action !== 'ko') {
      const dx = foe.pos.x - me.pos.x
      const dz = foe.pos.z - me.pos.z
      const target = Math.atan2(dx, dz)
      let delta = target - me.facing
      delta = Math.atan2(Math.sin(delta), Math.cos(delta))
      me.facing += delta * Math.min(1, dt * 12)
    }

    if (me.stun > 0) {
      me.stun -= dt
      if (me.stun <= 0 && me.action === 'hit') me.action = 'idle'
    }

    if (me.action === 'idle' && me.stun <= 0) {
      const speed = me.blocking ? me.moveSpeed * 0.35 : me.moveSpeed
      me.vel.lerp(me.moveDir.clone().multiplyScalar(speed), Math.min(1, dt * 14))
    } else if (me.action === 'dash') {
      // keep dash momentum
    } else {
      me.vel.multiplyScalar(Math.max(0, 1 - dt * 8))
    }

    if (me.action !== 'idle' && me.action !== 'hit' && me.action !== 'ko') {
      me.actionTime += dt
      this.fireAction(me, foe)
      if (me.actionTime >= me.actionDur) {
        me.action = 'idle'
        if (me.vel.lengthSq() > 0) me.vel.multiplyScalar(0.3)
      }
    }

    me.pos.addScaledVector(me.vel, dt)
    const r = Math.hypot(me.pos.x, me.pos.z)
    if (r > ARENA_RADIUS) me.pos.multiplyScalar(ARENA_RADIUS / r)
    me.walkPhase += dt * me.vel.length() * 2.6

    this.animate(me, dt)
  }

  private fireAction(me: Combatant, foe: Combatant) {
    if (me.actionFired) return
    const p = me.profile
    const at = me.action === 'light' ? p.light.hit : me.action === 'heavy' ? p.heavy.hit : me.action === 'cast' ? 0.25 : me.action === 'ult' ? 0.45 : Infinity
    if (me.actionTime < at) return
    me.actionFired = true

    const fwd = new THREE.Vector3(Math.sin(me.facing), 0, Math.cos(me.facing))
    if (me.action === 'light' || me.action === 'heavy') {
      const heavy = me.action === 'heavy'
      const spec = heavy ? p.heavy : p.light
      if (p.ranged) {
        this.spawnArrow(me, foe, spec.dmg * me.powerMult, heavy ? 42 : 30, heavy)
        return
      }
      // lunge a little into the strike
      me.vel.addScaledVector(fwd, heavy ? 3 : 1.8)
      const to = foe.pos.clone().sub(me.pos).setY(0)
      const dist = to.length()
      if (dist <= p.reach + 0.5 && fwd.dot(to.normalize()) > 0.2) {
        this.applyHit(me, foe, spec.dmg * me.powerMult, heavy, fwd)
        if (me.cfg.weaponType === 'scythe' && heavy) me.hp = Math.min(me.maxHp, me.hp + 4)
      } else {
        this.spawnSwoosh(me, fwd, p.reach)
      }
    } else if (me.action === 'cast') {
      this.spawnBolt(me, foe)
    } else if (me.action === 'ult') {
      this.ultimate(me, foe)
    }
  }

  private applyHit(from: Combatant, to: Combatant, dmg: number, heavy: boolean, dir: THREE.Vector3, unblockable = false) {
    if (to.hp <= 0 || to.invuln > 0) return
    const toFacing = new THREE.Vector3(Math.sin(to.facing), 0, Math.cos(to.facing))
    const blocked = to.blocking && toFacing.dot(dir) < -0.2
    let amount = dmg * (1 - to.cfg.defense * 0.025)
    if (blocked) amount *= unblockable ? 0.5 : to.profile.blockFactor
    to.hp -= amount
    to.flash = 1
    from.ult = Math.min(MAX_ULT, from.ult + amount * 1.3)
    to.ult = Math.min(MAX_ULT, to.ult + amount * 0.8)
    const hitPos = to.pos.clone().setY(1.3)
    this.spawnSpark(hitPos, blocked ? '#9fd4ff' : from.cfg.accent, heavy ? 1.4 : 0.9)
    if (blocked) {
      to.vel.addScaledVector(dir, heavy ? 4 : 2)
    } else {
      to.action = 'hit'
      to.stun = heavy ? 0.5 : 0.28
      to.vel.copy(dir).multiplyScalar(heavy ? 7 : 3.5)
      this.hitstop = heavy ? 0.09 : 0.045
      this.shake = Math.max(this.shake, heavy ? 0.35 : 0.15)
    }
    if (to.hp <= 0) {
      to.hp = 0
      to.action = 'ko'
      to.actionTime = 0
      to.stun = 0
      to.vel.copy(dir).multiplyScalar(8)
      this.shake = 0.6
      this.finish('KO')
    }
  }

  private spawnArrow(me: Combatant, foe: Combatant, dmg: number, speed: number, heavy: boolean, angleOffset = 0) {
    const g = new THREE.Group()
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 5), mat('#e6d8b8'))
    shaft.rotation.x = Math.PI / 2
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), new THREE.MeshBasicMaterial({ color: me.cfg.accent }))
    tip.rotation.x = Math.PI / 2
    tip.position.z = 0.5
    const trail = new THREE.Mesh(new THREE.SphereGeometry(heavy ? 0.16 : 0.1, 8, 8), new THREE.MeshBasicMaterial({ color: me.cfg.accent, transparent: true, opacity: 0.6 }))
    trail.position.z = 0.4
    g.add(shaft, tip, trail)
    const aim = foe.pos.clone().sub(me.pos).setY(0).normalize()
    aim.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset)
    g.position.copy(me.pos).setY(1.45).addScaledVector(aim, 0.6)
    g.lookAt(g.position.clone().add(aim))
    this.scene.add(g)
    this.projectiles.push({ mesh: g, vel: aim.multiplyScalar(speed), owner: me, target: foe, dmg, life: 1.4, homing: 0, heavy })
  }

  private spawnBolt(me: Combatant, foe: Combatant) {
    const color = me.cfg.accent
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }))
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }))
    core.add(halo)
    const aim = foe.pos.clone().sub(me.pos).setY(0).normalize()
    core.position.copy(me.pos).setY(1.4).addScaledVector(aim, 0.8)
    this.scene.add(core)
    const homing = me.cfg.weaponType === 'staff' ? 2.5 : 0.8
    this.projectiles.push({ mesh: core, vel: aim.multiplyScalar(17), owner: me, target: foe, dmg: 14 * me.magicMult, life: 1.8, homing, heavy: true })
  }

  private ultimate(me: Combatant, foe: Combatant) {
    const color = me.cfg.accent
    this.shake = 0.5
    if (me.cfg.weaponType === 'bow') {
      for (let i = -4; i <= 4; i++) this.spawnArrow(me, foe, 7 * me.magicMult, 34, true, i * 0.09)
      return
    }
    const radius = 5.5
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.copy(me.pos).setY(0.1)
    this.scene.add(ring)
    this.effects.push({ mesh: ring, life: 0.6, maxLife: 0.6, grow: radius * 1.6 })
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    dome.position.copy(me.pos).setY(0.5)
    this.scene.add(dome)
    this.effects.push({ mesh: dome, life: 0.5, maxLife: 0.5, grow: radius * 1.4 })

    if (me.cfg.weaponType === 'scythe') me.hp = Math.min(me.maxHp, me.hp + 18)
    if (me.cfg.weaponType === 'swordShield') me.hp = Math.min(me.maxHp, me.hp + 14)

    const to = foe.pos.clone().sub(me.pos).setY(0)
    if (to.length() <= radius) this.applyHit(me, foe, 28 * me.magicMult, true, to.normalize(), true)
  }

  private updateProjectiles(dt: number) {
    if (dt <= 0) return
    this.projectiles = this.projectiles.filter((p) => {
      p.life -= dt
      if (p.homing > 0 && p.target.hp > 0) {
        const want = p.target.pos.clone().setY(1.3).sub(p.mesh.position).normalize().multiplyScalar(p.vel.length())
        p.vel.lerp(want, Math.min(1, dt * p.homing))
      }
      p.mesh.position.addScaledVector(p.vel, dt)
      if (p.mesh.children.length === 3) p.mesh.lookAt(p.mesh.position.clone().add(p.vel))
      p.mesh.rotation.z += dt * 6
      const t = p.target
      const dx = t.pos.x - p.mesh.position.x
      const dz = t.pos.z - p.mesh.position.z
      const hit = Math.hypot(dx, dz) < 0.75 && t.hp > 0 && t.invuln <= 0
      if (hit) {
        this.applyHit(p.owner, t, p.dmg, p.heavy, p.vel.clone().setY(0).normalize())
      }
      const out = Math.hypot(p.mesh.position.x, p.mesh.position.z) > 22
      if (hit || p.life <= 0 || out) {
        this.scene.remove(p.mesh)
        disposeTree(p.mesh)
        return false
      }
      return true
    })
  }

  private spawnSpark(pos: THREE.Vector3, color: string, size: number) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.3 * size, 12, 12),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    m.position.copy(pos)
    this.scene.add(m)
    this.effects.push({ mesh: m, life: 0.25, maxLife: 0.25, grow: 3 * size })
  }

  private spawnSwoosh(me: Combatant, fwd: THREE.Vector3, reach: number) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(reach * 0.6, reach * 0.75, 24, 1, -0.9, 1.8),
      new THREE.MeshBasicMaterial({ color: me.cfg.accent, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    m.rotation.x = -Math.PI / 2
    m.rotation.z = Math.atan2(fwd.z, fwd.x)
    m.position.copy(me.pos).setY(1.2)
    this.scene.add(m)
    this.effects.push({ mesh: m, life: 0.18, maxLife: 0.18, grow: 0.2 })
  }

  private updateEffects(dt: number) {
    this.effects = this.effects.filter((e) => {
      e.life -= dt
      const t = 1 - e.life / e.maxLife
      const s = 1 + e.grow * t
      e.mesh.scale.set(s, s, s)
      ;(e.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t) * 0.9
      if (e.life <= 0) {
        this.scene.remove(e.mesh)
        disposeTree(e.mesh)
        return false
      }
      return true
    })
  }

  private separate() {
    const a = this.p1.pos
    const b = this.p2.pos
    const d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z)
    const len = d.length()
    const min = 1.1
    if (len < min && len > 0.0001) {
      const push = d.multiplyScalar((min - len) / len / 2)
      a.sub(push)
      b.add(push)
    }
  }

  // ----- animation -----

  private animate(me: Combatant, dt: number) {
    const { root, body, armR, armL, legR, legL, glowMats } = me.rig
    root.position.copy(me.pos)
    root.rotation.y = me.facing
    const L = (cur: number, target: number, k = 18) => THREE.MathUtils.lerp(cur, target, Math.min(1, dt * k))
    const twin = me.cfg.weaponType === 'axes' || me.cfg.weaponType === 'daggers'
    const bow = me.cfg.weaponType === 'bow'

    if (me.action === 'ko') {
      root.rotation.x = L(root.rotation.x, -Math.PI / 2 + 0.1, 6)
      root.position.y = 0.25
      armR.rotation.x = L(armR.rotation.x, -2.6, 6)
      armL.rotation.x = L(armL.rotation.x, -2.6, 6)
      return
    }
    root.rotation.x = 0

    const moving = me.vel.length() > 0.5
    const swing = moving ? Math.sin(me.walkPhase) * 0.7 : 0
    legR.rotation.x = L(legR.rotation.x, swing)
    legL.rotation.x = L(legL.rotation.x, -swing)
    body.position.y = moving ? Math.abs(Math.cos(me.walkPhase)) * 0.06 : Math.sin(this.clockT * 2.5) * 0.015

    let rX = bow ? -0.4 : -0.55
    let lX = bow ? -1.35 : twin ? -0.55 : -0.35
    let rZ = 0
    let lZ = 0
    let lean = 0
    let twist = 0
    const t = me.actionDur > 0 ? me.actionTime / me.actionDur : 0

    if (me.action === 'light' || me.action === 'heavy') {
      const heavy = me.action === 'heavy'
      const hitT = (heavy ? me.profile.heavy.hit : me.profile.light.hit) / me.actionDur
      if (bow) {
        lX = -1.5
        rX = t < hitT ? -1.5 : -0.6
        rZ = t < hitT ? -0.6 * (t / hitT) : 0
        twist = 0.35
      } else {
        const wind = heavy ? -2.8 : -2.0
        const end = heavy ? 0.35 : 0.1
        const arm = t < hitT ? THREE.MathUtils.lerp(-0.6, wind, t / hitT) : THREE.MathUtils.lerp(end, -0.55, (t - hitT) / (1 - hitT))
        if (t >= hitT && t < hitT + 0.12) rX = end
        else rX = arm
        twist = t < hitT ? -0.35 : 0.4
        lean = t < hitT ? -0.1 : 0.15
        if (me.cfg.weaponType === 'spear') {
          rX = t < hitT ? -1.0 : -1.6
          twist = t < hitT ? -0.5 : 0.2
        }
        if (twin) lX = heavy ? rX : t < hitT ? -0.4 : -1.4
        if (me.cfg.weaponType === 'hammer' || me.cfg.weaponType === 'staff') lX = rX
      }
    } else if (me.action === 'cast') {
      rX = -1.6
      lX = -1.6
      lean = -0.08
    } else if (me.action === 'ult') {
      rX = t < 0.45 ? -2.9 : 0.2
      lX = t < 0.45 ? -2.9 : 0.2
      rZ = t < 0.45 ? 0 : -0.6
      lZ = t < 0.45 ? 0 : 0.6
      body.position.y = t < 0.45 ? t * 0.8 : 0
    } else if (me.action === 'hit') {
      lean = -0.35
      rX = 0.2
      lX = 0.2
    } else if (me.action === 'dash') {
      lean = 0.35
    }
    if (me.blocking) {
      rX = -1.3
      lX = me.cfg.weaponType === 'swordShield' ? -1.55 : -1.3
      rZ = 0.5
      lZ = -0.5
      lean = -0.05
    }

    armR.rotation.x = L(armR.rotation.x, rX, 26)
    armL.rotation.x = L(armL.rotation.x, lX, 26)
    armR.rotation.z = L(armR.rotation.z, rZ, 20)
    armL.rotation.z = L(armL.rotation.z, lZ, 20)
    body.rotation.x = L(body.rotation.x, lean, 14)
    body.rotation.y = L(body.rotation.y, twist, 14)

    const pulse = 0.4 + Math.sin(this.clockT * 4) * 0.15 + (me.ult >= MAX_ULT ? 0.8 : 0) + me.flash * 2
    glowMats.forEach((m) => (m.emissiveIntensity = pulse))
  }

  private render(dt: number) {
    // camera: perpendicular to the fighters' axis, framing both
    const a = this.p1.pos
    const b = this.p2.pos
    const mid = a.clone().add(b).multiplyScalar(0.5)
    const axis = b.clone().sub(a).setY(0)
    const dist = axis.length()
    axis.normalize()
    let side = new THREE.Vector3(-axis.z, 0, axis.x)
    if (side.dot(this.camSide) < 0) side.multiplyScalar(-1)
    this.camSide.lerp(side, Math.min(1, dt * 2)).normalize()
    const back = THREE.MathUtils.clamp(dist * 0.85 + 6.5, 8.5, 21)
    const desired = mid.clone().addScaledVector(this.camSide, back).add(new THREE.Vector3(0, back * 0.32 + 2, 0))
    // pull slightly toward the player's side so P1 stays left-of-centre
    desired.addScaledVector(b.clone().sub(a).setY(0).normalize(), -0.8)
    if (dt > 0) this.camPos.lerp(desired, Math.min(1, dt * 4))
    this.camLook.lerp(mid.clone().setY(1.3), Math.min(1, dt * 6 || 1))
    this.camera.position.copy(this.camPos)
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 1.8)
      const s = this.shake * 0.5
      this.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s))
    }
    this.camera.lookAt(this.camLook)

    this.scene.traverse((o) => {
      if (o.userData.flicker !== undefined) {
        const f = 1 + Math.sin(this.clockT * 12 + o.userData.flicker) * 0.12
        o.scale.setScalar(f)
      } else if (o.userData.float !== undefined) {
        o.position.y += Math.sin(this.clockT * 0.6 + o.userData.float) * 0.003
        o.rotation.y += 0.002
      }
    })

    this.renderer.render(this.scene, this.camera)
  }
}

function disposeTree(o: THREE.Object3D) {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh) {
      m.geometry.dispose()
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      mats.forEach((x) => x.dispose())
    }
  })
}

function makeStoneTexture() {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.fillStyle = '#3b3640'
  g.fillRect(0, 0, size, size)
  const tile = 64
  for (let y = 0; y < size; y += tile) {
    for (let x = 0; x < size; x += tile) {
      const v = 50 + Math.floor(Math.random() * 18)
      g.fillStyle = `rgb(${v},${v - 4},${v + 6})`
      g.fillRect(x + 2, y + 2, tile - 4, tile - 4)
      for (let i = 0; i < 40; i++) {
        const n = Math.random() * 20 - 10
        g.fillStyle = `rgba(${v + n},${v + n},${v + n + 6},0.5)`
        g.fillRect(x + Math.random() * tile, y + Math.random() * tile, 3, 3)
      }
    }
  }
  g.strokeStyle = 'rgba(0,0,0,0.5)'
  g.lineWidth = 3
  for (let i = 0; i <= size; i += tile) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i, size)
    g.moveTo(0, i)
    g.lineTo(size, i)
    g.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export const CONTROLS = [
  { keys: 'W A S D', label: 'Move' },
  { keys: 'J', label: 'Light attack' },
  { keys: 'K', label: 'Heavy attack' },
  { keys: 'L', label: 'Magic' },
  { keys: 'U', label: 'Ultimate (full meter)' },
  { keys: 'Shift / I', label: 'Block' },
  { keys: 'Space', label: 'Dash' },
  { keys: 'Esc / P', label: 'Pause' },
]
