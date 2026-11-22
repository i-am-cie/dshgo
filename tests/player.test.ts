import { describe, it, expect } from 'vitest'
import {
  createPlayer,
  startCharge,
  releaseCharge,
  updatePlayer,
  landOnPlatform,
  getChargeRatio,
  setPlayerColor,
} from '../src/game/player'
import { defaultConfig } from '../src/game/store'

const W = 400
const H = 600

describe('createPlayer', () => {
  it('places the player centered horizontally near the bottom with defaults', () => {
    const p = createPlayer(defaultConfig, W, H)
    expect(p.x).toBe(W / 2 - 20)
    expect(p.y).toBe(H - 150)
    expect(p.width).toBe(40)
    expect(p.height).toBe(40)
    expect(p.vx).toBe(0)
    expect(p.vy).toBe(0)
    expect(p.onGround).toBe(false)
    expect(p.charge).toBe(0)
    expect(p.charging).toBe(false)
    expect(p.colorIndex).toBe(0)
  })
})

describe('startCharge', () => {
  it('does not charge while airborne', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.onGround = false
    startCharge(p)
    expect(p.charging).toBe(false)
  })

  it('starts charging on the ground and resets charge to zero', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.onGround = true
    p.charge = 0.6
    startCharge(p)
    expect(p.charging).toBe(true)
    expect(p.charge).toBe(0)
  })

  it('does not restart an already charging player', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.onGround = true
    startCharge(p)
    p.charge = 0.4
    startCharge(p)
    expect(p.charge).toBe(0.4)
  })
})

describe('releaseCharge', () => {
  it('leaves velocity untouched when not charging', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.vy = 3
    releaseCharge(p, defaultConfig)
    expect(p.vy).toBe(3)
    expect(p.charging).toBe(false)
  })

  it('full charge jumps at max jump velocity', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.charging = true
    p.charge = 1
    releaseCharge(p, defaultConfig)
    expect(p.vy).toBe(-defaultConfig.maxJumpVelocity)
    expect(p.onGround).toBe(false)
    expect(p.charge).toBe(0)
  })

  it('half charge interpolates between min and max jump velocity', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.charging = true
    p.charge = 0.5
    releaseCharge(p, defaultConfig)
    const expected = -(
      defaultConfig.minJumpVelocity +
      (defaultConfig.maxJumpVelocity - defaultConfig.minJumpVelocity) * 0.5
    )
    expect(p.vy).toBeCloseTo(expected, 10)
  })
})

describe('updatePlayer', () => {
  it('applies gravity to vertical velocity', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.vy = 0
    updatePlayer(p, 1, defaultConfig, W)
    expect(p.vy).toBeCloseTo(defaultConfig.gravity, 10)
  })

  it('moves horizontally by vx * dt', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.vx = 5
    const before = p.x
    updatePlayer(p, 2, defaultConfig, W)
    expect(p.x).toBeCloseTo(before + 5 * 2, 10)
  })

  it('grows charge while charging and caps at maxCharge', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.charging = true
    p.charge = defaultConfig.maxCharge
    updatePlayer(p, 1, defaultConfig, W)
    expect(p.charge).toBe(defaultConfig.maxCharge)

    p.charge = 0
    updatePlayer(p, 1, defaultConfig, W)
    expect(p.charge).toBeCloseTo(defaultConfig.chargeRate, 10)
  })

  it('clamps to the left edge and zeroes vx', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.x = -10
    p.vx = -4
    updatePlayer(p, 1, defaultConfig, W)
    expect(p.x).toBe(0)
    expect(p.vx).toBe(0)
  })

  it('clamps to the right edge and zeroes vx', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.x = W + 5
    p.vx = 4
    updatePlayer(p, 1, defaultConfig, W)
    expect(p.x).toBe(W - p.width)
    expect(p.vx).toBe(0)
  })
})

describe('landOnPlatform', () => {
  it('snaps to the platform top, stops vertical motion, marks grounded', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.vy = 12
    landOnPlatform(p, 300)
    expect(p.y).toBe(300 - p.height)
    expect(p.vy).toBe(0)
    expect(p.onGround).toBe(true)
  })
})

describe('getChargeRatio', () => {
  it('returns zero when not charging', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.charge = 0.8
    expect(getChargeRatio(p, defaultConfig)).toBe(0)
  })

  it('returns charge divided by maxCharge while charging', () => {
    const p = createPlayer(defaultConfig, W, H)
    p.charging = true
    p.charge = 0.5
    expect(getChargeRatio(p, defaultConfig)).toBeCloseTo(0.5, 10)
  })
})

describe('setPlayerColor', () => {
  it('updates the color index', () => {
    const p = createPlayer(defaultConfig, W, H)
    setPlayerColor(p, 3)
    expect(p.colorIndex).toBe(3)
  })
})
