# ARCADEVERSE

A browser-based arcade platform built with React, TypeScript, Vite and Phaser 3. This first playable release includes two original arcade games: WAKEBOARD X and NEON RUSH.

## Requirements

- Node.js 20.19+ (or a compatible current LTS release)
- npm

## Install and run

~~~bash
npm install
npm run dev
~~~

Vite prints the local development URL after startup.

## Quality checks

~~~bash
npm test
npm run build
~~~

## GitHub Pages deployment

The live site is published from the repository root because this repository's Pages setting uses branch-based deployment. The source HTML lives in `web/index.html`; Vite builds it into a browser-ready `dist/index.html`.

Every push to `main` that changes the app or build configuration triggers `.github/workflows/pages.yml`. That workflow runs the tests, builds the app, verifies the production HTML and copies the compiled HTML and assets to the Pages root. A `.nojekyll` file tells Pages to serve the generated JavaScript and CSS assets directly.

The live site is: https://ortizestef.github.io/Prim/

The app uses hash-based navigation so its screens work on GitHub Pages. For another repository name, update the base path in `vite.config.ts`.

## Project structure

~~~text
src/
  components/       Shared React components
  games/
    wakeboard/     WAKEBOARD X Phaser scene and mechanics
    neon/          NEON RUSH Phaser scene and mechanics
  lib/              Local persistence and progression rules
  App.tsx           Platform pages and navigation
  styles.css        Shared visual system and responsive UI
  types.ts          Shared domain types
~~~

## Current gameplay

- **WAKEBOARD X:** configurable arrow-key/WASD steering, touch movement buttons, jump/trick timing, ramps, buoys, combo scoring, landing rewards and equipable board cosmetics.
- **NEON RUSH:** configurable lane controls, mobile touch buttons, jumping, collectible data chips, power-ups, increasing speed, collision/game-over logic and equipable runner cosmetics.
- Both games save completed-run XP, coins, achievements, mission progress, lifetime coin/trick statistics and personal bests to the same local player profile. Daily and weekly missions award XP and coins once each when claimed. Owned cosmetic items can be equipped for their matching game.

## Persistence and privacy

Progress is saved in this browser using localStorage. It is local to the current browser/device; there is no account server, cloud save, online leaderboard or multiplayer service. Clearing browser storage removes local progress.

## Current limitations

This is an evolving playable foundation, not the full feature set described in the product brief. Online services, additional environments, more advanced modes and full audio remain future work. Cosmetics change in-game appearance. Local mission rewards and period resets are implemented; local personal bests are stored per game, but no global leaderboard exists. Settings are persisted; sound playback is not yet connected.

## Game modes

Each game now offers three ways to play:

- **WAKEBOARD X:** Free Ride, a 60-second Time Trial, and a Trick Challenge (land five tricks within 90 seconds).
- **NEON RUSH:** Endless Run, a 60-second Time Trial, and Data Run (collect 12 chips within 90 seconds).

Mode goals and completion bonuses are handled inside the Phaser scenes and covered by unit tests.
