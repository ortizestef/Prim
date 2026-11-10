import {describe,expect,it} from "vitest";
import {createBeachState,finishBeachMode,stepBeach} from "./beachSkate";

describe("Coastline Skate movement",()=>{
  it("steers smoothly while staying on the boardwalk",()=>{
    let state=createBeachState();
    for(let i=0;i<120;i+=1) state=stepBeach(state,{left:false,right:true,accelerate:false,brake:false},1/60);
    expect(state.x).toBeGreaterThan(0);
    expect(state.x).toBeLessThanOrEqual(3.25);
  });
  it("accelerates and brakes",()=>{
    const initial=createBeachState();
    const fast=stepBeach(initial,{left:false,right:false,accelerate:true,brake:false},0.05);
    const slow=stepBeach(initial,{left:false,right:false,accelerate:false,brake:true},0.05);
    expect(fast.speed).toBeGreaterThan(initial.speed);
    expect(slow.speed).toBeLessThan(initial.speed);
  });
  it("clamps long frames to a safe simulation step",()=>{
    const input={left:false,right:true,accelerate:true,brake:false};
    expect(stepBeach(createBeachState(),input,2)).toEqual(stepBeach(createBeachState(),input,0.05));
  });
  it("resolves all beach route objectives",()=>{
    expect(finishBeachMode("classic",90,0)?.bonusCoins).toBe(5);
    expect(finishBeachMode("time-trial",60,0)?.bonusCoins).toBe(7);
    expect(finishBeachMode("shell-collector",45,11)).toBeNull();
    expect(finishBeachMode("shell-collector",45,12)?.bonusPoints).toBe(650);
    expect(finishBeachMode("shell-collector",90,2)?.message).toBe("ROUTE TIME UP!");
  });
});
