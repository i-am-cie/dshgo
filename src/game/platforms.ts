import { store } from './store'
import type { GameConfig } from './store'

export interface Platform {
  x: number
  y: number
  width: number
  colorIndex: number
  type: 'normal' | 'gold' | 'silver'
  passed: boolean
}

const POOL_SIZE = 30
const GOLD_CHANCE = 0.03
const SILVER_CHANCE = 0.05

export function createPlatformManager(config: GameConfig, canvasWidth: number, canvasHeight: number) {
  const pool: Platform[] = []
  const active: Platform[] = []
  let lastY = canvasHeight
  let lastColorIndex = -1

  // Initialize pool
  for (let i = 0; i < POOL_SIZE; i++) {
    pool.push({ x: 0, y: 0, width: 0, colorIndex: 0, type: 'normal', passed: false })
  }

  function acquire(): Platform {
    return pool.pop() || { x: 0, y: 0, width: 0, colorIndex: 0, type: 'normal', passed: false }
  }

  function release(p: Platform) {
    p.passed = false
    pool.push(p)
  }

  function randomColorIndex(exclude: number): number {
    const colors = config.colors
    let idx = Math.floor(Math.random() * colors.length)
    // Ensure we don't pick the same color twice in a row (for playability)
    if (idx === exclude && colors.length > 1) {
      idx = (idx + 1) % colors.length
    }
    return idx
  }

  function randomPlatformType(): Platform['type'] {
    const r = Math.random()
    if (r < GOLD_CHANCE) return 'gold'
    if (r < GOLD_CHANCE + SILVER_CHANCE) return 'silver'
    return 'normal'
  }

  

  function generateInitial() {
    const count = Math.ceil(canvasHeight / config.platformGap.min) + 2
    for (let i = 0; i < count; i++) {
      spawnPlatform(canvasHeight - i * (config.platformGap.min + config.platformGap.max) / 2)
    }
  }

  function spawnPlatform(targetY: number) {
    const p = acquire()
    const gap = config.platformGap.min + Math.random() * (config.platformGap.max - config.platformGap.min)
    const width = config.platformWidth.min + Math.random() * (config.platformWidth.max - config.platformWidth.min)
    const maxX = canvasWidth - width
    const colorIndex = randomColorIndex(lastColorIndex)
    const type = randomPlatformType()

    p.x = Math.random() * maxX
    p.y = targetY
    p.width = width
    p.colorIndex = colorIndex
    p.type = type
    p.passed = false

    lastY = targetY - gap
    lastColorIndex = colorIndex
    active.push(p)
  }

  function update(dt: number) {
    const now = Date.now()
    const effectiveSpeed = store.getEffectiveSpeed(now)
    // scrollSpeed parameter removed - using store.getEffectiveSpeed instead

    // Move platforms down (world moves up)
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i]
      p.y += effectiveSpeed * dt

      // Recycle platforms that go off screen bottom
      if (p.y > canvasHeight + 50) {
        active.splice(i, 1)
        release(p)
      }
    }

    // Spawn new platforms at top
    while (lastY > -50) {
      spawnPlatform(lastY)
    }
  }

  function getPlatforms(): Platform[] {
    return active
  }

  function checkCollision(playerX: number, playerY: number, playerWidth: number, playerHeight: number): Platform | null {
    for (const p of active) {
      // AABB collision - player bottom hits platform top
      if (
        playerY + playerHeight >= p.y &&
        playerY + playerHeight - 10 <= p.y + 10 && // Only trigger on landing, not passing through
        playerX + playerWidth * 0.3 > p.x &&
        playerX + playerWidth * 0.7 < p.x + p.width
      ) {
        return p
      }
    }
    return null
  }

  function markPassed(p: Platform) {
    p.passed = true
  }

  function reset() {
    active.forEach(release)
    active.length = 0
    lastY = canvasHeight
    lastColorIndex = -1
    generateInitial()
  }

  return {
    update,
    getPlatforms,
    checkCollision,
    markPassed,
    reset,
    config,
  }
}