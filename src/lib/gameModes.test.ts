import { describe, expect, it } from "vitest";
import { resolveModeFinish } from "./gameModes";

describe("arcade game modes", () => {
  it("does not finish a time trial before 60 seconds", () => {
    expect(resolveModeFinish("wakeboard-x", "time-trial", 59)).toBeNull();
  });

  it("rewards a completed wakeboard time trial", () => {
    expect(resolveModeFinish("wakeboard-x", "time-trial", 60)).toEqual({
      message: "TIME TRIAL COMPLETE!", bonusPoints: 500, bonusCoins: 5,
    });
  });

  it("requires five landed tricks before the trick challenge can finish", () => {
    expect(resolveModeFinish("wakeboard-x", "trick-challenge", 45, 4)).toBeNull();
    expect(resolveModeFinish("wakeboard-x", "trick-challenge", 45, 5)).toEqual({
      message: "TRICK CHALLENGE COMPLETE!", bonusPoints: 650, bonusCoins: 10,
    });
  });

  it("ends an unfinished trick challenge at 90 seconds", () => {
    expect(resolveModeFinish("wakeboard-x", "trick-challenge", 90, 2)?.message).toBe("TIME UP - TRY AGAIN!");
  });

  it("rewards a completed neon time trial", () => {
    expect(resolveModeFinish("neon-rush", "time-trial", 60)).toEqual({
      message: "TIME TRIAL COMPLETE!", bonusPoints: 500, bonusCoins: 5,
    });
  });

  it("requires 12 data chips and ends the data run at its time limit", () => {
    expect(resolveModeFinish("neon-rush", "data-run", 50, 0, 11)).toBeNull();
    expect(resolveModeFinish("neon-rush", "data-run", 50, 0, 12)).toEqual({
      message: "DATA RUN COMPLETE!", bonusPoints: 400, bonusCoins: 8,
    });
    expect(resolveModeFinish("neon-rush", "data-run", 90, 0, 6)?.message).toBe("DATA RUN TIME UP!");
  });

  it("keeps classic sessions unlimited by a mode target", () => {
    expect(resolveModeFinish("wakeboard-x", "classic", 150, 12, 0)).toBeNull();
    expect(resolveModeFinish("neon-rush", "classic", 150, 0, 20)).toBeNull();
  });
});
