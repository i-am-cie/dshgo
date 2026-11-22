import { describe, it, expect } from 'vitest'
import { createPlatformManager } from '../src/game/platforms'
import { defaultConfig } from '../src/game/store'

const W = 400
const H = 600

describe('createPlatformManager', () => {
  it('starts with an empty active list before reset', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    expect(mgr.getPlatforms()).toHaveLength(0)
  })

  it('reset() populates platforms near the visible area', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const platforms = mgr.getPlatforms()
    expect(platforms.length).toBeGreaterThan(0)
    for (const p of platforms) {
      expect(p.width).toBeGreaterThan(0)
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x + p.width).toBeLessThanOrEqual(W)
      expect(p.y).toBeGreaterThan(-400)
      expect(p.y).toBeLessThanOrEqual(H + 50)
    }
  })
})

describe('checkCollision', () => {
  it('returns the platform when the player lands on top of it', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const p = mgr.getPlatforms()[0]
    const playerW = 40
    const playerH = 40
    const playerX = p.x + p.width / 2 - playerW / 2
    const playerY = p.y - playerH
    expect(mgr.checkCollision(playerX, playerY, playerW, playerH)).toBe(p)
  })

  it('returns null when the player is horizontally outside the platform', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const p = mgr.getPlatforms()[0]
    expect(mgr.checkCollision(-200, p.y - 40, 40, 40)).toBeNull()
  })

  it('returns null when the player falls far below the platform top', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const p = mgr.getPlatforms()[0]
    const playerX = p.x + p.width / 2 - 20
    expect(mgr.checkCollision(playerX, p.y + 60, 40, 40)).toBeNull()
  })
})

describe('markPassed', () => {
  it('flags the platform as passed', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const p = mgr.getPlatforms()[0]
    expect(p.passed).toBe(false)
    mgr.markPassed(p)
    expect(p.passed).toBe(true)
  })
})

describe('update', () => {
  it('moves platforms downward by effective speed * dt', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.reset()
    const p = mgr.getPlatforms()[0]
    const before = p.y
    mgr.update(0.5)
    expect(p.y).toBeCloseTo(before + defaultConfig.scrollSpeed * 0.5, 10)
  })

  it('recycles platforms that fall below the screen', () => {
    const mgr = createPlatformManager(defaultConfig, W, H)
    mgr.getPlatforms().push({ x: 10, y: H + 100, width: 80, colorIndex: 0, type: 'normal', passed: false })
    mgr.update(0.016)
    // Objects are reused by the pool, so assert on the off-screen boundary instead of reference identity.
    expect(mgr.getPlatforms().every(p => p.y <= H + 50)).toBe(true)
  })
})
