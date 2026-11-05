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

Vite is configured for this repository path: /Prim/.

~~~bash
npm run build
~~~

To publish, open repository Settings → Pages and select GitHub Actions as the source. Then open Actions → Publish GitHub Pages → Run workflow. The workflow builds the app, runs its tests and publishes the dist directory. The app uses hash-based navigation so nested screens work on GitHub Pages. For another repository name, update the base path in vite.config.ts.

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

- **WAKEBOARD X:** keyboard and pointer movement, jump/trick timing, ramps, buoys, combo scoring and landing rewards.
- **NEON RUSH:** three-lane runner, lane switching, jumping, collectible data chips, increasing speed and collision/game-over logic.
- Both games save completed-run XP, coins, achievements, mission progress and personal bests to the same local player profile. Daily and weekly missions award XP and coins once each when claimed.

## Persistence and privacy

Progress is saved in this browser using localStorage. It is local to the current browser/device; there is no account server, cloud save, online leaderboard or multiplayer service. Clearing browser storage removes local progress.

## Current limitations

This is the initial playable foundation, not the full feature set described in the product brief. Online services, cosmetic inventory that changes in-game appearance, full audio, additional environments and the remaining requested game modes remain future work. Local mission rewards and period resets are implemented; no global leaderboard exists. Local personal bests are stored per game; no global leaderboard exists. Settings are persisted; sound playback is not yet connected.