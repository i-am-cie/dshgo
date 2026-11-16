import { store } from './store'
import { createPlatformManager } from './platforms'
import { createPlayer, startCharge, releaseCharge, updatePlayer, landOnPlatform, getChargeRatio, type Player } from './player'
import { createRenderer } from './renderer'

export interface Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  start: () => void
  destroy: () => void
}

export function createGame(canvas: HTMLCanvasElement): Game {
  const ctx = canvas.getContext('2d')!
  const config = store.getConfig()
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height

  // Core modules
  const platforms = createPlatformManager(config, canvasWidth, canvasHeight)
  const player = createPlayer(config, canvasWidth, canvasHeight)
  const renderer = createRenderer(ctx, config, canvasWidth, canvasHeight)

  // Game state
  let lastTime = 0
  let scrollY = 0
  let animationId: number | null = null
  let pendingCharge = false

  // Input handlers
  function onPointerDown(e: PointerEvent) {
    e.preventDefault()
    const state = store.getState()
    if (state === 'idle') {
      store.setState('playing')
      return
    }
    if (state === 'gameover') {
      resetGame()
      return
    }
    if (state === 'playing') {
      pendingCharge = true
    }
  }

  function onPointerUp(e: PointerEvent) {
    e.preventDefault()
    if (pendingCharge && store.getState() === 'playing') {
      pendingCharge = false
      releaseCharge(player, config)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault()
      onPointerDown(e as unknown as PointerEvent)
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      e.preventDefault()
      onPointerUp(e as unknown as PointerEvent)
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  function resetGame() {
    store.resetGame()
    platforms.reset()
    player.x = canvasWidth / 2 - 20
    player.y = canvasHeight - 150
    player.vx = 0
    player.vy = 0
    player.onGround = true
    player.charging = false
    player.charge = 0
    scrollY = 0
    store.setState('playing')
  }

  function gameLoop(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 1/30) // Cap at 30fps minimum
    lastTime = time

    const state = store.getState()
    const now = Date.now()

    // Update effects
    store.updateEffects(now)

    if (state === 'playing') {
      // Handle charge input
      if (pendingCharge && player.onGround && !player.charging) {
        startCharge(player)
      }

      // Update player
      updatePlayer(player, dt, config, canvasWidth)

      // Update platforms
      platforms.update(dt)

      // Update scroll
      const effectiveSpeed = store.getEffectiveSpeed(now)
      scrollY += effectiveSpeed * dt

      // Collision detection
      const hitPlatform = platforms.checkCollision(player.x, player.y, player.width, player.height)
      if (hitPlatform && player.vy >= 0) {
        landOnPlatform(player, hitPlatform.y)

        const stats = store.getStats()
        const isColorblind = store.isColorblind(now)
        const matched = isColorblind || hitPlatform.colorIndex === player.colorIndex

        if (matched) {
          // Score!
          const comboMult = Math.min(stats.combo + 1, 5)
          store.addScore(1 * comboMult)
          store.incrementCombo()
          renderer.addLandingParticles(
            player.x + player.width / 2,
            hitPlatform.y,
            isColorblind ? '#ffd700' : config.colors[player.colorIndex]
          )
          if (stats.combo > 1) {
            renderer.addComboParticles(player.x + player.width / 2, hitPlatform.y, stats.combo)
          }

          // Platform effects
          if (hitPlatform.type === 'gold') {
            store.setColorblind(config.colorblindDuration)
          } else if (hitPlatform.type === 'silver') {
            store.setSlowmo(config.slowmoDuration)
          }
        } else {
          // Game over - wrong color
          renderer.addGameOverParticles(
            player.x + player.width / 2,
            player.y + player.height / 2,
            config.colors[player.colorIndex]
          )
          store.setState('gameover')
        }

        platforms.markPassed(hitPlatform)
        setPlayerColor(player, hitPlatform.colorIndex)
      }

      // Check fall off screen
      if (player.y - scrollY > canvasHeight + 100) {
        store.setState('gameover')
      }

      // Update particles
      renderer.updateParticles(dt)
    }

    // Render
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    renderer.renderBackground(time)

    if (state === 'idle') {
      renderer.renderStartScreen()
    } else {
      renderer.renderPlatforms(platforms.getPlatforms(), scrollY)
      renderer.renderPlayer(player, scrollY, getChargeRatio(player, config))
      renderer.renderParticles()
      renderer.renderUI(store.getStats(), now)

      if (state === 'gameover') {
        renderer.renderGameOver(store.getStats())
      }
    }

    animationId = requestAnimationFrame(gameLoop)
  }

  function start() {
    lastTime = performance.now()
    animationId = requestAnimationFrame(gameLoop)
  }

  function destroy() {
    if (animationId) cancelAnimationFrame(animationId)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerUp)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  return { canvas, ctx, start, destroy }
}

function setPlayerColor(player: Player, colorIndex: number) {
  player.colorIndex = colorIndex
}