import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { WakeboardScene } from "../games/wakeboard/WakeboardScene";
import { NeonRushScene } from "../games/neon/NeonRushScene";
import type { GameId, RunResult } from "../types";

interface PhaserGameProps {
  gameId: GameId;
  onFinish: (result: RunResult) => void;
}

export default function PhaserGame({ gameId, onFinish }: PhaserGameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = gameId === "wakeboard-x" ? new WakeboardScene() : new NeonRushScene();
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
    const handleFinish = (result: RunResult) => finishRef.current(result);
    game.events.on("arcadeverse:finish", handleFinish);

    return () => {
      game.events.off("arcadeverse:finish", handleFinish);
      game.destroy(true);
    };
  }, [gameId]);

  return <div className="phaser-host" ref={hostRef} aria-label={gameId + " game canvas"} />;
}