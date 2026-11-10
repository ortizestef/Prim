import type { GameId, GameMode } from "../types";

export interface GameModeOption {
  id: GameMode;
  name: string;
  description: string;
}

export const GAME_MODE_OPTIONS: Record<GameId, GameModeOption[]> = {
  "wakeboard-x": [
    { id: "classic", name: "Beach Cruise", description: "Enjoy a relaxed 90-second ride along the promenade." },
    { id: "time-trial", name: "Golden Hour", description: "Build your distance and score in a 60-second coastal run." },
    { id: "shell-collector", name: "Shell Collector", description: "Collect 12 seashells along the boardwalk before time runs out." },
  ],
  "neon-rush": [
    { id: "classic", name: "Endless Run", description: "Dodge barriers and chase your personal best." },
    { id: "time-trial", name: "60-Second Dash", description: "Stay in the race for a full minute." },
    { id: "data-run", name: "Data Run", description: "Collect 12 data chips before time runs out." },
  ],
};

export interface ModeFinish {
  message: string;
  bonusPoints: number;
  bonusCoins: number;
}

export function resolveModeFinish(
  gameId: GameId,
  mode: GameMode,
  elapsedSeconds: number,
  tricks = 0,
  dataChips = 0,
): ModeFinish | null {
  if (gameId === "wakeboard-x") {
    if (mode === "time-trial" && elapsedSeconds >= 60) {
      return { message: "TIME TRIAL COMPLETE!", bonusPoints: 500, bonusCoins: 5 };
    }
    if (mode === "trick-challenge") {
      if (tricks >= 5) {
        return { message: "TRICK CHALLENGE COMPLETE!", bonusPoints: 650, bonusCoins: 10 };
      }
      if (elapsedSeconds >= 90) {
        return { message: "TIME UP - TRY AGAIN!", bonusPoints: 0, bonusCoins: 0 };
      }
    }
    if (mode === "shell-collector") {
      if (dataChips >= 12) {
        return { message: "BEACHCOMBER ROUTE COMPLETE!", bonusPoints: 650, bonusCoins: 10 };
      }
      if (elapsedSeconds >= 90) {
        return { message: "ROUTE TIME UP!", bonusPoints: 0, bonusCoins: 0 };
      }
    }
  }

  if (gameId === "neon-rush") {
    if (mode === "time-trial" && elapsedSeconds >= 60) {
      return { message: "TIME TRIAL COMPLETE!", bonusPoints: 500, bonusCoins: 5 };
    }
    if (mode === "data-run") {
      if (dataChips >= 12) {
        return { message: "DATA RUN COMPLETE!", bonusPoints: 400, bonusCoins: 8 };
      }
      if (elapsedSeconds >= 90) {
        return { message: "DATA RUN TIME UP!", bonusPoints: 0, bonusCoins: 0 };
      }
    }
  }

  return null;
}
