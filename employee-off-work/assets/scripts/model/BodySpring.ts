/** Visual inertia only: feet follow the player; the torso and head follow a spring. */
export const BODY_SPRING = { stiffness: 135, damping: 11, drive: 18, maxX: 36, maxY: 22, rows: 24 };

/** Keep feet/shadow still and ease the bend into a rigid head, preserving the face. */
export function bodySpringWeight(y: number) {
  const t = Math.max(0, Math.min(1, (y + 42) / 70));
  return t * t * (3 - 2 * t);
}

export class BodySpring {
  x = 0;
  y = 0;
  private vx = 0;
  private vy = 0;
  private rootX = 0;
  private rootY = 0;
  private initialized = false;

  reset(root: { x: number; y: number }) {
    this.rootX = root.x; this.rootY = root.y;
    this.x = this.y = this.vx = this.vy = 0;
    this.initialized = true;
  }

  advance(dt: number, root: { x: number; y: number }) {
    if (!this.initialized) { this.reset(root); return; }
    if (!Number.isFinite(dt) || dt <= 0) return;
    const elapsed = Math.min(dt, 0.1);
    const driveX = (root.x - this.rootX) / elapsed;
    const driveY = (root.y - this.rootY) / elapsed;
    this.rootX = root.x; this.rootY = root.y;
    const steps = Math.ceil(elapsed / (1 / 120));
    const step = elapsed / steps;
    const { stiffness, damping, drive, maxX, maxY } = BODY_SPRING;
    for (let i = 0; i < steps; i++) {
      this.vx += (-stiffness * this.x - damping * this.vx - drive * driveX) * step;
      this.vy += (-stiffness * this.y - damping * this.vy - drive * driveY) * step;
      this.x += this.vx * step; this.y += this.vy * step;
      if (Math.abs(this.x) > maxX) { this.x = Math.sign(this.x) * maxX; this.vx = 0; }
      if (Math.abs(this.y) > maxY) { this.y = Math.sign(this.y) * maxY; this.vy = 0; }
    }
    if (Math.abs(this.x) < 0.01 && Math.abs(this.vx) < 0.1) this.x = this.vx = 0;
    if (Math.abs(this.y) < 0.01 && Math.abs(this.vy) < 0.1) this.y = this.vy = 0;
  }
}
