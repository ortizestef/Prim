import Phaser from "phaser";
import type { RunResult } from "../../types";

interface Hazard {
  x: number;
  y: number;
  kind: "buoy" | "ramp";
  passed?: boolean;
}

export class WakeboardScene extends Phaser.Scene {
  private playerX = 180;
  private playerY = 310;
  private hazards: Hazard[] = [];
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private graphics!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private score = 0;
  private coins = 0;
  private tricks = 0;
  private perfectLandings = 0;
  private combo = 1;
  private jumpUntil = 0;
  private trickUntil = 0;
  private jumping = false;
  private ended = false;
  private paused = false;
  private spawnClock = 0;
  private waveOffset = 0;

  constructor() {
    super("WakeboardScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#07556b");
    this.graphics = this.add.graphics();
    this.hud = this.add.text(24, 20, "", {
      fontFamily: "DM Sans, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setDepth(10);
    this.status = this.add.text(480, 72, "RIDE THE WAKE  •  SPACE TO JUMP", {
      fontFamily: "Barlow Condensed, sans-serif",
      fontSize: "25px",
      color: "#d6fbff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D,SPACE,Z,X,ESC") as Record<string, Phaser.Input.Keyboard.Key>;
    }
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 360) this.jump();
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.ended && !this.paused) {
        this.playerX = Phaser.Math.Clamp(pointer.x, 90, 455);
        this.playerY = Phaser.Math.Clamp(pointer.y, 175, 420);
      }
    });
    this.spawnHazard();
  }

  private jump(): void {
    if (!this.jumping && !this.ended && !this.paused) {
      this.jumping = true;
      this.jumpUntil = this.time.now + 680;
      this.status.setText("AIRBORNE!  Z / X TO TRICK");
    }
  }

  private spawnHazard(): void {
    this.hazards.push({
      x: 1020,
      y: Phaser.Math.Between(190, 415),
      kind: Math.random() > 0.72 ? "ramp" : "buoy",
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    if (this.keys?.ESC && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.paused = !this.paused;
      this.status.setText(this.paused ? "PAUSED  •  PRESS ESC TO RESUME" : "RIDE THE WAKE!");
    }
    if (this.paused) return;

    this.elapsed += delta / 1000;
    this.waveOffset += delta * 0.035;
    const speed = 280 + this.elapsed * 5.2;
    const left = this.cursors?.left?.isDown || this.keys?.A?.isDown;
    const right = this.cursors?.right?.isDown || this.keys?.D?.isDown;
    const up = this.cursors?.up?.isDown || this.keys?.W?.isDown;
    const down = this.cursors?.down?.isDown || this.keys?.S?.isDown;
    if (left) this.playerX -= delta * 0.3;
    if (right) this.playerX += delta * 0.3;
    if (up) this.playerY -= delta * 0.3;
    if (down) this.playerY += delta * 0.3;
    this.playerX = Phaser.Math.Clamp(this.playerX, 90, 455);
    this.playerY = Phaser.Math.Clamp(this.playerY, 170, 435);

    if (this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.jump();
    if (this.jumping && this.keys?.Z && Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
      this.trickUntil = this.time.now + 350;
      this.status.setText("180° SPIN!");
    }
    if (this.jumping && this.keys?.X && Phaser.Input.Keyboard.JustDown(this.keys.X)) {
      this.trickUntil = this.time.now + 450;
      this.status.setText("360° SPIN!");
    }

    if (this.jumping && this.time.now >= this.jumpUntil) {
      this.jumping = false;
      if (this.trickUntil > 0) {
        this.tricks += 1;
        this.perfectLandings += 1;
        this.score += 250 * this.combo;
        this.coins += 4;
        this.combo = Math.min(5, this.combo + 1);
        this.status.setText("PERFECT LANDING!  +" + (250 * (this.combo - 1)));
      } else {
        this.score += 45;
        this.combo = 1;
        this.status.setText("NICE JUMP!");
      }
      this.trickUntil = 0;
    }

    this.spawnClock += delta;
    if (this.spawnClock > Math.max(650, 1450 - this.elapsed * 12)) {
      this.spawnHazard();
      this.spawnClock = 0;
    }
    for (const hazard of this.hazards) {
      hazard.x -= speed * delta / 1000;
      const distance = Phaser.Math.Distance.Between(this.playerX, this.playerY, hazard.x, hazard.y);
      if (distance < (hazard.kind === "buoy" ? 32 : 38)) {
        if (hazard.kind === "ramp" && !this.jumping) {
          hazard.passed = true;
          this.jump();
          this.score += 35;
        } else if (hazard.kind === "buoy" && !this.jumping) {
          this.finish();
          return;
        }
      }
      if (!hazard.passed && hazard.x < this.playerX - 45) {
        hazard.passed = true;
        this.score += 8 * this.combo;
      }
    }
    this.hazards = this.hazards.filter((hazard) => hazard.x > -80);
    this.score += delta / 1000 * 12;
    this.drawWorld();
    this.hud.setText("SCORE  " + Math.floor(this.score) + "     COMBO  x" + this.combo + "     COINS  " + this.coins + "     " + Math.floor(this.elapsed) + "s");
  }

  private drawWorld(): void {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x087a91, 1);
    g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x0b91a0, 0.35);
    g.fillEllipse(450, 280, 980, 340);
    g.lineStyle(2, 0x9cebf0, 0.2);
    for (let row = 0; row < 12; row += 1) {
      const y = 115 + row * 37;
      g.beginPath();
      for (let x = 0; x <= 980; x += 24) {
        const waveY = y + Math.sin((x + this.waveOffset + row * 22) * 0.018) * 7;
        if (x === 0) g.moveTo(x, waveY);
        else g.lineTo(x, waveY);
      }
      g.strokePath();
    }
    // Motorboat and wake
    const boatX = 790 + Math.sin(this.elapsed * 1.2) * 16;
    g.fillStyle(0xbaf8f2, 0.25);
    g.fillEllipse(boatX - 55, 150, 300, 46);
    g.fillStyle(0xf5fbf7, 1);
    g.fillRoundedRect(boatX - 10, 105, 115, 44, 13);
    g.fillStyle(0x15384a, 1);
    g.fillRoundedRect(boatX + 24, 88, 45, 22, 7);
    g.fillStyle(0xffd36e, 1);
    g.fillCircle(boatX + 106, 126, 5);

    for (const hazard of this.hazards) {
      if (hazard.kind === "buoy") {
        g.fillStyle(0xff8c68, 1);
        g.fillCircle(hazard.x, hazard.y, 17);
        g.fillStyle(0xffe1a8, 1);
        g.fillCircle(hazard.x - 5, hazard.y - 6, 5);
      } else {
        g.fillStyle(0xf7d36e, 1);
        g.fillTriangle(hazard.x - 25, hazard.y + 18, hazard.x + 28, hazard.y + 18, hazard.x + 18, hazard.y - 20);
        g.fillStyle(0xfff2ca, 1);
        g.fillRect(hazard.x - 3, hazard.y - 1, 20, 5);
      }
    }

    const lift = this.jumping ? Math.sin(Math.PI * Phaser.Math.Clamp((this.jumpUntil - this.time.now) / 680, 0, 1)) * 45 : 0;
    g.fillStyle(0x003c54, 0.3);
    g.fillEllipse(this.playerX + 8, this.playerY + 16, 60, 16);
    g.fillStyle(0xffd36b, 1);
    g.fillRoundedRect(this.playerX - 30, this.playerY - 5 - lift, 62, 10, 5);
    g.fillStyle(0xf3fbff, 1);
    g.fillCircle(this.playerX, this.playerY - 25 - lift, 12);
    g.fillStyle(0x123f55, 1);
    g.fillRoundedRect(this.playerX - 10, this.playerY - 14 - lift, 20, 25, 7);
    g.lineStyle(5, 0xffd36b, 1);
    g.lineBetween(this.playerX - 7, this.playerY + 5 - lift, this.playerX - 19, this.playerY + 19 - lift);
    g.lineBetween(this.playerX + 7, this.playerY + 5 - lift, this.playerX + 18, this.playerY + 18 - lift);
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.status.setText("WIPEOUT!  RUN COMPLETE");
    const result: RunResult = {
      gameId: "wakeboard-x",
      score: Math.floor(this.score),
      coins: this.coins,
      duration: Math.floor(this.elapsed),
      tricks: this.tricks,
      perfectLandings: this.perfectLandings,
    };
    this.game.events.emit("arcadeverse:finish", result);
  }
}