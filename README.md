# 色块跳跃 · Color Jump

A small canvas jumping game built with **React 19 + TypeScript + Vite**. Hold to charge,
release to jump between colored platforms; land on the matching color to score, hit a
wrong color and the run ends. No game engine, no runtime assets — physics, platform
pooling, scoring and particles are hand-written on a 2D canvas.

![tests](https://img.shields.io/badge/tests-37%20vitest-blue)
![CI](https://img.shields.io/badge/GitHub%20Actions-CI-success)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-8-646cff)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6)

## How to play

- **Click / tap or press Space** to start.
- **Hold** to charge the jump (the charge bar fills), **release** to leap.
- Land on a platform whose color matches the player's current color to score.
- Combo multiplies the score; the world speeds up every 50 points.
- **Gold** platforms grant a temporary colorblind mode (any color matches), **silver**
  platforms slow the world down briefly.
- Touch a wrong-colored platform, or fall off the screen, and the game ends.

## Tech stack

- **React 19** — mounts the canvas and owns the app entry; game logic lives in plain TS modules.
- **TypeScript 7** — typed game state, config and entities.
- **Vite 8** — dev server and production build.
- **Oxlint** — linting.
- **Vitest 3** — unit tests for the player physics, platform manager and state store.

## Project structure

```
├── index.html              # Canvas entry page
├── public/                 # favicon.svg, icons.svg
├── src/
│   ├── main.tsx            # DOM ready, resize/DPR, start the game
│   └── game/
│       ├── game.ts         # Main loop, input, collision, scoring, effects
│       ├── player.ts       # Player state, charging, jump, gravity, bounds
│       ├── platforms.ts    # Platform object pool, spawn, scroll, collision
│       ├── store.ts        # State, stats, effects, config (singleton + factory)
│       └── renderer.ts      # Canvas rendering and particles
├── tests/                  # Vitest unit tests
│   ├── setup.ts            # In-memory localStorage stub
│   ├── player.test.ts
│   ├── platforms.test.ts
│   └── store.test.ts
├── vitest.config.ts
└── vite.config.ts
```

## Getting started

Requires Node.js 20+ (developed on Node 22).

```bash
npm install

# Dev server
npm run dev

# Production build (type-check + bundle)
npm run build

# Preview the production build
npm run preview

# Lint
npm run lint
```

## Tests & CI

The pure game logic is covered by **37 Vitest cases** (16 player, 8 platforms,
13 store). Canvas rendering and randomness are not under test; the suite runs in a
plain Node environment with an in-memory `localStorage` stub, so it needs no browser
or display.

```bash
npm run test          # one-shot run
npm run test:watch    # watch mode
```

A GitHub Actions workflow (`.github/workflows/tests.yml`) runs lint, tests and the
production build on every push to `gh-pages` and on pull requests.

## Game configuration

Tuning constants live in `defaultConfig` at the top of `src/game/store.ts`:

| Setting | Default | Meaning |
|---|---|---|
| `gravity` | `0.45` | Vertical acceleration per second-scaled frame |
| `chargeRate` | `0.018` | Charge gained per second while holding |
| `maxCharge` | `1.0` | Full-charge threshold |
| `minJumpVelocity` / `maxJumpVelocity` | `8` / `18` | Jump speed at zero / full charge |
| `platformGap` | `140–180` | Vertical gap range between platforms |
| `platformWidth` | `60–140` | Platform width range |
| `scrollSpeed` | `2.2` | Base world scroll speed |
| `speedIncreasePer50` | `0.04` | Speed multiplier added every 50 points |
| `colors` | 5 hex colors | Player / platform palette |
| `colorblindDuration` | `5000` | Gold-platform effect length (ms) |
| `slowmoDuration` | `3000` | Silver-platform effect length (ms) |
| `slowmoFactor` | `0.5` | Speed multiplier while slowed |

## Notes

- Platforms use a fixed-size object pool; off-screen platforms are recycled rather than
  allocated each frame.
- The store exposes both a `createStore(config)` factory (used by tests for isolation)
  and a module-level `store` singleton for the running game.
- This repository's working branch is `gh-pages`; the built `dist/` output is generated
  locally and is not committed.

## 中文说明

一个用 **React 19 + TypeScript + Vite** 写的 2D canvas 跳跃小游戏：按住蓄力、松开跳跃，
落到与自身同色的平台得分，落到异色平台则游戏结束。物理、平台对象池、计分和粒子都是
手写实现，没有使用游戏引擎。

- **玩法**：点击/空格开始；按住蓄力、松开起跳；同色平台得分，连击有分数加成，每 50 分
  世界加速；金色平台短暂进入“色盲模式”（任意颜色都算匹配），银色平台短暂减速；踩错颜色
  或坠落屏幕即结束。
- **测试**：`tests/` 下共 **37 个 Vitest 用例**（玩家 16、平台 8、状态 13），覆盖蓄力跳跃、
  重力与边界、平台生成/回收/碰撞、计分与连击上限、特效到期与减速速度等纯逻辑；Canvas 绘制
  与随机生成不在测试范围内。本地运行 `npm run test`。
- **CI**：`.github/workflows/tests.yml` 在 push 和 PR 到 `gh-pages` 时自动执行 lint、测试与
  生产构建。
- **配置**：可调参数集中在 `src/game/store.ts` 的 `defaultConfig`（重力、蓄力速率、跳跃速度、
  平台间距/宽度、滚动速度、加速比例、配色、特效时长等）。
- **分支**：本仓库工作分支为 `gh-pages`；`dist/` 构建产物不提交。

## License

MIT © 2026 i-am-cie
