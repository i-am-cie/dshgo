import type { GameConfig } from './store'

export interface Player {
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
  onGround: boolean
  charge: number
  charging: boolean
  colorIndex: number
}

export function createPlayer(_config: GameConfig, canvasWidth: number, canvasHeight: number): Player {
  return {
    x: canvasWidth / 2 - 20,
    y: canvasHeight - 150,
    width: 40,
    height: 40,
    vx: 0,
    vy: 0,
    onGround: false,
    charge: 0,
    charging: false,
    colorIndex: 0,
  }
}

export function startCharge(player: Player) {
  if (player.onGround && !player.charging) {
    player.charging = true
    player.charge = 0
  }
}

export function releaseCharge(player: Player, config: GameConfig) {
  if (!player.charging) return

  player.charging = false
  const jumpVelocity = config.minJumpVelocity +
    (config.maxJumpVelocity - config.minJumpVelocity) * player.charge
  player.vy = -jumpVelocity
  player.onGround = false
  player.charge = 0
}

export function updatePlayer(player: Player, dt: number, config: GameConfig, canvasWidth: number) {
  if (player.charging) {
    player.charge = Math.min(config.maxCharge, player.charge + config.chargeRate * dt)
  }

  // Apply gravity
  player.vy += config.gravity * dt

  // Update position
  player.x += player.vx * dt
  player.y += player.vy * dt

  // Horizontal bounds
  if (player.x < 0) { player.x = 0; player.vx = 0 }
  if (player.x + player.width > canvasWidth) { player.x = canvasWidth - player.width; player.vx = 0 }
}

export function setPlayerColor(player: Player, colorIndex: number) {
  player.colorIndex = colorIndex
}

export function landOnPlatform(player: Player, platformY: number) {
  player.y = platformY - player.height
  player.vy = 0
  player.onGround = true
}

export function getChargeRatio(player: Player, config: GameConfig): number {
  return player.charging ? player.charge / config.maxCharge : 0
}