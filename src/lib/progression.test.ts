import { describe, expect, it } from "vitest";
import { applyRun, currentLevel, getLevelProgress } from "./progression";
import { DEFAULT_PROFILE } from "../types";

describe("player progression", () => {
  it("awards XP, coins and the first-game achievement after a run", () => {
    const next = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "neon-rush", score: 800, coins: 5, duration: 30,
    });
    expect(next.gamesPlayed).toBe(1);
    expect(next.xp).toBe(100);
    expect(next.coins).toBe(59);
    expect(next.achievements).toContain("first-game");
  });

  it("keeps personal bests and permanent achievements", () => {
    const profile = {
      ...structuredClone(DEFAULT_PROFILE),
      achievements: ["first-game"],
      bestScores: { ...DEFAULT_PROFILE.bestScores, "wakeboard-x": 600 },
    };
    const next = applyRun(profile, { gameId: "wakeboard-x", score: 450, coins: 2, duration: 20 });
    expect(next.bestScores["wakeboard-x"]).toBe(600);
    expect(next.achievements).toContain("first-game");
  });

  it("calculates level and progress within a level", () => {
    expect(currentLevel(0)).toBe(1);
    expect(currentLevel(500)).toBe(2);
    expect(getLevelProgress(250)).toBe(50);
  });
});