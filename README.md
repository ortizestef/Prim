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

The site is configured to publish through GitHub Actions. The source HTML is `web/index.html`; Vite compiles it into the production website in `dist/`.

Every push to `main` starts `.github/workflows/pages.yml`. The workflow runs the unit tests, builds the site, verifies that the output points to the compiled JavaScript/CSS files, uploads the `dist/` artifact and deploys it with GitHub Pages.

The live site is: https://ortizestef.github.io/Prim/

A second workflow checks the public homepage after deployment and verifies that its JavaScript and CSS bundles respond successfully. The app uses hash-based navigation so its screens work on GitHub Pages. For another repository name, update the base path in `vite.config.ts`.

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
- Both games save completed-run XP, coins, achievements, mission progress, lifetime coin/trick statistics and personal bests to the same local player profile. Daily and weekly missions award XP and coins once each when claimed. Owned cosmetic items can be equipped for their matching game. Both games can be paused and resumed with Escape or the in-game PAUSE/RESUME button; lane movement and mobile controls are locked while paused or after a run ends.

## Persistence and privacy

Progress is saved in this browser using localStorage. It is local to the current browser/device; there is no account server, cloud save, online leaderboard or multiplayer service. Clearing browser storage removes local progress.

## Current limitations

This is an evolving playable foundation, not the full feature set described in the product brief. Online services, additional environments, more advanced modes and full audio remain future work. Cosmetics change in-game appearance. Local mission rewards and period resets are implemented; local personal bests are stored per game, but no global leaderboard exists. Settings are persisted; sound playback is not yet connected.

## Game modes

Each game now offers three ways to play:

- **WAKEBOARD X:** Free Ride, a 60-second Time Trial, and a Trick Challenge (land five tricks within 90 seconds).
- **NEON RUSH:** Endless Run, a 60-second Time Trial, and Data Run (collect 12 chips within 90 seconds).

Mode goals and completion bonuses are handled inside the Phaser scenes and covered by unit tests.
