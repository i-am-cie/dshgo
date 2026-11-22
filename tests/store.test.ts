import { describe, it, expect, beforeEach } from 'vitest'
import { createStore, defaultConfig } from '../src/game/store'

beforeEach(() => {
  localStorage.clear()
})

describe('createStore initial state', () => {
  it('starts idle with zeroed stats and multiplier 1', () => {
    const store = createStore(defaultConfig)
    expect(store.getState()).toBe('idle')
    const stats = store.getStats()
    expect(stats.score).toBe(0)
    expect(stats.combo).toBe(0)
    expect(stats.maxCombo).toBe(0)
    expect(stats.speedMultiplier).toBe(1)
  })
})

describe('setState', () => {
  it('switches state and notifies listeners', () => {
    const store = createStore(defaultConfig)
    let calls = 0
    store.subscribe(() => calls++)
    store.setState('playing')
    expect(store.getState()).toBe('playing')
    expect(calls).toBe(1)
  })
})

describe('addScore', () => {
  it('accumulates score and updates best score plus localStorage', () => {
    const store = createStore(defaultConfig)
    store.addScore(3)
    store.addScore(2)
    const stats = store.getStats()
    expect(stats.score).toBe(5)
    expect(stats.bestScore).toBe(5)
    expect(localStorage.getItem('color-jump-best')).toBe('5')
  })

  it('raises the speed multiplier every 50 points', () => {
    const store = createStore(defaultConfig)
    store.addScore(50)
    expect(store.getStats().speedMultiplier).toBeCloseTo(
      1 + Math.floor(50 / 50) * defaultConfig.speedIncreasePer50,
      10,
    )
  })

  it('does not lower best score when new score stays below it', () => {
    localStorage.setItem('color-jump-best', '40')
    const store = createStore(defaultConfig)
    store.addScore(10)
    expect(store.getStats().bestScore).toBe(40)
  })
})

describe('combo', () => {
  it('increments combo and tracks maxCombo', () => {
    const store = createStore(defaultConfig)
    store.incrementCombo()
    store.incrementCombo()
    const stats = store.getStats()
    expect(stats.combo).toBe(2)
    expect(stats.maxCombo).toBe(2)
  })

  it('caps combo at 5', () => {
    const store = createStore(defaultConfig)
    for (let i = 0; i < 8; i++) store.incrementCombo()
    expect(store.getStats().combo).toBe(5)
    expect(store.getStats().maxCombo).toBe(5)
  })

  it('resetCombo sets combo to 1', () => {
    const store = createStore(defaultConfig)
    store.incrementCombo()
    store.resetCombo()
    expect(store.getStats().combo).toBe(1)
  })
})

describe('resetGame', () => {
  it('clears score, combo, multiplier and active effects', () => {
    const store = createStore(defaultConfig)
    store.addScore(30)
    store.incrementCombo()
    store.setSlowmo(3000)
    store.resetGame()
    const stats = store.getStats()
    expect(stats.score).toBe(0)
    expect(stats.combo).toBe(0)
    expect(stats.speedMultiplier).toBe(1)
    expect(store.getEffects().slowmoUntil).toBe(0)
  })
})

describe('effects', () => {
  it('reports slowmo active before expiry and inactive after', () => {
    const store = createStore(defaultConfig)
    const now = Date.now()
    store.setSlowmo(3000)
    expect(store.isSlowmo(now)).toBe(true)
    expect(store.isSlowmo(now + 4000)).toBe(false)
  })

  it('updateEffects clears expired effects', () => {
    const store = createStore(defaultConfig)
    store.setColorblind(1000)
    store.updateEffects(Date.now() + 2000)
    expect(store.getEffects().colorblindUntil).toBe(0)
  })

  it('getEffectiveSpeed halves speed while slowmo is active', () => {
    const store = createStore(defaultConfig)
    const now = Date.now()
    store.setSlowmo(3000)
    const base = defaultConfig.scrollSpeed
    expect(store.getEffectiveSpeed(now)).toBeCloseTo(base * defaultConfig.slowmoFactor, 10)
    expect(store.getEffectiveSpeed(now + 4000)).toBeCloseTo(base, 10)
  })
})

describe('subscribe', () => {
  it('unsubscribe stops further notifications', () => {
    const store = createStore(defaultConfig)
    let calls = 0
    const unsubscribe = store.subscribe(() => calls++)
    store.setState('playing')
    unsubscribe()
    store.setState('gameover')
    expect(calls).toBe(1)
  })
})
