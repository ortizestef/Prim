import { DEFAULT_PROFILE, type PlayerProfile } from "../types";

const STORAGE_KEY = "arcadeverse.profile.v1";

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_PROFILE);

    const saved = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      ...structuredClone(DEFAULT_PROFILE),
      ...saved,
      bestScores: { ...DEFAULT_PROFILE.bestScores, ...(saved.bestScores ?? {}) },
      settings: { ...DEFAULT_PROFILE.settings, ...(saved.settings ?? {}) },
      achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
      ownedItems: Array.isArray(saved.ownedItems) ? saved.ownedItems : [],
    };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
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