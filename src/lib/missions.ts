import type {
  MissionCounters,
  MissionProgressState,
  PlayerProfile,
  RunResult,
} from "../types";
import { EMPTY_MISSION_COUNTERS } from "../types";

export type MissionPeriod = "daily" | "weekly";
type MissionMetric = keyof MissionCounters | "both-games";

export interface MissionDefinition {
  id: string;
  period: MissionPeriod;
  title: string;
  description: string;
  metric: MissionMetric;
  target: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface MissionView extends MissionDefinition {
  claimId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export const MISSION_DEFINITIONS: MissionDefinition[] = [
  {
    id: "play-one",
    period: "daily",
    title: "Warm-up session",
    description: "Finish one arcade run in either game.",
    metric: "runs",
    target: 1,
    rewardXp: 60,
    rewardCoins: 20,
  },
  {
    id: "neon-chips",
    period: "daily",
    title: "Data hunter",
    description: "Collect 8 data chips in NEON RUSH.",
    metric: "neonCoins",
    target: 8,
    rewardXp: 75,
    rewardCoins: 25,
  },
  {
    id: "wake-tricks",
    period: "daily",
    title: "Catch the wake",
    description: "Land 2 tricks in WAKEBOARD X.",
    metric: "wakeTricks",
    target: 2,
    rewardXp: 80,
    rewardCoins: 30,
  },
  {
    id: "five-runs",
    period: "weekly",
    title: "Arcade regular",
    description: "Complete 5 runs this week.",
    metric: "runs",
    target: 5,
    rewardXp: 220,
    rewardCoins: 75,
  },
  {
    id: "score-six-thousand",
    period: "weekly",
    title: "High-score chase",
    description: "Earn 6,000 points across your runs this week.",
    metric: "score",
    target: 6000,
    rewardXp: 180,
    rewardCoins: 60,
  },
  {
    id: "both-worlds",
    period: "weekly",
    title: "Two worlds, one player",
    description: "Play at least once in both arcade worlds.",
    metric: "both-games",
    target: 1,
    rewardXp: 150,
    rewardCoins: 50,
  },
];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function localDayKey(date: Date): string {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

export function localWeekKey(date: Date): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return localDayKey(monday);
}

function createEmptyState(now: Date): MissionProgressState {
  return {
    dailyKey: localDayKey(now),
    weeklyKey: localWeekKey(now),
    dailyCounters: { ...EMPTY_MISSION_COUNTERS },
    weeklyCounters: { ...EMPTY_MISSION_COUNTERS },
    claimed: [],
  };
}

export function syncMissionWindows(
  profile: PlayerProfile,
  now = new Date(),
): PlayerProfile {
  const current = profile.missionProgress ?? createEmptyState(now);
  const dailyKey = localDayKey(now);
  const weeklyKey = localWeekKey(now);
  const dailyChanged = current.dailyKey !== dailyKey;
  const weeklyChanged = current.weeklyKey !== weeklyKey;
  if (!dailyChanged && !weeklyChanged) return profile;

  const claimed = current.claimed.filter((claimId) => {
    if (claimId.startsWith("daily:")) return !dailyChanged && claimId.startsWith("daily:" + dailyKey + ":");
    if (claimId.startsWith("weekly:")) return !weeklyChanged && claimId.startsWith("weekly:" + weeklyKey + ":");
    return false;
  });

  return {
    ...profile,
    missionProgress: {
      dailyKey,
      weeklyKey,
      dailyCounters: dailyChanged ? { ...EMPTY_MISSION_COUNTERS } : current.dailyCounters,
      weeklyCounters: weeklyChanged ? { ...EMPTY_MISSION_COUNTERS } : current.weeklyCounters,
      claimed,
    },
  };
}

function addRun(counters: MissionCounters, result: RunResult): MissionCounters {
  const isWakeboard = result.gameId === "wakeboard-x";
  return {
    ...counters,
    runs: counters.runs + 1,
    score: counters.score + Math.max(0, Math.floor(result.score)),
    neonCoins: counters.neonCoins + (result.gameId === "neon-rush" ? Math.max(0, result.coins) : 0),
    wakeTricks: counters.wakeTricks + (isWakeboard ? Math.max(0, result.tricks ?? 0) : 0),
    wakeRuns: counters.wakeRuns + (isWakeboard ? 1 : 0),
    neonRuns: counters.neonRuns + (isWakeboard ? 0 : 1),
  };
}

export function recordMissionRun(
  progress: MissionProgressState,
  result: RunResult,
): MissionProgressState {
  return {
    ...progress,
    dailyCounters: addRun(progress.dailyCounters, result),
    weeklyCounters: addRun(progress.weeklyCounters, result),
  };
}

function metricValue(counters: MissionCounters, metric: MissionMetric): number {
  if (metric === "both-games") {
    return counters.wakeRuns > 0 && counters.neonRuns > 0 ? 1 : 0;
  }
  return counters[metric];
}

export function getMissionBoard(profile: PlayerProfile, now = new Date()): MissionView[] {
  const current = syncMissionWindows(profile, now);
  const state = current.missionProgress;
  return MISSION_DEFINITIONS.map((mission) => {
    const periodKey = mission.period === "daily" ? state.dailyKey : state.weeklyKey;
    const counters = mission.period === "daily" ? state.dailyCounters : state.weeklyCounters;
    const claimId = mission.period + ":" + periodKey + ":" + mission.id;
    const progress = Math.min(mission.target, metricValue(counters, mission.metric));
    return {
      ...mission,
      claimId,
      progress,
      completed: progress >= mission.target,
      claimed: state.claimed.includes(claimId),
    };
  });
}

export interface MissionClaimResult {
  profile: PlayerProfile;
  claimed: boolean;
  rewardXp: number;
  rewardCoins: number;
}

export function claimMissionReward(
  profile: PlayerProfile,
  claimId: string,
  now = new Date(),
): MissionClaimResult {
  const current = syncMissionWindows(profile, now);
  const mission = getMissionBoard(current, now).find((item) => item.claimId === claimId);
  if (!mission || !mission.completed || mission.claimed) {
    return { profile: current, claimed: false, rewardXp: 0, rewardCoins: 0 };
  }

  return {
    profile: {
      ...current,
      xp: current.xp + mission.rewardXp,
      coins: current.coins + mission.rewardCoins,
      missionProgress: {
        ...current.missionProgress,
        claimed: [...current.missionProgress.claimed, claimId],
      },
    },
    claimed: true,
    rewardXp: mission.rewardXp,
    rewardCoins: mission.rewardCoins,
  };
}