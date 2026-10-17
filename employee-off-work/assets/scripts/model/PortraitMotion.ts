/** Small, deterministic HUD animation; advancing it never changes gameplay. */
export class PortraitMotion {
  workload = 0;
  pressure = 0;
  clock = 0;
  clipClock = 0;
  transition = 1;
  private from = 0;
  private duration = 0.3;
  private initialized = false;

  reset() {
    this.workload = this.pressure = this.clock = this.clipClock = this.from = 0;
    this.transition = 1;
    this.initialized = false;
  }

  advance(workload: number, dt: number) {
    const target = Math.max(0, Math.min(2, Math.floor(workload)));
    if (!this.initialized) {
      this.workload = this.pressure = this.from = target;
      this.initialized = true;
    } else if (target !== this.workload) {
      this.from = this.pressure;
      this.duration = target > this.workload ? 0.3 : 0.5;
      this.workload = target;
      this.clipClock = 0;
      this.transition = 0;
    }
    const elapsed = Math.max(0, dt);
    this.clock += elapsed;
    this.clipClock += elapsed;
    this.transition = Math.min(1, this.transition + elapsed / this.duration);
    const ease = this.transition * this.transition * (3 - 2 * this.transition);
    this.pressure = this.from + (this.workload - this.from) * ease;
  }

  get breath() {
    const period = this.pressure < 1 ? 2 - this.pressure * 0.6 : 1.4 - (this.pressure - 1) * 0.5;
    return Math.sin(this.clock * Math.PI * 2 / period);
  }

  get blink() {
    const phase = this.clock % 4.2;
    const close = (at: number) => Math.max(0, 1 - Math.abs(phase - at) / 0.1);
    return Math.max(close(3.55), this.pressure > 1.5 ? close(3.82) : 0);
  }

  get glance() {
    const phase = this.clock % 3.4;
    return this.pressure > 0.1 && phase > 1 && phase < 1.9
      ? Math.sin((phase - 1) / 0.9 * Math.PI * 2) * 1.25 * Math.min(1, this.pressure) : 0;
  }

  get tremble() {
    return this.pressure > 1.5 && this.clock % 2.6 < 0.32
      ? Math.sin(this.clock * 65) * 0.55 * (this.pressure - 1) : 0;
  }

  /** Blend complete gestures so changing workload never jumps between oscillators. */
  private blend(calm: number, worried: number, anxious: number) {
    const p = this.pressure;
    return p < 1 ? calm + (worried - calm) * p : worried + (anxious - worried) * (p - 1);
  }

  get roll() {
    return this.blend(Math.sin(this.clock * 1.1) * 1.2,
      Math.sin(this.clock * Math.PI * 2 / 1.8) * 4,
      Math.sin(this.clock * Math.PI * 2 / 0.85) * 7 + this.tremble * 0.9);
  }

  get sway() {
    return this.blend(0, Math.sin(this.clock * Math.PI * 2 / 1.8) * 0.55,
      Math.sin(this.clock * Math.PI * 2 / 0.85) * 1.1 + this.tremble * 0.4);
  }

  get bob() {
    return this.blend(0, Math.sin(this.clock * Math.PI * 2 / 1.3) * 0.45,
      Math.sin(this.clock * Math.PI * 2 / 0.65) * 0.8);
  }

  get clipFrame() { return Math.floor(this.clipClock * 12) % 61; }
}
