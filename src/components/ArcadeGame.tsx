import {lazy} from "react";
import type {GameId,GameMode,PlayerSettings,RunResult} from "../types";

const BeachSkate3D=lazy(()=>import("./BeachSkate3D"));
const PhaserGame=lazy(()=>import("./PhaserGame"));

interface ArcadeGameProps {
  gameId:GameId;
  mode:GameMode;
  onFinish:(result:RunResult)=>void;
  equippedItem?:string|null;
  controlScheme?:PlayerSettings["controlScheme"];
}
export default function ArcadeGame(props:ArcadeGameProps) {
  if(props.gameId==="wakeboard-x") {
    return <BeachSkate3D mode={props.mode} onFinish={props.onFinish} equippedItem={props.equippedItem} controlScheme={props.controlScheme}/>;
  }
  return <PhaserGame gameId={props.gameId} mode={props.mode} onFinish={props.onFinish} equippedItem={props.equippedItem} controlScheme={props.controlScheme}/>;
}
