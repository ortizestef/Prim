export interface WakeboardLandingReward {
  score: number;
  coins: number;
  tricks: number;
  perfectLandings: number;
  nextCombo: number;
  message: string;
}

export function resolveWakeboardLanding(
  trickPerformed: boolean,
  combo: number,
): WakeboardLandingReward {
  const safeCombo = Math.max(1, Math.floor(combo));
  if (!trickPerformed) {
    return {
      score: 45,
      coins: 0,
      tricks: 0,
      perfectLandings: 0,
      nextCombo: 1,
      message: "NICE JUMP!",
    };
  }

  const score = 250 * safeCombo;
  return {
    score,
    coins: 4,
    tricks: 1,
    perfectLandings: 1,
    nextCombo: Math.min(5, safeCombo + 1),
    message: "PERFECT LANDING!  +" + score,
  };
}

export function moveRunnerLane(currentLane: number, direction: number): number {
  const nextLane = currentLane + Math.sign(direction);
  return Math.max(0, Math.min(2, nextLane));
}

export function resolveBarrierImpact(jumping: boolean, shielded: boolean): "dodge" | "crash" {
  return jumping || shielded ? "dodge" : "crash";
}
