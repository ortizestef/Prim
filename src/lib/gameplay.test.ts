import { describe, expect, it } from "vitest";
import { moveRunnerLane, resolveBarrierImpact, resolveWakeboardLanding } from "./gameplay";

describe("arcade gameplay rules", () => {
  it("rewards a trick landing and increases the combo up to five", () => {
    expect(resolveWakeboardLanding(true, 3)).toEqual({
      score: 750,
      coins: 4,
      tricks: 1,
      perfectLandings: 1,
      nextCombo: 4,
      message: "PERFECT LANDING!  +750",
    });
    expect(resolveWakeboardLanding(true, 5).nextCombo).toBe(5);
  });

  it("resets the combo when landing without a trick", () => {
    expect(resolveWakeboardLanding(false, 4)).toEqual({
      score: 45,
      coins: 0,
      tricks: 0,
      perfectLandings: 0,
      nextCombo: 1,
      message: "NICE JUMP!",
    });
  });

  it("keeps the runner within its three lanes", () => {
    expect(moveRunnerLane(1, -1)).toBe(0);
    expect(moveRunnerLane(1, 1)).toBe(2);
    expect(moveRunnerLane(0, -1)).toBe(0);
    expect(moveRunnerLane(2, 1)).toBe(2);
    expect(moveRunnerLane(1, 0)).toBe(1);
  });

  it("allows a jump or shield to avoid a barrier", () => {
    expect(resolveBarrierImpact(true, false)).toBe("dodge");
    expect(resolveBarrierImpact(false, true)).toBe("dodge");
    expect(resolveBarrierImpact(false, false)).toBe("crash");
  });
});
