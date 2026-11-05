import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { WakeboardScene } from "../games/wakeboard/WakeboardScene";
import { NeonRushScene } from "../games/neon/NeonRushScene";
import type { GameId, PlayerSettings, RunResult } from "../types";

interface PhaserGameProps {
  gameId: GameId;
  onFinish: (result: RunResult) => void;
  equippedItem?: string | null;
  controlScheme?: PlayerSettings["controlScheme"];
}

export default function PhaserGame({
  gameId,
  onFinish,
  equippedItem = null,
  controlScheme = "arrows",
}: PhaserGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = gameId === "wakeboard-x"
      ? new WakeboardScene(equippedItem, controlScheme)
      : new NeonRushScene(equippedItem, controlScheme);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 960,
      height: 540,
      backgroundColor: gameId === "wakeboard-x" ? "#07556b" : "#090d24",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: true,
        pixelArt: false,
      },
      scene: [scene],
    });
    gameRef.current = game;
    const handleFinish = (result: RunResult) => finishRef.current(result);
    game.events.on("arcadeverse:finish", handleFinish);

    return () => {
      game.events.off("arcadeverse:finish", handleFinish);
      game.destroy(true);
      gameRef.current = null;
    };
  }, [gameId, equippedItem, controlScheme]);

  const wakeAction = (action: "left" | "right" | "up" | "down" | "jump" | "spin180" | "spin360") => {
    const scene = gameRef.current?.scene.getScene("WakeboardScene") as WakeboardScene | undefined;
    if (!scene) return;
    if (action === "left") scene.moveBy(-38, 0);
    else if (action === "right") scene.moveBy(38, 0);
    else if (action === "up") scene.moveBy(0, -32);
    else if (action === "down") scene.moveBy(0, 32);
    else if (action === "jump") scene.touchJump();
    else scene.touchTrick(action);
  };

  const neonAction = (action: "left" | "right" | "jump") => {
    const scene = gameRef.current?.scene.getScene("NeonRushScene") as NeonRushScene | undefined;
    if (!scene) return;
    if (action === "left") scene.touchLane(-1);
    else if (action === "right") scene.touchLane(1);
    else scene.touchJump();
  };

  return (
    <div className="phaser-game-shell">
      <div className="phaser-host" ref={hostRef} aria-label={gameId + " game canvas"} />
      <div className={"touch-controls " + (gameId === "wakeboard-x" ? "wake-touch" : "neon-touch")} aria-label="Touch game controls">
        {gameId === "wakeboard-x" ? (
          <>
            <div className="touch-direction-pad">
              <button type="button" onClick={() => wakeAction("left")} aria-label="Move left">←</button>
              <button type="button" onClick={() => wakeAction("up")} aria-label="Move up">↑</button>
              <button type="button" onClick={() => wakeAction("down")} aria-label="Move down">↓</button>
              <button type="button" onClick={() => wakeAction("right")} aria-label="Move right">→</button>
            </div>
            <div className="touch-action-pad">
              <button type="button" className="touch-primary" onClick={() => wakeAction("jump")}>JUMP</button>
              <button type="button" onClick={() => wakeAction("spin180")}>180°</button>
              <button type="button" onClick={() => wakeAction("spin360")}>360°</button>
            </div>
          </>
        ) : (
          <div className="touch-runner-pad">
            <button type="button" onClick={() => neonAction("left")} aria-label="Move left">←</button>
            <button type="button" className="touch-primary" onClick={() => neonAction("jump")}>JUMP</button>
            <button type="button" onClick={() => neonAction("right")} aria-label="Move right">→</button>
          </div>
        )}
      </div>
    </div>
  );
}