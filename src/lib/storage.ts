import { DEFAULT_PROFILE, type PlayerProfile } from "../types";
import { syncMissionWindows } from "./missions";

const STORAGE_KEY = "arcadeverse.profile.v1";

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return syncMissionWindows(structuredClone(DEFAULT_PROFILE));

    const saved = JSON.parse(raw) as Partial<PlayerProfile>;
    const merged: PlayerProfile = {
      ...structuredClone(DEFAULT_PROFILE),
      ...saved,
      totalCoinsEarned: Number.isFinite(saved.totalCoinsEarned) ? Number(saved.totalCoinsEarned) : 0,
      totalTricks: Number.isFinite(saved.totalTricks) ? Number(saved.totalTricks) : 0,
      totalPerfectLandings: Number.isFinite(saved.totalPerfectLandings) ? Number(saved.totalPerfectLandings) : 0,
      bestScores: { ...DEFAULT_PROFILE.bestScores, ...(saved.bestScores ?? {}) },
      settings: { ...DEFAULT_PROFILE.settings, ...(saved.settings ?? {}) },
      missionProgress: {
        ...DEFAULT_PROFILE.missionProgress,
        ...(saved.missionProgress ?? {}),
        dailyCounters: {
          ...DEFAULT_PROFILE.missionProgress.dailyCounters,
          ...(saved.missionProgress?.dailyCounters ?? {}),
        },
        weeklyCounters: {
          ...DEFAULT_PROFILE.missionProgress.weeklyCounters,
          ...(saved.missionProgress?.weeklyCounters ?? {}),
        },
        claimed: Array.isArray(saved.missionProgress?.claimed) ? saved.missionProgress.claimed : [],
      },
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      ownedItems: Array.isArray(saved.ownedItems) ? saved.ownedItems : [],
      equippedItems: { ...DEFAULT_PROFILE.equippedItems, ...(saved.equippedItems ?? {}) },
    };
    return syncMissionWindows(merged);
  } catch {
    return syncMissionWindows(structuredClone(DEFAULT_PROFILE));
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Could not save ARCADEVERSE progress.", error);
  }
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / 500) + 1;
}

export function xpToNextLevel(xp: number): number {
  return 500 - (Math.max(0, xp) % 500);
}