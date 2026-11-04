import type { PlayerProfile, RunResult } from "../types";
import { levelFromXp } from "./storage";

export const ACHIEVEMENTS = [
  { id: "first-game", title: "First Steps", detail: "Finish your first game.", reward: 50 },
  { id: "perfect-landing", title: "Clean Landing", detail: "Land a trick in WAKEBOARD X.", reward: 75 },
  { id: "trick-master", title: "Trick Master", detail: "Land three tricks in one run.", reward: 120 },
  { id: "speed-demon", title: "Speed Demon", detail: "Score 1,000 in NEON RUSH.", reward: 100 },
  { id: "coin-collector", title: "Coin Collector", detail: "Collect 100 coins in total.", reward: 100 },
] as const;

export function applyRun(profile: PlayerProfile, result: RunResult): PlayerProfile {
  const gainedXp = Math.max(20, Math.floor(result.score / 8));
  const earnedCoins = Math.max(0, result.coins) + Math.floor(result.score / 180);
  const bestScores = {
    ...profile.bestScores,
    [result.gameId]: Math.max(profile.bestScores[result.gameId], result.score),
  };
  const achievements = new Set(profile.achievements);
  const newlyUnlocked: string[] = [];
  const unlock = (id: string) => {
    if (!achievements.has(id)) {
      achievements.add(id);
      newlyUnlocked.push(id);
    }
  };

  unlock("first-game");
  if (result.gameId === "wakeboard-x" && (result.perfectLandings ?? 0) > 0) unlock("perfect-landing");
  if (result.gameId === "wakeboard-x" && (result.tricks ?? 0) >= 3) unlock("trick-master");
  if (result.gameId === "neon-rush" && result.score >= 1000) unlock("speed-demon");

  const nextCoins = profile.coins + earnedCoins;
  if (nextCoins >= 100) unlock("coin-collector");
  const reward = newlyUnlocked.reduce((total, id) => {
    return total + (ACHIEVEMENTS.find((item) => item.id === id)?.reward ?? 0);
  }, 0);

  return {
    ...profile,
    xp: profile.xp + gainedXp,
    coins: nextCoins + reward,
    gamesPlayed: profile.gamesPlayed + 1,
    bestScores,
    achievements: [...achievements],
  };
}

export function getLevelProgress(xp: number): number {
  return ((Math.max(0, xp) % 500) / 500) * 100;
}

export function currentLevel(xp: number): number {
  return levelFromXp(xp);
}