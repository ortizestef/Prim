export type GameId = "wakeboard-x" | "neon-rush";

export interface RunResult {
  gameId: GameId;
  score: number;
  coins: number;
  duration: number;
  tricks?: number;
  perfectLandings?: number;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  controlScheme: "arrows" | "wasd";
}

export interface PlayerProfile {
  nickname: string;
  xp: number;
  coins: number;
  gamesPlayed: number;
  bestScores: Record<GameId, number>;
  achievements: string[];
  ownedItems: string[];
  settings: PlayerSettings;
}

export const DEFAULT_PROFILE: PlayerProfile = {
  nickname: "Rookie",
  xp: 0,
  coins: 0,
  gamesPlayed: 0,
  bestScores: { "wakeboard-x": 0, "neon-rush": 0 },
  achievements: [],
  ownedItems: [],
  settings: {
    soundEnabled: true,
    musicVolume: 45,
    sfxVolume: 70,
    controlScheme: "arrows",
  },
};