export interface BeachInput {
  left: boolean;
  right: boolean;
  accelerate: boolean;
  brake: boolean;
}
export interface BeachState {
  x: number;
  lateralVelocity: number;
  speed: number;
  elapsed: number;
  distance: number;
  score: number;
  shells: number;
}
export interface BeachFinish {
  message: string;
  bonusPoints: number;
  bonusCoins: number;
}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export function createBeachState():BeachState {
  return {x:0,lateralVelocity:0,speed:4.5,elapsed:0,distance:0,score:0,shells:0};
}
export function stepBeach(state:BeachState,input:BeachInput,deltaSeconds:number):BeachState {
  const dt=clamp(deltaSeconds,0,0.05);
  const targetLateral=(Number(input.right)-Number(input.left))*3.5;
  const lateral=state.lateralVelocity+(targetLateral-state.lateralVelocity)*Math.min(1,dt*6);
  const x=clamp(state.x+lateral*dt,-3.25,3.25);
  const targetSpeed=input.brake?2.1:input.accelerate?7.2:4.5;
  const speed=state.speed+(targetSpeed-state.speed)*Math.min(1,dt*2.2);
  return {
    x,
    lateralVelocity:x<=-3.25||x>=3.25?0:lateral,
    speed,
    elapsed:state.elapsed+dt,
    distance:state.distance+speed*dt,
    score:state.score+speed*dt*1.6,
    shells:state.shells,
  };
}
export function finishBeachMode(
  mode:"classic"|"time-trial"|"shell-collector",
  elapsed:number,
  shells:number,
):BeachFinish|null {
  if(mode==="classic"&&elapsed>=90) return {message:"COASTAL CRUISE COMPLETE!",bonusPoints:350,bonusCoins:5};
  if(mode==="time-trial"&&elapsed>=60) return {message:"GOLDEN HOUR RUN COMPLETE!",bonusPoints:500,bonusCoins:7};
  if(mode==="shell-collector") {
    if(shells>=12) return {message:"BEACHCOMBER ROUTE COMPLETE!",bonusPoints:650,bonusCoins:10};
    if(elapsed>=90) return {message:"ROUTE TIME UP!",bonusPoints:0,bonusCoins:0};
  }
  return null;
}
