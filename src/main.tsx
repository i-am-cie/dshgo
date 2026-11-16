import './index.css'
import { createGame } from './game/game'

// Wait for DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
  if (!canvas) return

  // Set canvas size to match display size (handle DPR)
  function resize() {
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    canvas.getContext('2d')?.scale(dpr, dpr)
  }

  resize()
  window.addEventListener('resize', resize)

  const game = createGame(canvas)
  game.start()
})