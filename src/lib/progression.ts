import type { PlayerProfile, RunResult } from "../types";
import { levelFromXp } from "./storage";
import { recordMissionRun, syncMissionWindows } from "./missions";

export const ACHIEVEMENTS = [
  { id: "first-game", title: "First Steps", detail: "Finish your first game.", reward: 50 },
  { id: "perfect-landing", title: "Clean Landing", detail: "Land a trick in WAKEBOARD X.", reward: 75 },
  { id: "trick-master", title: "Trick Master", detail: "Land three tricks in one run.", reward: 120 },
  { id: "speed-demon", title: "Speed Demon", detail: "Score 1,000 in NEON RUSH.", reward: 100 },
  { id: "coin-collector", title: "Coin Collector", detail: "Earn 100 coins from gameplay.", reward: 100 },
  { id: "wakeboard-champion", title: "Wakeboard Champion", detail: "Score 2,500 in WAKEBOARD X.", reward: 150 },
  { id: "neon-survivor", title: "Neon Survivor", detail: "Stay in NEON RUSH for 60 seconds.", reward: 150 },
] as const;

export function applyRun(profile: PlayerProfile, result: RunResult, now = new Date()): PlayerProfile {
  const current = syncMissionWindows(profile, now);
  const gainedXp = Math.max(20, Math.floor(result.score / 8));
  const earnedCoins = Math.max(0, Math.floor(result.coins)) + Math.floor(Math.max(0, result.score) / 180);
  const bestScores = {
    ...current.bestScores,
    [result.gameId]: Math.max(current.bestScores[result.gameId], result.score),
  };
  const achievements = new Set(current.achievements);
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
  if (result.gameId === "wakeboard-x" && result.score >= 2500) unlock("wakeboard-champion");
  if (result.gameId === "neon-rush" && result.score >= 1000) unlock("speed-demon");
  if (result.gameId === "neon-rush" && result.duration >= 60) unlock("neon-survivor");

  const totalCoinsEarned = current.totalCoinsEarned + earnedCoins;
  if (totalCoinsEarned >= 100) unlock("coin-collector");
  const reward = newlyUnlocked.reduce((total, id) => {
    return total + (ACHIEVEMENTS.find((item) => item.id === id)?.reward ?? 0);
  }, 0);

  return {
    ...current,
    xp: current.xp + gainedXp,
    coins: current.coins + earnedCoins + reward,
    totalCoinsEarned,
    totalTricks: current.totalTricks + (result.gameId === "wakeboard-x" ? Math.max(0, result.tricks ?? 0) : 0),
    totalPerfectLandings: current.totalPerfectLandings + (result.gameId === "wakeboard-x" ? Math.max(0, result.perfectLandings ?? 0) : 0),
    gamesPlayed: current.gamesPlayed + 1,
    bestScores,
    achievements: [...achievements],
    missionProgress: recordMissionRun(current.missionProgress, result),
  };
}

export function getLevelProgress(xp: number): number {
  return ((Math.max(0, xp) % 500) / 500) * 100;
}

export function currentLevel(xp: number): number {
  return levelFromXp(xp);
}