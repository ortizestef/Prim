import { describe, expect, it } from "vitest";
import { applyRun, currentLevel, getLevelProgress } from "./progression";
import { DEFAULT_PROFILE } from "../types";
import { claimMissionReward, getMissionBoard, syncMissionWindows } from "./missions";

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

  it("unlocks gameplay achievements from actual run conditions", () => {
    const next = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "neon-rush", score: 1200, coins: 4, duration: 65,
    });
    expect(next.achievements).toContain("speed-demon");
    expect(next.achievements).toContain("neon-survivor");
  });

  it("stores shells and coastline distance from a completed beach session", () => {
    const next = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "wakeboard-x", score: 900, coins: 6, shells: 8, distance: 420, duration: 52,
    });
    expect(next.totalShellsEarned).toBe(8);
    expect(next.totalCoastlineDistance).toBe(420);
  });

  it("counts total coins earned rather than the current wallet", () => {
    const profile = { ...structuredClone(DEFAULT_PROFILE), coins: 0, totalCoinsEarned: 95 };
    const next = applyRun(profile, { gameId: "neon-rush", score: 180, coins: 4, duration: 12 });
    expect(next.totalCoinsEarned).toBe(100);
    expect(next.achievements).toContain("coin-collector");
  });

  it("calculates level and progress within a level", () => {
    expect(currentLevel(0)).toBe(1);
    expect(currentLevel(500)).toBe(2);
    expect(getLevelProgress(250)).toBe(50);
  });
});

describe("daily and weekly missions", () => {
  const monday = new Date(2026, 10, 2, 12, 0, 0);

  it("updates mission progress from completed gameplay", () => {
    const start = syncMissionWindows(structuredClone(DEFAULT_PROFILE), monday);
    const played = applyRun(start, {
      gameId: "neon-rush", score: 1800, coins: 8, duration: 35,
    }, monday);
    const board = getMissionBoard(played, monday);
    expect(board.find((mission) => mission.id === "play-one")?.completed).toBe(true);
    expect(board.find((mission) => mission.id === "neon-chips")?.progress).toBe(8);
    expect(board.find((mission) => mission.id === "both-worlds")?.completed).toBe(false);
  });

  it("updates the beach shell mission from shells actually collected", () => {
    const played = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "wakeboard-x", score: 1200, coins: 6, shells: 7, distance: 260, duration: 42,
    }, monday);
    const mission = getMissionBoard(played, monday).find((item) => item.id === "coast-shells");
    expect(mission?.progress).toBe(6);
    expect(mission?.completed).toBe(true);
  });

  it("does not count bonus coins as collected neon data chips", () => {
    const played = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "neon-rush", score: 900, coins: 12, dataChips: 4, duration: 40,
    }, monday);
    const chipsMission = getMissionBoard(played, monday).find((mission) => mission.id === "neon-chips");
    expect(chipsMission?.progress).toBe(4);
  });

  it("allows a completed reward to be claimed only once", () => {
    const played = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "wakeboard-x", score: 600, coins: 0, tricks: 2, duration: 25,
    }, monday);
    const mission = getMissionBoard(played, monday).find((item) => item.id === "play-one")!;
    const first = claimMissionReward(played, mission.claimId, monday);
    const second = claimMissionReward(first.profile, mission.claimId, monday);
    expect(first.claimed).toBe(true);
    expect(first.profile.xp).toBe(Math.max(20, Math.floor(600 / 8)) + 60);
    expect(first.profile.coins).toBe(73);
    expect(second.claimed).toBe(false);
    expect(second.profile.coins).toBe(first.profile.coins);
  });

  it("resets daily counters at a new day and weekly counters at a new week", () => {
    const sunday = new Date(2026, 10, 8, 21, 0, 0);
    const mondayAfter = new Date(2026, 10, 9, 9, 0, 0);
    const played = applyRun(structuredClone(DEFAULT_PROFILE), {
      gameId: "wakeboard-x", score: 500, coins: 0, shells: 2, distance: 180, duration: 15,
    }, sunday);
    const reset = syncMissionWindows(played, mondayAfter);
    expect(reset.missionProgress.dailyCounters.runs).toBe(0);
    expect(reset.missionProgress.weeklyCounters.runs).toBe(0);
    expect(sunday.getDay()).toBe(0);
  });
});