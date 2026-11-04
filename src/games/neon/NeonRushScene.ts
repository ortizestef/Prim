import Phaser from "phaser";
import type { RunResult } from "../../types";

interface TrackObject {
  x: number;
  lane: number;
  kind: "barrier" | "coin" | "power";
  passed?: boolean;
}

export class NeonRushScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private lane = 1;
  private objects: TrackObject[] = [];
  private elapsed = 0;
  private score = 0;
  private coins = 0;
  private spawnClock = 0;
  private jumpUntil = 0;
  private shieldUntil = 0;
  private magnetUntil = 0;
  private speedBoostUntil = 0;
  private ended = false;
  private paused = false;
  private keys?: Record<string, Phaser.Input.Keyboard.Key>;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private stripeOffset = 0;

  constructor() {
    super("NeonRushScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#090d24");
    this.graphics = this.add.graphics();
    this.hud = this.add.text(24, 20, "", {
      fontFamily: "DM Sans, sans-serif",
      fontSize: "17px",
      color: "#f5f4ff",
      fontStyle: "bold",
    }).setDepth(10);
    this.status = this.add.text(480, 75, "RUN. DODGE. COLLECT.", {
      fontFamily: "Barlow Condensed, sans-serif",
      fontSize: "27px",
      color: "#76f7ff",
      fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10);
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("A,D,SPACE,ESC") as Record<string, Phaser.Input.Keyboard.Key>;
    }
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > 390) {
        if (pointer.x < 320) this.changeLane(-1);
        else if (pointer.x > 640) this.changeLane(1);
        else this.jump();
      } else {
        this.jump();
      }
    });
    this.spawnObject("coin");
    this.spawnObject("barrier");
  }

  private changeLane(direction: number): void {
    this.lane = Phaser.Math.Clamp(this.lane + direction, 0, 2);
  }

  private jump(): void {
    if (this.time.now > this.jumpUntil && !this.ended && !this.paused) {
      this.jumpUntil = this.time.now + 680;
      this.status.setText("NICE AIR!");
    }
  }

  private spawnObject(kind?: TrackObject["kind"]): void {
    this.objects.push({
      x: 1010,
      lane: Phaser.Math.Between(0, 2),
      kind: kind ?? (Math.random() > 0.73 ? "coin" : "barrier"),
    });
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;
    if (this.keys?.ESC && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.paused = !this.paused;
      this.status.setText(this.paused ? "PAUSED  •  PRESS ESC TO RESUME" : "KEEP MOVING!");
    }
    if (this.paused) return;

    this.elapsed += delta / 1000;
    this.stripeOffset = (this.stripeOffset + delta * 0.42) % 100;
    if (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.changeLane(-1);
    else if (this.keys?.A && Phaser.Input.Keyboard.JustDown(this.keys.A)) this.changeLane(-1);
    if (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.changeLane(1);
    else if (this.keys?.D && Phaser.Input.Keyboard.JustDown(this.keys.D)) this.changeLane(1);
    if (this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.jump();

    const boost = this.time.now < this.speedBoostUntil ? 1.45 : 1;
    const speed = (300 + this.elapsed * 9) * boost;
    this.spawnClock += delta;
    if (this.spawnClock > Math.max(480, 1200 - this.elapsed * 9)) {
      this.spawnObject();
      if (Math.random() > 0.75) this.spawnObject("coin");
      this.spawnClock = 0;
    }

    for (const object of this.objects) {
      object.x -= speed * delta / 1000;
      if (!object.passed && object.x < 205 && object.x > 125 && object.lane === this.lane) {
        object.passed = true;
        if (object.kind === "coin") {
          this.coins += 1;
          this.score += 45;
          this.status.setText("+1 DATA CHIP");
        } else if (object.kind === "power") {
          this.shieldUntil = this.time.now + 5000;
          this.status.setText("SHIELD ONLINE");
        } else if (this.time.now > this.jumpUntil && this.time.now > this.shieldUntil) {
          this.finish();
          return;
        } else {
          this.score += 35;
          this.status.setText("DODGED!");
        }
      }
      if (object.kind === "coin" && this.time.now < this.magnetUntil && object.x < 450 && object.lane === this.lane) {
        object.x = 180;
      }
    }
    this.objects = this.objects.filter((object) => object.x > -70);
    this.score += delta / 1000 * (16 + this.elapsed * 0.9);
    if (this.elapsed > 12 && Math.random() < 0.004) this.magnetUntil = this.time.now + 3000;
    if (this.elapsed > 18 && Math.random() < 0.002) this.speedBoostUntil = this.time.now + 2500;
    this.drawWorld();
    const power = this.time.now < this.shieldUntil ? "SHIELD" : this.time.now < this.speedBoostUntil ? "BOOST" : this.time.now < this.magnetUntil ? "MAGNET" : "";
    this.hud.setText("SCORE  " + Math.floor(this.score) + "     DATA CHIPS  " + this.coins + "     SPEED  " + (1 + this.elapsed / 30).toFixed(1) + "x     " + power);
  }

  private drawWorld(): void {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x090d24, 1);
    g.fillRect(0, 0, 960, 540);
    g.fillStyle(0x17214b, 1);
    g.fillRect(0, 110, 960, 430);
    for (let i = 0; i < 15; i += 1) {
      const x = i * 72;
      const h = 45 + ((i * 31) % 95);
      g.fillStyle(i % 2 ? 0x202d62 : 0x182650, 1);
      g.fillRect(x, 110 - h, 48, h);
      g.fillStyle(0x5b6fbd, 0.55);
      for (let wy = 0; wy < h - 12; wy += 19) g.fillRect(x + 9, 117 - h + wy, 4, 7);
    }
    g.fillStyle(0x0d1535, 1);
    g.fillTriangle(250, 540, 710, 540, 570, 110);
    g.lineStyle(3, 0x3c4e9d, 0.7);
    g.lineBetween(403, 540, 452, 110);
    g.lineBetween(557, 540, 508, 110);
    g.lineStyle(2, 0x30e8ef, 0.3);
    for (let y = this.stripeOffset - 100; y < 560; y += 100) g.lineBetween(285, y, 675, y);

    for (const object of this.objects) {
      const perspective = Phaser.Math.Clamp(object.x / 1010, 0, 1);
      const x = 480 + (object.lane - 1) * (22 + perspective * 125);
      const y = 440 - perspective * 285;
      if (object.kind === "coin") {
        g.fillStyle(0xffd66f, 1);
        g.fillCircle(x, y, 12);
        g.lineStyle(3, 0xfff5c6, 1);
        g.strokeCircle(x, y, 7);
      } else if (object.kind === "power") {
        g.fillStyle(0x8e76ff, 1);
        g.fillRoundedRect(x - 15, y - 15, 30, 30, 8);
      } else {
        g.fillStyle(0xff4f8b, 1);
        g.fillRoundedRect(x - 20, y - 24, 40, 48, 7);
        g.fillStyle(0xffb3cb, 1);
        g.fillRect(x - 12, y - 15, 24, 5);
      }
    }

    const laneX = [342, 480, 618];
    const x = laneX[this.lane];
    const lift = this.time.now < this.jumpUntil ? 48 : 0;
    g.fillStyle(0x3cfff5, 0.2);
    g.fillEllipse(x, 458, 88, 28);
    if (this.time.now < this.shieldUntil) {
      g.lineStyle(4, 0x86b8ff, 0.9);
      g.strokeCircle(x, 400 - lift, 42);
    }
    g.fillStyle(0x7af7ff, 1);
    g.fillTriangle(x, 347 - lift, x - 25, 414 - lift, x + 25, 414 - lift);
    g.fillStyle(0xf9f5ff, 1);
    g.fillCircle(x, 369 - lift, 12);
    g.fillStyle(0x9a7bff, 1);
    g.fillRoundedRect(x - 14, 385 - lift, 28, 30, 8);
    g.fillStyle(0xff5caa, 1);
    g.fillRect(x - 22, 418, 44, 6);
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.status.setText("RUN OVER  •  TRY AGAIN");
    const result: RunResult = {
      gameId: "neon-rush",
      score: Math.floor(this.score),
      coins: this.coins,
      duration: Math.floor(this.elapsed),
    };
    this.game.events.emit("arcadeverse:finish", result);
  }
}