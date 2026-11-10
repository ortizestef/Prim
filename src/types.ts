export type GameId = "wakeboard-x" | "neon-rush";
export type GameMode = "classic" | "time-trial" | "trick-challenge" | "data-run" | "shell-collector";

export interface RunResult {
  gameId: GameId;
  score: number;
  coins: number;
  dataChips?: number;
  duration: number;
  tricks?: number;
  perfectLandings?: number;
  shells?: number;
  distance?: number;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  controlScheme: "arrows" | "wasd";
}

export interface MissionCounters {
  runs: number;
  score: number;
  neonCoins: number;
  wakeTricks: number;
  wakeShells: number;
  wakeRuns: number;
  neonRuns: number;
}

export interface MissionProgressState {
  dailyKey: string;
  weeklyKey: string;
  dailyCounters: MissionCounters;
  weeklyCounters: MissionCounters;
  claimed: string[];
}

export interface PlayerProfile {
  nickname: string;
  xp: number;
  coins: number;
  totalCoinsEarned: number;
  totalTricks: number;
  totalPerfectLandings: number;
  totalShellsEarned: number;
  totalCoastlineDistance: number;
  gamesPlayed: number;
  bestScores: Record<GameId, number>;
  achievements: string[];
  ownedItems: string[];
  equippedItems: Partial<Record<GameId, string>>;
  missionProgress: MissionProgressState;
  settings: PlayerSettings;
}

export const EMPTY_MISSION_COUNTERS: MissionCounters = {
  runs: 0,
  score: 0,
  neonCoins: 0,
  wakeTricks: 0,
  wakeShells: 0,
  wakeRuns: 0,
  neonRuns: 0,
};

export const DEFAULT_PROFILE: PlayerProfile = {
  nickname: "Rookie",
  xp: 0,
  coins: 0,
  totalCoinsEarned: 0,
  totalTricks: 0,
  totalPerfectLandings: 0,
  totalShellsEarned: 0,
  totalCoastlineDistance: 0,
  gamesPlayed: 0,
  bestScores: { "wakeboard-x": 0, "neon-rush": 0 },
  achievements: [],
  ownedItems: [],
  equippedItems: {},
  missionProgress: {
    dailyKey: "",
    weeklyKey: "",
    dailyCounters: { ...EMPTY_MISSION_COUNTERS },
    weeklyCounters: { ...EMPTY_MISSION_COUNTERS },
    claimed: [],
  },
  settings: {
    soundEnabled: true,
    musicVolume: 45,
    sfxVolume: 70,
    controlScheme: "arrows",
  },
};
