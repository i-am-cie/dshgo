import { store } from './store'
import type { GameConfig } from './store'
import type { Platform } from './platforms'
import type { Player } from './player'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export function createRenderer(ctx: CanvasRenderingContext2D, config: GameConfig, canvasWidth: number, canvasHeight: number) {
  const particles: Particle[] = []
  const colorCache = new Map<number, string>()
  const gradientCache = new Map<string, CanvasGradient>()

  function getColor(index: number): string {
    if (!colorCache.has(index)) {
      colorCache.set(index, config.colors[index % config.colors.length])
    }
    return colorCache.get(index)!
  }

  function getGradient(key: string, colors: string[]): CanvasGradient {
    if (!gradientCache.has(key)) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
      gradientCache.set(key, grad)
    }
    return gradientCache.get(key)!
  }

  function addLandingParticles(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = 2 + Math.random() * 4
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        color,
        size: 3 + Math.random() * 3,
      })
    }
  }

  function addComboParticles(x: number, y: number, combo: number) {
    const colors = ['#fff', '#ffd700', '#ff6b6b', '#4ecdc4', '#a8e6cf']
    const color = colors[Math.min(combo - 1, colors.length - 1)]
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        maxLife: 0.8,
        color,
        size: 4 + combo,
      })
    }
  }

  function addGameOverParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 6
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1 + Math.random() * 0.5,
        color,
        size: 4 + Math.random() * 4,
      })
    }
  }

  function updateParticles(dt: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.x += p.vx * dt * 60
      p.y += p.vy * dt * 60
      p.vy += 0.15 * dt * 60 // gravity
      p.life -= dt
      if (p.life <= 0) particles.splice(i, 1)
    }
  }

  function renderBackground(time: number) {
    // Subtle animated gradient background
    const grad = getGradient('bg', ['#1a1a2e', '#16213e', '#0f0f23'])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Subtle floating particles in background
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    for (let i = 0; i < 20; i++) {
      const x = (i * 73 + time * 0.5) % canvasWidth
      const y = (i * 127 + time * 0.3) % canvasHeight
      ctx.beginPath()
      ctx.arc(x, y, 1 + Math.sin(time * 0.01 + i) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function renderPlatforms(platforms: Platform[], scrollY: number) {
    for (const p of platforms) {
      const y = p.y - scrollY
      if (y > canvasHeight + 50 || y < -50) continue

      let color: string
      if (p.type === 'gold') color = '#ffd700'
      else if (p.type === 'silver') color = '#c0c0c0'
      else color = getColor(p.colorIndex)

      // Platform body
      ctx.fillStyle = color
      ctx.fillRect(p.x, y, p.width, 16)

      // Subtle highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(p.x, y, p.width, 3)

      // Platform type indicators
      if (p.type === 'gold') {
        ctx.fillStyle = '#fff8'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('★', p.x + p.width / 2, y + 12)
      } else if (p.type === 'silver') {
        ctx.fillStyle = '#fff8'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('❄', p.x + p.width / 2, y + 12)
      }
    }
  }

  function renderPlayer(player: Player, scrollY: number, chargeRatio: number) {
    const y = player.y - scrollY
    const color = getColor(player.colorIndex)

    // Charge indicator (glow when charging)
    if (player.charging && chargeRatio > 0) {
      const glowSize = 20 + chargeRatio * 30
      const grad = ctx.createRadialGradient(
        player.x + player.width / 2, y + player.height / 2, 0,
        player.x + player.width / 2, y + player.height / 2, glowSize
      )
      grad.addColorStop(0, color + '60')
      grad.addColorStop(1, color + '00')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(player.x + player.width / 2, y + player.height / 2, glowSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // Player body
    ctx.fillStyle = color
    ctx.fillRect(player.x, y, player.width, player.height)

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(player.x, y, player.width, 4)

    // Charge bar when charging
    if (player.charging) {
      const barW = player.width * chargeRatio
      ctx.fillStyle = color
      ctx.fillRect(player.x, y - 8, barW, 4)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(player.x, y - 8, player.width, 4)
    }
  }

  function renderParticles() {
    for (const p of particles) {
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  function renderUI(stats: ReturnType<typeof store.getStats>, now: number) {
    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(String(stats.score), canvasWidth / 2, 60)

    // Best score
    ctx.fillStyle = '#fff8'
    ctx.font = '14px sans-serif'
    ctx.fillText(`Best: ${stats.bestScore}`, canvasWidth / 2, 85)

    // Combo
    if (stats.combo > 1) {
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(`${stats.combo}x COMBO!`, canvasWidth / 2, 120)
    }

    // Active effects
    let effectY = 150
    if (store.isColorblind(now)) {
      ctx.fillStyle = '#ffd700'
      ctx.font = '16px sans-serif'
      ctx.fillText('🎨 色盲模式', canvasWidth / 2, effectY)
      effectY += 25
    }
    if (store.isSlowmo(now)) {
      ctx.fillStyle = '#4ecdc4'
      ctx.font = '16px sans-serif'
      ctx.fillText('❄ 减速中', canvasWidth / 2, effectY)
    }
  }

  function renderGameOver(stats: ReturnType<typeof store.getStats>) {
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('游戏结束', canvasWidth / 2, canvasHeight / 2 - 60)

    ctx.font = '28px sans-serif'
    ctx.fillText(`得分: ${stats.score}`, canvasWidth / 2, canvasHeight / 2 - 10)

    ctx.fillStyle = '#ffd700'
    ctx.fillText(`最高: ${stats.bestScore}`, canvasWidth / 2, canvasHeight / 2 + 30)

    ctx.fillStyle = '#fff8'
    ctx.font = '16px sans-serif'
    ctx.fillText('点击屏幕重新开始', canvasWidth / 2, canvasHeight / 2 + 80)
  }

  function renderStartScreen() {
    const grad = getGradient('bg', ['#1a1a2e', '#16213e', '#0f0f23'])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('色块跳跃', canvasWidth / 2, canvasHeight / 2 - 60)

    ctx.font = '18px sans-serif'
    ctx.fillStyle = '#fff8'
    ctx.fillText('按住蓄力 · 松开跳跃', canvasWidth / 2, canvasHeight / 2)
    ctx.fillText('落在同色平台得分', canvasWidth / 2, canvasHeight / 2 + 30)
    ctx.fillText('落在异色平台游戏结束', canvasWidth / 2, canvasHeight / 2 + 55)

    ctx.fillStyle = '#4ecdc4'
    ctx.font = '16px sans-serif'
    ctx.fillText('点击屏幕开始', canvasWidth / 2, canvasHeight / 2 + 110)
  }

  return {
    addLandingParticles,
    addComboParticles,
    addGameOverParticles,
    updateParticles,
    renderBackground,
    renderPlatforms,
    renderPlayer,
    renderParticles,
    renderUI,
    renderGameOver,
    renderStartScreen,
  }
}