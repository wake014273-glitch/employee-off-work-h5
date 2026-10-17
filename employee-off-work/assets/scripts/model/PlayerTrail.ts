export const PLAYER_TRAIL = { capacity: 48, lifetime: 0.48, spacing: 4, maxLength: 180, radius: 18, teleportDistance: 220 };
export type TrailPoint = { x: number; y: number; life: number };
export type RibbonPoint = TrailPoint & { nx: number; ny: number; radius: number; alpha: number; progress: number };

/** Bounded particle history, joined into the smooth tapered trail in the reference. */
export class PlayerTrail {
  readonly samples: TrailPoint[] = Array.from({ length: PLAYER_TRAIL.capacity }, () => ({ x: 0, y: 0, life: 0 }));
  private previous?: { x: number; y: number };
  private cursor = 0;

  clear() {
    for (const sample of this.samples) sample.life = 0;
    this.previous = undefined; this.cursor = 0;
  }

  private emit(x: number, y: number, life: number) {
    Object.assign(this.samples[this.cursor], { x, y, life });
    this.cursor = (this.cursor + 1) % this.samples.length;
  }

  advance(dt: number, point: { x: number; y: number }) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    if (!this.previous) { this.previous = { x: point.x, y: point.y }; return; }
    if (!Number.isFinite(dt) || dt <= 0) return;
    const elapsed = Math.min(dt, 0.1);
    for (const sample of this.samples) sample.life = Math.max(0, sample.life - elapsed);
    const distance = Math.hypot(point.x - this.previous.x, point.y - this.previous.y);
    if (distance > PLAYER_TRAIL.teleportDistance) {
      this.clear(); this.previous = { x: point.x, y: point.y }; return;
    }
    if (distance > 1.2) {
      if (!this.samples.some(s => s.life > 0)) this.emit(this.previous.x, this.previous.y, PLAYER_TRAIL.lifetime - elapsed);
      // Distance sampling keeps quick swipes continuous instead of separate dots.
      const steps = Math.min(this.samples.length - 1, Math.ceil(distance / PLAYER_TRAIL.spacing));
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        this.emit(this.previous.x + (point.x - this.previous.x) * t,
          this.previous.y + (point.y - this.previous.y) * t, PLAYER_TRAIL.lifetime - elapsed * (1 - t));
      }
    }
    this.previous = { x: point.x, y: point.y };
  }

  ribbon(): RibbonPoint[] {
    let points: TrailPoint[] = [];
    for (let offset = 0; offset < this.samples.length; offset++) {
      const sample = this.samples[(this.cursor + offset) % this.samples.length];
      if (sample.life > 0) points.push({ ...sample });
    }
    if (points.length < 2) return [];
    // Clip by travelled distance, including curves and reversals rather than a straight chord.
    let length = 0, first = points.length - 1;
    while (first > 0) {
      const a = points[first], b = points[first - 1], segment = Math.hypot(a.x - b.x, a.y - b.y);
      if (length + segment > PLAYER_TRAIL.maxLength) {
        const t = (PLAYER_TRAIL.maxLength - length) / segment;
        points[first - 1] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
          life: a.life + (b.life - a.life) * t };
        first--; break;
      }
      length += segment; first--;
    }
    points = points.slice(first);
    // Corner cutting makes a soft bend without spline overshoot at hairpin turns.
    for (let pass = 0; pass < 2; pass++) {
      const smooth = [points[0]];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        for (const t of [0.25, 0.75]) smooth.push({ x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t, life: a.life + (b.life - a.life) * t });
      }
      smooth.push(points[points.length - 1]); points = smooth;
    }
    const distances = [0];
    for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] +
      Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
    const total = distances[distances.length - 1];
    if (total < 1) return [];
    return points.map((p, i) => {
      const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      let dx = after.x - before.x, dy = after.y - before.y;
      if (Math.hypot(dx, dy) < 0.001) { dx = after.x - p.x; dy = after.y - p.y; }
      const magnitude = Math.hypot(dx, dy) || 1;
      const progress = distances[i] / total, fade = p.life / PLAYER_TRAIL.lifetime;
      return { ...p, nx: -dy / magnitude, ny: dx / magnitude, progress,
        radius: PLAYER_TRAIL.radius * Math.pow(progress, 0.72) * Math.pow(fade, 0.45),
        alpha: Math.round(240 * Math.pow(progress, 0.55) * Math.pow(fade, 0.55)) };
    });
  }
}
