// Minimal state store (<50 lines)
export type GameState = 'idle' | 'playing' | 'gameover'

export interface GameConfig {
  gravity: number
  chargeRate: number
  maxCharge: number
  minJumpVelocity: number
  maxJumpVelocity: number
  platformGap: { min: number; max: number }
  platformWidth: { min: number; max: number }
  scrollSpeed: number
  speedIncreasePer50: number
  colors: string[]
  colorblindDuration: number
  slowmoDuration: number
  slowmoFactor: number
}

export interface GameStats {
  score: number
  bestScore: number
  combo: number
  maxCombo: number
  speedMultiplier: number
}

export interface ActiveEffects {
  colorblindUntil: number
  slowmoUntil: number
}

type Listener = () => void

export function createStore(config: GameConfig) {
  let state: GameState = 'idle'
  let stats: GameStats = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('color-jump-best') || '0', 10),
    combo: 0,
    maxCombo: 0,
    speedMultiplier: 1,
  }
  let effects: ActiveEffects = { colorblindUntil: 0, slowmoUntil: 0 }
  const listeners = new Set<Listener>()

  const emit = () => listeners.forEach(l => l())

  return {
    getState: () => state,
    setState: (s: GameState) => { state = s; emit() },
    getStats: () => stats,
    getEffects: () => effects,
    getConfig: () => config,
    addScore: (points: number) => {
      stats.score += points
      if (stats.score > stats.bestScore) {
        stats.bestScore = stats.score
        localStorage.setItem('color-jump-best', String(stats.bestScore))
      }
      // Speed increase every 50 points
      const newMult = 1 + Math.floor(stats.score / 50) * config.speedIncreasePer50
      stats.speedMultiplier = newMult
      emit()
    },
    incrementCombo: () => {
      stats.combo++
      stats.maxCombo = Math.max(stats.maxCombo, stats.combo)
      if (stats.combo > 5) stats.combo = 5
      emit()
    },
    resetCombo: () => { stats.combo = 1; emit() },
    resetGame: () => {
      stats = { ...stats, score: 0, combo: 0, speedMultiplier: 1 }
      effects = { colorblindUntil: 0, slowmoUntil: 0 }
      emit()
    },
    setColorblind: (duration: number) => {
      effects.colorblindUntil = Date.now() + duration
      emit()
    },
    setSlowmo: (duration: number) => {
      effects.slowmoUntil = Date.now() + duration
      emit()
    },
    updateEffects: (now: number) => {
      let changed = false
      if (effects.colorblindUntil && now >= effects.colorblindUntil) {
        effects.colorblindUntil = 0; changed = true
      }
      if (effects.slowmoUntil && now >= effects.slowmoUntil) {
        effects.slowmoUntil = 0; changed = true
      }
      if (changed) emit()
    },
    isColorblind: (now: number) => now < effects.colorblindUntil,
    isSlowmo: (now: number) => now < effects.slowmoUntil,
    getEffectiveSpeed: (now: number) => {
      const base = config.scrollSpeed * stats.speedMultiplier
      return store.isSlowmo(now) ? base * config.slowmoFactor : base
    },
    subscribe: (l: Listener) => { listeners.add(l); return () => listeners.delete(l) },
  }
}

export const defaultConfig: GameConfig = {
  gravity: 0.45,
  chargeRate: 0.018,
  maxCharge: 1.0,
  minJumpVelocity: 8,
  maxJumpVelocity: 18,
  platformGap: { min: 140, max: 180 },
  platformWidth: { min: 60, max: 140 },
  scrollSpeed: 2.2,
  speedIncreasePer50: 0.04,
  colors: ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa'],
  colorblindDuration: 5000,
  slowmoDuration: 3000,
  slowmoFactor: 0.5,
}

// Singleton store instance
export const store = createStore(defaultConfig)