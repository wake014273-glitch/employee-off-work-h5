import { DESIGN_HEIGHT, DESIGN_WIDTH, FOLDER_RADIUS, FOLDER_SPACING, HUD_SAFE_HEIGHT, PLAYER_START_Y, PLAYER_BODY, PLAYER_EDGE_MARGIN, TOP_SPAWN_MARGIN, playerMovementTop, playerMirrorSign } from './GameLayout.ts';
import type { PlayerFacing } from './GameLayout.ts';
export { HUD_SAFE_HEIGHT } from './GameLayout.ts';

export type Point = { x: number; y: number };
export type RandomSource = () => number;

export const FIELD_WIDTH = DESIGN_WIDTH;
export const FIELD_HEIGHT = DESIGN_HEIGHT;
export const PLAYER_RADIUS = PLAYER_BODY.radius;
export const SHIELD_DURATION = 3;

/** 擦弹判定带：弹体边缘距离头部/躯干胶囊的距离。 */
export const GRAZE_CLEARANCE = 11;
/** 擦弹全局冷却：两次计数的最小间隔（秒） */
export const GRAZE_COOLDOWN = 0.4;
/** 擦弹连击计入倍率的堆叠上限 */
export const GRAZE_MAX_STACK = 20;
/** 甩脱判定：追踪结束时与玩家的最小距离（2026-09-28 由 260 上调到 320，过滤近身廉价甩脱） */
export const BREAK_LOCK_DISTANCE = 320;
/** 穿缝判定：玩家边缘与最近文件夹边缘的最大余量（像素，与碰撞判定同一把尺） */
export const GAP_CLEAR_DISTANCE = 6;
/** 消息生成预留需求表位置，保持混合弹幕且不突破共享上限。 */
export const REQUIREMENT_FLOOR = 2;

/** 操作评级：达成困难操作时的即时评价与加分（S > A > B），数值为一次性奖励。 */
export type Grade = 'B' | 'A' | 'S';
export const GRADE_RANK: Record<Grade, number> = { B: 1, A: 2, S: 3 };
export const BREAK_BURST = { window: 3, b: 2, a: 3, s: 4, bonus: { B: 80, A: 160, S: 300 } as Record<Grade, number> };
export const GAP_CHAIN = { window: 20, b: 2, a: 3, s: 4, bonus: { B: 100, A: 200, S: 350 } as Record<Grade, number> };
export const GRAZE_GRADE = { b: 6, a: 10, s: 15, bonus: { B: 60, A: 140, S: 260 } as Record<Grade, number> };
/** 请假条：掷骰间隔与命中率 */
export const LEAVE_SLIP_ROLL_INTERVAL = 28;
export const LEAVE_SLIP_CHANCE = 0.35;
/** 请假条清屏：每条被清掉的弹幕折算的积分 */
export const LEAVE_SLIP_CLEAR_VALUE = 10;
export const LEAVE_SLIP_LIFETIME = 12;
export const LEAVE_SLIP_INVULNERABLE = 1.0;
export const AI_PICKUP_ROLL_INTERVAL = 15;
export const AI_PICKUP_CHANCE = 0.6;
export const AI_AGENT_CHANCE_AT_TWO = 0.4;
export const AI_PICKUP_SPEED = { helper: 76, agent: 190 } as const;
export const MAX_EVENTS = 48;

export type WavePhase = 'simple' | 'normal' | 'hard';
export const PHASE_LABELS: Record<WavePhase, string> = { simple: '简单', normal: '一般', hard: '困难' };

export type WaveConfig = {
  wave: number;
  phase: WavePhase;
  duration: number;
  messages: boolean;
  requirements: boolean;
  walls: boolean;
  messageInterval: number;
  requirementInterval: number;
  wallInterval: number;
  speedScale: number;
  /** 同屏威胁上限：消息 + 需求表的存活数量（文件夹墙单独限 2 面） */
  maxThreats: number;
  gapWidth: number;
  maxHoming: number;
};

export const HARD_TIER_SECONDS = 45;
export const HARD_LATE_TIER_SECONDS = 30;
export const HARD_LATE_START_SECONDS = HARD_TIER_SECONDS * 6;
export const HARD_RAMP_SECONDS = 12;
export const HARD_BREATH_SECONDS = 5;
export const SIMPLE_WAVE_SECONDS = 8;
export const NORMAL_WAVE_SECONDS = 16;
export const HARD_START_SECONDS = SIMPLE_WAVE_SECONDS + NORMAL_WAVE_SECONDS;

/** 波次保留原来的计分口径；困难压力前六档每 45 秒、此后每 30 秒升档。 */
const FIXED_WAVES: WaveConfig[] = [
  { wave: 1, phase: 'simple', duration: SIMPLE_WAVE_SECONDS, messages: false, requirements: true, walls: false, messageInterval: 0, requirementInterval: 1.1, wallInterval: 0, speedScale: 1.0, maxThreats: 8, gapWidth: 180, maxHoming: 0 },
  { wave: 2, phase: 'normal', duration: NORMAL_WAVE_SECONDS, messages: false, requirements: true, walls: true, messageInterval: 0, requirementInterval: 1.5, wallInterval: 7.0, speedScale: 1.1, maxThreats: 8, gapWidth: 180, maxHoming: 0 },
];

type HardPressure = Pick<WaveConfig, 'messageInterval' | 'requirementInterval' | 'wallInterval' | 'speedScale' | 'maxThreats' | 'gapWidth' | 'maxHoming'>;
const HARD_PRESSURE: HardPressure[] = [
  { messageInterval: 3.4, requirementInterval: 2.2, wallInterval: 9.0, speedScale: 1.04, maxThreats: 7, gapWidth: 180, maxHoming: 1 },
  { messageInterval: 3.1, requirementInterval: 2.15, wallInterval: 8.8, speedScale: 1.06, maxThreats: 8, gapWidth: 176, maxHoming: 1 },
  { messageInterval: 2.8, requirementInterval: 2.1, wallInterval: 8.6, speedScale: 1.08, maxThreats: 10, gapWidth: 172, maxHoming: 1 },
  { messageInterval: 2.4, requirementInterval: 2.0, wallInterval: 8.4, speedScale: 1.11, maxThreats: 11, gapWidth: 168, maxHoming: 1 },
  { messageInterval: 2.15, requirementInterval: 1.95, wallInterval: 8.2, speedScale: 1.13, maxThreats: 12, gapWidth: 164, maxHoming: 2 },
  { messageInterval: 1.9, requirementInterval: 1.9, wallInterval: 8.0, speedScale: 1.15, maxThreats: 13, gapWidth: 160, maxHoming: 2 },
];

/** 困难阶段 270 秒后继续加压；540 秒起过渡到三颗追踪，最终参数有界。 */
function hardTargetFor(tier: number): HardPressure {
  if (tier <= HARD_PRESSURE.length) return HARD_PRESSURE[Math.max(0, tier - 1)];
  const extra = tier - HARD_PRESSURE.length;
  const base = HARD_PRESSURE[HARD_PRESSURE.length - 1];
  return {
    messageInterval: Math.max(1.0, base.messageInterval * 0.97 ** extra),
    requirementInterval: Math.max(1.4, base.requirementInterval * 0.99 ** extra),
    wallInterval: Math.max(6.0, base.wallInterval * 0.99 ** extra),
    speedScale: Math.min(1.36, base.speedScale + 0.008 * extra),
    maxThreats: Math.min(20, base.maxThreats + Math.floor(extra / 2)),
    gapWidth: Math.max(128, base.gapWidth - 2 * extra),
    maxHoming: extra >= 10 ? 3 : 2,
  };
}

export const hardTierFor = (hardSeconds: number) => {
  const seconds = Math.max(0, hardSeconds);
  return seconds < HARD_LATE_START_SECONDS
    ? Math.floor(seconds / HARD_TIER_SECONDS) + 1
    : HARD_PRESSURE.length + Math.floor((seconds - HARD_LATE_START_SECONDS) / HARD_LATE_TIER_SECONDS) + 1;
};

const hardTierPositionFor = (hardSeconds: number) => {
  const seconds = Math.max(0, hardSeconds);
  return seconds < HARD_LATE_START_SECONDS
    ? { elapsed: seconds % HARD_TIER_SECONDS, duration: HARD_TIER_SECONDS }
    : { elapsed: (seconds - HARD_LATE_START_SECONDS) % HARD_LATE_TIER_SECONDS, duration: HARD_LATE_TIER_SECONDS };
};

export function waveConfigFor(wave: number, waveTimer = 0): WaveConfig {
  const safeWave = Math.max(1, Math.floor(wave));
  if (safeWave <= FIXED_WAVES.length) return { ...FIXED_WAVES[safeWave - 1] };
  const hardSeconds = (safeWave - 3) * 60 + Math.max(0, waveTimer);
  const tier = hardTierFor(hardSeconds);
  const target = hardTargetFor(tier);
  const previous = hardTargetFor(Math.max(1, tier - 1));
  const progress = Math.min(1, hardTierPositionFor(hardSeconds).elapsed / HARD_RAMP_SECONDS);
  const blend = progress * progress * (3 - 2 * progress);
  const interpolate = (key: keyof HardPressure) => previous[key] + (target[key] - previous[key]) * blend;
  return {
    wave: safeWave,
    phase: 'hard',
    duration: 60,
    messages: true,
    requirements: true,
    walls: true,
    messageInterval: interpolate('messageInterval'),
    requirementInterval: interpolate('requirementInterval'),
    wallInterval: interpolate('wallInterval'),
    speedScale: interpolate('speedScale'),
    maxThreats: Math.floor(interpolate('maxThreats') + 1e-9),
    gapWidth: interpolate('gapWidth'),
    maxHoming: blend < 1 ? previous.maxHoming : target.maxHoming,
  };
}


export const waveMultiplierFor = (wave: number) => Math.min(3, 1 + 0.1 * (Math.max(1, wave) - 1));
export const comboMultiplierFor = (combo: number) => 1 + 0.05 * Math.min(Math.max(0, combo), GRAZE_MAX_STACK);

export type RunStats = {
  elapsed: number;
  score: number;
  wave: number;
  maxCombo: number;
  gapClears: number;
  breakLocks: number;
  leaveSlips: number;
  gradeCount?: number;
  bestGrade?: Grade | null;
};

/** S 级额外门槛：局内至少达成一次操作评价 S（甩脱爆发 / 穿缝连击 / 擦弹大师任一）。 */
export const rankFor = (wave: number, score: number, bestGrade: Grade | null = null) => {
  if (wave >= 12 && score >= 12000 && bestGrade === 'S') return 'S · 摸鱼大师';
  if (wave >= 9 && score >= 7000) return 'A · 摸鱼高手';
  if (wave >= 6 && score >= 3500) return 'B · 合格摸鱼';
  return 'C · 打工仔';
};

export const formatGameOverSummary = (stats: RunStats) => {
  const gradePart = stats.gradeCount && stats.gradeCount > 0
    ? ` · 操作评价 ${stats.gradeCount} 次${stats.bestGrade ? `（最高 ${stats.bestGrade}）` : ''}` : '';
  const missingRiskGrade = stats.wave >= 12 && stats.score >= 12000 && stats.bestGrade !== 'S';
  return `任务堆满，被迫开工\n抵达第 ${stats.wave} 波 · 存活 ${stats.elapsed.toFixed(1)} 秒 · ${stats.score} 分\n` +
    `评级：${rankFor(stats.wave, stats.score, stats.bestGrade ?? null)}${missingRiskGrade ? '（S 级需至少一次操作评价 S）' : ''}\n最高连击 ${stats.maxCombo} · 穿缝 ${stats.gapClears} · 甩脱 ${stats.breakLocks} · 请假条 ${stats.leaveSlips}${gradePart}\n\n点击重新摸鱼`;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distanceSquared = (a: Point, b: Point) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const normalize = (x: number, y: number) => {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
};
const rotateToward = (vx: number, vy: number, targetAngle: number, maxTurn: number) => {
  const speed = Math.hypot(vx, vy);
  const current = Math.atan2(vy, vx);
  let delta = ((targetAngle - current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  delta = clamp(delta, -maxTurn, maxTurn);
  return { x: Math.cos(current + delta) * speed, y: Math.sin(current + delta) * speed };
};

export type GameEvent =
  | { type: 'graze'; x: number; y: number }
  | { type: 'gap'; x: number; y: number; value: number }
  | { type: 'break'; x: number; y: number; value: number }
  | { type: 'hit'; x: number; y: number; workload: number }
  | { type: 'practice-hit' | 'practice-dodged'; x: number; y: number }
  | { type: 'shield-block'; x: number; y: number }
  | { type: 'shield' }
  | { type: 'pickup'; x: number; y: number; energy: number; gained: number }
  | { type: 'wave-clear'; wave: number; bonus: number; noHit: boolean }
  | { type: 'hard-step'; wave: number; value: number }
  | { type: 'difficulty-step'; tier: number }
  | { type: 'leave-spawn'; x: number; y: number }
  | { type: 'leave'; x: number; y: number; count: number; value: number }
  | { type: 'ai-spawn'; kind: AiPickupKind; x: number; y: number }
  | { type: 'ai-pickup'; kind: AiPickupKind; x: number; y: number; removed: number; workload: number }
  | { type: 'evil-laugh'; x: number; y: number }
  | { type: 'grade'; grade: Grade; label: string; count: number; value: number; x: number; y: number };

export class GestureRecognizer {
  readonly maxInterval: number;
  readonly dragThreshold: number;
  private startX = 0;
  private startY = 0;
  private dragged = false;
  private lastTapTime = -Infinity;

  constructor(maxInterval = 0.3, dragThreshold = 18) {
    this.maxInterval = maxInterval;
    this.dragThreshold = dragThreshold;
  }

  begin(x: number, y: number, _time: number) {
    this.startX = x;
    this.startY = y;
    this.dragged = false;
  }

  move(x: number, y: number) {
    if (Math.hypot(x - this.startX, y - this.startY) > this.dragThreshold) this.dragged = true;
  }

  /** 双击判定：屏幕任意位置的两次轻点（不需要点到角色身上），拖动不触发。 */
  end(x: number, y: number, time: number) {
    const moved = Math.hypot(x - this.startX, y - this.startY);
    const valid = !this.dragged && moved <= this.dragThreshold;
    if (!valid) {
      this.lastTapTime = -Infinity;
      return false;
    }
    const doubled = time - this.lastTapTime <= this.maxInterval;
    this.lastTapTime = doubled ? -Infinity : time;
    return doubled;
  }

  reset() { this.lastTapTime = -Infinity; this.dragged = false; }
}

export class MessageBullet {
  kind = 'message' as const;
  radius = 15;
  state: 'cruise' | 'homing' = 'cruise';
  homingTime = 0;
  tauntTime = 0;
  senseRadius = 230;
  /** 出圈再锁：追踪「放弃」后必须离开感应圈，才会重新武装并再次锁定 */
  armed = true;
  grazed = false;
  alive = true;
  x: number; y: number; vx: number; vy: number;
  constructor(x: number, y: number, vx: number, vy: number) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
  }

  /** 追踪结束时若已甩开距离，返回 'lock-lost'（供模型结算「已读不回」）。 */
  update(dt: number, player: Point, allowLock = true): 'lock-lost' | null {
    this.tauntTime = Math.max(0, this.tauntTime - dt);
    let result: 'lock-lost' | null = null;
    const distSq = distanceSquared(this, player);
    if (!this.armed && distSq > this.senseRadius ** 2) this.armed = true;
    if (this.state === 'cruise' && this.armed && allowLock && distSq <= this.senseRadius ** 2) {
      // 无预警：进入感应半径立即开始追踪
      this.state = 'homing'; this.homingTime = 1.8;
    } else if (this.state === 'homing') {
      const turned = rotateToward(this.vx, this.vy, Math.atan2(player.y - this.y, player.x - this.x), 2.2 * dt);
      this.vx = turned.x; this.vy = turned.y;
      this.homingTime -= dt;
      if (this.homingTime <= 0) {
        this.state = 'cruise';
        this.armed = false;
        if (distSq >= BREAK_LOCK_DISTANCE ** 2) result = 'lock-lost';
      }
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    return result;
  }
}

export const createMessage = (x: number, y: number, vx: number, vy: number) =>
  new MessageBullet(x, y, vx, vy);

export class RequirementBullet {
  kind = 'requirement' as const;
  radius = 17;
  turnTimer: number;
  turnFlash = 0;
  turnDirection = 0;
  grazed = false;
  alive = true;
  x: number; y: number; vx: number; vy: number;
  random: RandomSource;

  constructor(x: number, y: number, vx: number, vy: number, random: RandomSource) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.random = random;
    this.turnTimer = 1.5 + random() * 1.5;
  }

  /** 无预警：计时到点立即转向（单次转角上限 ±0.72π，不会 180° 掉头）。 */
  update(dt: number) {
    this.turnFlash = Math.max(0, this.turnFlash - dt);
    this.turnTimer -= dt;
    if (this.turnTimer <= 0) {
      const current = Math.atan2(this.vy, this.vx);
      const offset = (this.random() * 2 - 1) * Math.PI * 0.72;
      this.turnDirection = Math.sign(offset);
      this.turnFlash = Math.abs(offset) > 0.01 ? 0.26 : 0;
      const speed = Math.hypot(this.vx, this.vy);
      this.vx = Math.cos(current + offset) * speed;
      this.vy = Math.sin(current + offset) * speed;
      this.turnTimer = 1.5 + this.random() * 1.5;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
  }
}

export const createRequirement = (x: number, y: number, vx: number, vy: number, random: RandomSource) =>
  new RequirementBullet(x, y, vx, vy, random);

export type FolderOrb = { kind: 'folder'; x: number; y: number; vx: number; vy: number; radius: number; alive: boolean; grazed: boolean };
export type FolderWallShape = { orbs: FolderOrb[]; gapStart: number; gapEnd: number };

/** 文件夹墙：整排向上推进，某一位置留出可穿越的缺口。 */
export function createFolderWall(width: number, gapPosition: number, gapWidth = 136, y = FIELD_HEIGHT + 30, speed = 115): FolderWallShape {
  const edgeMargin = FOLDER_SPACING * 1.5 + gapWidth / 2;
  const gapCenter = edgeMargin + clamp(gapPosition, 0, 1) * (width - edgeMargin * 2);
  const gapStart = gapCenter - gapWidth / 2;
  const gapEnd = gapCenter + gapWidth / 2;
  const orbs: FolderOrb[] = [];
  for (let x = FOLDER_SPACING / 2; x < width; x += FOLDER_SPACING) {
    if (x > gapStart - FOLDER_SPACING / 2 && x < gapEnd + FOLDER_SPACING / 2) continue;
    orbs.push({ kind: 'folder', x, y, vx: 0, vy: -speed, radius: FOLDER_RADIUS, alive: true, grazed: false });
  }
  return { orbs, gapStart, gapEnd };
}

type FolderWallState = { gapStart: number; gapEnd: number; evaluated: boolean; orbs: FolderOrb[] };

export type SkillOrb = { kind: 'skill'; x: number; y: number; radius: number; alive: boolean; pulse: number };
export type LeaveSlip = { kind: 'leave'; x: number; y: number; radius: number; alive: boolean; life: number; spin: number };
export type AiPickupKind = 'helper' | 'agent';
export type AiPickup = { kind: AiPickupKind; x: number; y: number; vx: number; vy: number; radius: number; alive: boolean; life: number; phase: number };
export type Bullet = MessageBullet | RequirementBullet | FolderOrb;

export class GameModel {
  random: RandomSource;
  width = FIELD_WIDTH;
  height = FIELD_HEIGHT;
  player = { x: FIELD_WIDTH / 2, y: PLAYER_START_Y, radius: PLAYER_RADIUS };
  playerFacing: PlayerFacing = -1;
  bullets: Bullet[] = [];
  skillOrbs: SkillOrb[] = [];
  leaveSlips: LeaveSlip[] = [];
  aiPickups: AiPickup[] = [];
  private walls: FolderWallState[] = [];
  get folderWalls(): ReadonlyArray<FolderWallState> { return this.walls; }
  bulletPool: FolderOrb[] = [];
  events: GameEvent[] = [];
  elapsed = 0;
  wave = 1;
  waveState: 'running' = 'running';
  waveTimer = 0;
  waveNoHit = true;
  cleanWaveStreak = 0;
  lastWaveBonus = 0;
  realtimeScore = 0;
  bonusScore = 0;
  score = 0;
  combo = 0;
  maxCombo = 0;
  comboTimer = 0;
  private comboTail = 0;
  grazeCooldown = 0;
  gapClears = 0;
  breakLocks = 0;
  leaveSlipCount = 0;
  leaveSlipFlash = 0;
  gradeCount = 0;
  bestGrade: Grade | null = null;
  private breakBurst: number[] = [];
  private breakBurstTier = 0;
  private gapChain: number[] = [];
  private gapChainTier = 0;
  private grazeGradeTier = 0;
  energy = 0;
  workload = 0;
  shieldTime = 0;
  private shieldBlockCooldown = 0;
  invulnerableTime = 0;
  gameOver = false;
  started = false;
  paused = false;
  practiceProtected = false;
  practicePhase: 'dodge' | 'fish' | 'shield' | 'agent' = 'dodge';
  private practiceResolved = false;
  private practiceOrigin: Point = { x: 360, y: 360 };
  messageTimer = 0.6;
  requirementTimer = 2.3;
  wallTimer = 4;
  skillTimer = 2.5;
  private leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
  private aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
  private evilLaughCooldown = 0;
  private lastGapPosition: number | null = null;

  constructor(random: RandomSource = Math.random) { this.random = random; }

  get config(): WaveConfig { return waveConfigFor(this.wave, this.waveTimer); }
  get hardElapsed() { return this.wave < 3 ? 0 : (this.wave - 3) * 60 + this.waveTimer; }
  get difficultyTier() { return this.wave < 3 ? 0 : hardTierFor(this.hardElapsed); }
  get pressureBreathing() {
    if (this.wave < 3) return false;
    const position = hardTierPositionFor(this.hardElapsed);
    return position.elapsed >= position.duration - HARD_BREATH_SECONDS;
  }

  get comboMultiplier() { return comboMultiplierFor(this.combo); }

  stats(): RunStats {
    return {
      elapsed: this.elapsed,
      score: this.score,
      wave: this.wave,
      maxCombo: this.maxCombo,
      gapClears: this.gapClears,
      breakLocks: this.breakLocks,
      leaveSlips: this.leaveSlipCount,
      gradeCount: this.gradeCount,
      bestGrade: this.bestGrade,
    };
  }

  takeEvents(): GameEvent[] {
    const drained = this.events.slice();
    this.events.length = 0;
    return drained;
  }

  private pushEvent(event: GameEvent) {
    if (this.events.length < MAX_EVENTS) this.events.push(event);
  }

  private syncScore() { this.score = Math.floor(this.realtimeScore) + this.bonusScore; }

  addEnergy(value: number) { if (Number.isFinite(value)) this.energy = clamp(this.energy + value, 0, 100); }

  activateShield() {
    if (this.gameOver || this.paused || this.energy < 100 || this.shieldTime > 0) return false;
    this.energy = 0; this.shieldTime = SHIELD_DURATION;
    this.pushEvent({ type: 'shield' });
    return true;
  }

  hitPlayer() {
    if (this.gameOver || this.paused || this.practiceProtected || this.shieldTime > 0 || this.invulnerableTime > 0) return false;
    this.workload += 1; this.invulnerableTime = 1;
    this.waveNoHit = false;
    this.combo = 0; this.comboTimer = 0; this.comboTail = 0; this.grazeGradeTier = 0;
    this.pushEvent({ type: 'hit', x: this.player.x, y: this.player.y, workload: this.workload });
    if (this.workload >= 3) this.gameOver = true;
    return true;
  }

  movePlayer(x: number, y: number) {
    if (this.paused || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const nextX = clamp(x, PLAYER_EDGE_MARGIN, this.width - PLAYER_EDGE_MARGIN);
    const dx = nextX - this.player.x;
    if (dx !== 0) this.playerFacing = dx > 0 ? 1 : -1;
    this.player.x = nextX;
    this.player.y = clamp(y, 90, playerMovementTop(this.height, this.player.radius));
  }

  /** Signed circle-to-capsule separation; one geometry for damage, pickups and near misses. */
  playerClearance(target: Point & { radius: number }) {
    const x = this.player.x + PLAYER_BODY.offsetX * playerMirrorSign(this.playerFacing);
    const y = clamp(target.y, this.player.y + PLAYER_BODY.bottom, this.player.y + PLAYER_BODY.top);
    return Math.hypot(target.x - x, target.y - y) - this.player.radius - target.radius;
  }

  private startNextWave() {
    this.wave += 1; this.waveTimer = 0; this.waveNoHit = true; this.waveState = 'running';
    const config = this.config;
    // Keep existing threats moving, stagger the first new arrivals instead of dumping a volley.
    this.messageTimer = config.messages ? 3.4 : 1.2;
    this.requirementTimer = 1.0;
    this.wallTimer = config.messages ? 5.0 : 2.5;
  }

  reset() {
    this.bullets.length = 0; this.skillOrbs.length = 0; this.leaveSlips.length = this.aiPickups.length = 0;
    this.walls.length = 0; this.events.length = 0;
    this.elapsed = 0; this.score = 0; this.realtimeScore = 0; this.bonusScore = 0;
    this.energy = 0; this.workload = 0; this.shieldTime = 0; this.invulnerableTime = 0;
    this.shieldBlockCooldown = 0;
    this.gameOver = false; this.started = true; this.paused = false; this.practiceProtected = false;
    this.practicePhase = 'dodge'; this.practiceResolved = false;
    this.player.x = this.width / 2; this.player.y = PLAYER_START_Y * this.height / FIELD_HEIGHT;
    this.playerFacing = -1;
    this.wave = 1; this.waveState = 'running'; this.waveTimer = 0; this.waveNoHit = true;
    this.cleanWaveStreak = 0; this.lastWaveBonus = 0;
    this.combo = 0; this.maxCombo = 0; this.comboTimer = 0; this.comboTail = 0; this.grazeCooldown = 0;
    this.gapClears = 0; this.breakLocks = 0; this.leaveSlipCount = 0; this.leaveSlipFlash = 0;
    this.gradeCount = 0; this.bestGrade = null; this.breakBurst.length = 0; this.breakBurstTier = 0;
    this.gapChain.length = 0; this.gapChainTier = 0; this.grazeGradeTier = 0;
    this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
    this.aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
    this.evilLaughCooldown = 0;
    this.lastGapPosition = null;
    const config = this.config;
    this.messageTimer = Math.min(0.6, config.messageInterval || 0.85);
    this.requirementTimer = Math.min(1.6, config.requirementInterval || 2.3);
    this.wallTimer = Math.min(2, config.wallInterval || 4);
    this.skillTimer = 1.8;
    this.spawnOpeningVolley();
  }

  /** A nearby, predictable volley. Resources appear only after their preceding lesson. */
  setupPractice() {
    this.practiceProtected = true;
    this.practicePhase = 'dodge'; this.practiceResolved = false;
    this.energy = 80; this.workload = 2; this.shieldTime = this.invulnerableTime = 0;
    this.player.x = this.width / 2; this.player.y = PLAYER_START_Y * this.height / FIELD_HEIGHT;
    this.practiceOrigin = { ...this.player };
    this.bullets.length = this.skillOrbs.length = this.leaveSlips.length = this.aiPickups.length = this.walls.length = this.events.length = 0;
    for (let i = 0; i < 3; i++) {
      this.bullets.push(createRequirement(this.player.x + (i - 1) * 90,
        this.player.y + 195 + (i % 2) * 30, 0, -90, this.random));
    }
  }

  startPracticeFish() {
    this.practicePhase = 'fish'; this.bullets.length = 0;
    this.skillOrbs.push({ kind: 'skill', x: this.player.x < this.width / 2 ? this.width * 0.65 : this.width * 0.35,
      y: clamp(this.player.y + 230, 330, playerMovementTop(this.height, this.player.radius) - 120), radius: 17, alive: true, pulse: 0 });
  }

  startPracticeImmunity() {
    this.practicePhase = 'shield'; this.bullets.length = 0;
    // A harmless contact during immunity makes its effect visible.
    this.bullets.push(createRequirement(this.player.x, this.player.y + 100, 0, -70, this.random));
  }

  startPracticeAgent() {
    this.practicePhase = 'agent'; this.bullets.length = this.aiPickups.length = 0;
    const fromLeft = this.player.x >= this.width / 2;
    const pickup: AiPickup = { kind: 'agent', x: fromLeft ? -48 : this.width + 48,
      y: clamp(this.player.y + 150, 310, playerMovementTop(this.height, this.player.radius) - 110),
      vx: fromLeft ? 110 : -110, vy: 0, radius: 27, alive: true, life: Infinity, phase: 0 };
    this.aiPickups.push(pickup);
    this.pushEvent({ type: 'ai-spawn', kind: 'agent', x: pickup.x, y: pickup.y });
  }

  /** 简单波开局齐射：开局直接放 3 颗紫弹进场，避免开局几秒场上太空。 */
  private spawnOpeningVolley() {
    const speed = 125 * this.config.speedScale;
    for (let index = 0; index < 3; index += 1) {
      const fromLeft = index % 2 === 0;
      this.bullets.push(createRequirement(
        fromLeft ? -25 : this.width + 25,
        clamp(this.player.y - 160 + index * 160 + this.random() * 80, 160, this.height - HUD_SAFE_HEIGHT - 90),
        fromLeft ? speed : -speed,
        (this.random() - 0.5) * 80,
        this.random));
    }
  }

  update(dt: number) {
    if (!this.started || this.gameOver || this.paused || !Number.isFinite(dt)) return;
    dt = clamp(dt, 0, 0.05);
    this.leaveSlipFlash = Math.max(0, this.leaveSlipFlash - dt);

    const previousTier = this.difficultyTier;
    if (!this.practiceProtected) { this.elapsed += dt; this.waveTimer += dt; }
    const config = this.config;
    this.shieldTime = Math.max(0, this.shieldTime - dt);
    if (this.shieldTime < 1e-6) this.shieldTime = 0;
    this.shieldBlockCooldown = Math.max(0, this.shieldBlockCooldown - dt);
    this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
    this.evilLaughCooldown = Math.max(0, this.evilLaughCooldown - dt);
    this.grazeCooldown = Math.max(0, this.grazeCooldown - dt);
    if (!this.practiceProtected) this.realtimeScore += dt * 10 * waveMultiplierFor(this.wave) * this.comboMultiplier;
    this.updateCombo(dt);
    this.syncScore();

    if (!this.practiceProtected) this.spawn(dt, config);

    let homingCount = 0;
    for (const bullet of this.bullets) if (bullet.alive && bullet.kind === 'message' && bullet.state === 'homing') homingCount += 1;
    for (const bullet of this.bullets) {
      let event: 'lock-lost' | null = null;
      if (bullet.kind === 'message') {
        const wasHoming = bullet.state === 'homing';
        event = bullet.update(dt, this.player, homingCount < config.maxHoming);
        if (!wasHoming && bullet.state === 'homing') homingCount += 1;
        if (wasHoming && bullet.state === 'cruise') homingCount -= 1;
      }
      else if (bullet.kind === 'requirement' && !this.practiceProtected) bullet.update(dt);
      else { bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; }

      const clearance = this.playerClearance(bullet);
      if (clearance <= 0) {
        if (this.shieldTime > 0) {
          if (this.shieldBlockCooldown <= 0) {
            this.shieldBlockCooldown = 0.22;
            this.pushEvent({ type: 'shield-block', x: bullet.x, y: bullet.y });
          }
        } else if (this.practiceProtected) {
          if (this.practicePhase === 'dodge' && !this.practiceResolved) {
            this.practiceResolved = true; this.workload = 3;
            this.invulnerableTime = 0.75;
            this.pushEvent({ type: 'hit', x: this.player.x, y: this.player.y, workload: 3 });
            this.pushEvent({ type: 'practice-hit', x: this.player.x, y: this.player.y });
          }
        } else if (this.hitPlayer()) bullet.alive = false;
      } else if (!this.practiceProtected && clearance <= GRAZE_CLEARANCE) {
        this.tryGraze(bullet);
      }

      if (this.gameOver) { this.recycleDead(); return; }

      if (!this.practiceProtected && event === 'lock-lost' && this.shieldTime <= 0) {
        const value = Math.round(30 * this.comboMultiplier);
        this.bonusScore += value; this.breakLocks += 1; this.syncScore();
        this.pushEvent({ type: 'break', x: bullet.x, y: bullet.y, value });
        this.evaluateBurst('break', bullet.x, bullet.y);
      }

      if (bullet.x < -90 || bullet.x > this.width + 90 || bullet.y < -90 || bullet.y > this.height + 90) bullet.alive = false;
    }

    if (this.practiceProtected && this.practicePhase === 'dodge' && !this.practiceResolved &&
        this.bullets.length === 3 && this.bullets.every(b => b.y < this.practiceOrigin.y - 70) &&
        Math.hypot(this.player.x - this.practiceOrigin.x, this.player.y - this.practiceOrigin.y) >= 80) {
      this.practiceResolved = true; this.bullets.length = 0;
      this.pushEvent({ type: 'practice-dodged', x: this.player.x, y: this.player.y });
    }

    this.updateWalls();

    for (const orb of this.skillOrbs) {
      orb.pulse += dt;
      if ((!this.practiceProtected || this.practicePhase === 'fish') && this.shieldTime <= 0 && this.playerClearance(orb) <= 0) {
        const previousEnergy = this.energy;
        this.addEnergy(20); orb.alive = false;
        this.pushEvent({ type: 'pickup', x: orb.x, y: orb.y, energy: this.energy, gained: this.energy - previousEnergy });
      }
    }

    if (!this.practiceProtected) this.updateLeaveSlips(dt);
    this.updateAiPickups(dt);

    this.recycleDead();

    // All waves continue immediately, preserving live objects and skill timers.
    if (!this.gameOver && this.waveTimer >= config.duration) {
      if (config.phase === 'hard') {
        this.stepHardWave();
      } else {
        this.completeWave();
      }
    }
    if (!this.gameOver && !this.practiceProtected && previousTier > 0 && this.difficultyTier > previousTier) {
      this.pushEvent({ type: 'difficulty-step', tier: this.difficultyTier });
    }
  }

  private updateCombo(dt: number) {
    if (this.combo <= 0) return;
    if (this.comboTimer > 0) this.comboTimer -= dt;
    else {
      this.comboTail += dt;
      while (this.comboTail >= 0.5 && this.combo > 0) { this.combo -= 1; this.comboTail -= 0.5; }
      if (this.combo <= 0) this.grazeGradeTier = 0;
    }
  }

  private tryGraze(bullet: Bullet) {
    if (bullet.grazed || this.grazeCooldown > 0 || this.shieldTime > 0) return;
    bullet.grazed = true;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.grazeCooldown = GRAZE_COOLDOWN;
    this.comboTimer = 3;
    this.comboTail = 0;
    this.pushEvent({ type: 'graze', x: this.player.x, y: this.player.y });
    this.evaluateGraze();
  }

  /** 连续达成困难操作时即时评级：窗口内达到 2/3/4 次 → B/A/S，每个等级只奖励一次。 */
  private evaluateBurst(kind: 'break' | 'gap', x: number, y: number) {
    const spec = kind === 'break' ? BREAK_BURST : GAP_CHAIN;
    const list = kind === 'break' ? this.breakBurst : this.gapChain;
    list.push(this.elapsed);
    while (list.length > 0 && this.elapsed - list[0] > spec.window) list.shift();
    const count = list.length;
    const tier = count >= spec.s ? 3 : count >= spec.a ? 2 : count >= spec.b ? 1 : 0;
    const given = kind === 'break' ? this.breakBurstTier : this.gapChainTier;
    if (tier > given) {
      const grade: Grade = tier === 3 ? 'S' : tier === 2 ? 'A' : 'B';
      if (kind === 'break') this.breakBurstTier = tier; else this.gapChainTier = tier;
      this.awardGrade(grade, kind === 'break' ? '甩脱爆发' : '穿缝连击', count, spec.bonus, x, y);
    } else if (count < spec.b) {
      if (kind === 'break') this.breakBurstTier = 0; else this.gapChainTier = 0;
    }
  }

  /** 擦弹链评级：单条连击链达到 6/10/15 层 → B/A/S。 */
  private evaluateGraze() {
    const tier = this.combo >= GRAZE_GRADE.s ? 3 : this.combo >= GRAZE_GRADE.a ? 2 : this.combo >= GRAZE_GRADE.b ? 1 : 0;
    if (tier <= this.grazeGradeTier) return;
    this.grazeGradeTier = tier;
    const grade: Grade = tier === 3 ? 'S' : tier === 2 ? 'A' : 'B';
    this.awardGrade(grade, '擦弹大师', this.combo, GRAZE_GRADE.bonus, this.player.x, this.player.y);
  }

  private awardGrade(grade: Grade, label: string, count: number, bonus: Record<Grade, number>, x: number, y: number) {
    const value = bonus[grade];
    this.bonusScore += value; this.syncScore();
    this.gradeCount += 1;
    if (!this.bestGrade || GRADE_RANK[grade] > GRADE_RANK[this.bestGrade]) this.bestGrade = grade;
    this.pushEvent({ type: 'grade', grade, label, count, value, x, y });
  }

  private countThreats() {
    let count = 0;
    for (const bullet of this.bullets) if (bullet.kind !== 'folder') count += 1;
    return count;
  }

  private countRequirements() {
    let count = 0;
    for (const bullet of this.bullets) if (bullet.kind === 'requirement') count += 1;
    return count;
  }

  private spawn(dt: number, config: WaveConfig) {
    if (this.waveState !== 'running') return;
    // 每轮末尾放慢新弹幕；现有弹幕、角色和拾取物继续正常更新。
    const spawnDt = this.pressureBreathing ? dt / 2.5 : dt;
    if (config.messages) {
      this.messageTimer -= spawnDt;
      if (this.messageTimer <= 0) {
        const reserved = Math.max(0, REQUIREMENT_FLOOR - this.countRequirements());
        if (this.countThreats() < config.maxThreats - reserved) {
          const x = 40 + this.random() * (this.width - 80);
          const speed = 145 * config.speedScale;
          const dir = normalize(this.player.x - x + (this.random() - 0.5) * 280, this.player.y - this.height);
          const message = createMessage(x, this.height + TOP_SPAWN_MARGIN, dir.x * speed, dir.y * speed);
          this.bullets.push(message);
          if (this.evilLaughCooldown <= 0 && this.random() < 0.35) {
            message.tauntTime = 0.9;
            this.evilLaughCooldown = 12 + this.random() * 12;
            this.pushEvent({ type: 'evil-laugh', x: message.x, y: message.y });
          }
        }
        this.messageTimer = config.messageInterval;
      }
    }
    if (config.requirements) {
      this.requirementTimer -= spawnDt;
      if (this.requirementTimer <= 0) {
        if (this.countThreats() < config.maxThreats) {
          const fromLeft = this.random() < 0.5;
          const speed = 125 * config.speedScale;
          const x = fromLeft ? -25 : this.width + 25;
          const directed = this.random() < 0.5;
          let y = directed ? this.player.y + (this.random() - 0.5) * 280
            : 130 + this.random() * (this.height - HUD_SAFE_HEIGHT - 220);
          y = clamp(y, 130, this.height - HUD_SAFE_HEIGHT - 90);
          if (Math.hypot(x - this.player.x, y - this.player.y) < 240) {
            y = clamp(this.player.y + (this.player.y < this.height / 2 ? 260 : -260), 130, this.height - HUD_SAFE_HEIGHT - 90);
          }
          const direction = directed ? normalize(this.player.x - x, this.player.y - y + (this.random() - 0.5) * 120)
            : normalize(fromLeft ? 1 : -1, (this.random() - 0.5) * 0.8);
          const requirement = createRequirement(x, y, direction.x * speed, direction.y * speed, this.random);
          if (directed) requirement.turnTimer = Math.max(requirement.turnTimer, Math.min(3, Math.hypot(x - this.player.x, y - this.player.y) / speed));
          this.bullets.push(requirement);
        }
        this.requirementTimer = config.requirementInterval;
      }
    }
    if (config.walls) {
      // 无预警：计时到点直接生成文件夹墙（不做边缘预告）
      if (this.wallTimer > 0) this.wallTimer -= this.pressureBreathing ? 0 : dt;
      else if (!this.pressureBreathing && this.walls.length < 2) {
        this.spawnWall(config);
        this.wallTimer = config.wallInterval;
      }
    }
    this.skillTimer -= dt;
    if (this.skillTimer <= 0 && this.skillOrbs.length < 3) {
      let x = 0, y = 0;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const angle = this.random() * Math.PI * 2;
        const reach = 150 + this.random() * 90;
        x = clamp(this.player.x + Math.cos(angle) * reach, 70, this.width - 70);
        y = clamp(this.player.y + Math.sin(angle) * reach, 170, this.height - HUD_SAFE_HEIGHT - 70);
        if (distanceSquared({ x, y }, this.player) >= 100 ** 2) break;
        x = clamp(this.player.x + (this.player.x < this.width / 2 ? 180 : -180), 70, this.width - 70);
      }
      this.skillOrbs.push({ kind: 'skill', x, y,
        radius: 17, alive: true, pulse: 0 });
      this.skillTimer = 4.0;
    }
  }

  private spawnWall(config: WaveConfig) {
    let gapPosition = 0.1 + this.random() * 0.8;
    if (this.lastGapPosition !== null) {
      const maxShift = 0.3;
      gapPosition = clamp(gapPosition, this.lastGapPosition - maxShift, this.lastGapPosition + maxShift);
    }
    this.lastGapPosition = gapPosition;
    const wall = createFolderWall(this.width, gapPosition, config.gapWidth, this.height + TOP_SPAWN_MARGIN, 115 * config.speedScale);
    const state: FolderWallState = { gapStart: wall.gapStart, gapEnd: wall.gapEnd, evaluated: false, orbs: [] };
    for (const created of wall.orbs) {
      const orb = this.bulletPool.pop();
      if (orb) {
        Object.assign(orb, created);
        orb.grazed = false;
        this.bullets.push(orb);
        state.orbs.push(orb);
      } else {
        this.bullets.push(created);
        state.orbs.push(created);
      }
    }
    this.walls.push(state);
  }

  /** 文件夹墙越过玩家所在行时结算「极限穿缝」：贴着文件夹边缘蹭过才有奖励（与碰撞判定同一把尺）。 */
  private updateWalls() {
    for (let i = this.walls.length - 1; i >= 0; i--) {
      const wall = this.walls[i];
      const aliveOrbs = wall.orbs.filter((orb) => orb.alive);
      if (aliveOrbs.length === 0) { this.walls.splice(i, 1); continue; }
      const rowY = aliveOrbs[0].y;
      if (!wall.evaluated && rowY <= this.player.y + PLAYER_BODY.bottom) {
        wall.evaluated = true;
        if (this.shieldTime <= 0) {
          // 贴文件夹穿缝：按玩家边缘与最近文件夹边缘的余量计距，任何对齐下都可无伤达成
          let clearance = Infinity;
          for (const orb of aliveOrbs) {
            const edgeDistance = this.playerClearance(orb);
            if (edgeDistance < clearance) clearance = edgeDistance;
          }
          if (clearance > 0 && clearance <= GAP_CLEAR_DISTANCE) {
            const value = Math.round(50 * this.comboMultiplier);
            this.bonusScore += value; this.gapClears += 1; this.syncScore();
            this.pushEvent({ type: 'gap', x: this.player.x, y: this.player.y, value });
            this.evaluateBurst('gap', this.player.x, this.player.y);
          }
        }
      }
    }
  }

  private updateLeaveSlips(dt: number) {
    for (const slip of this.leaveSlips) {
      if (!slip.alive) continue;
      slip.life -= dt; slip.spin += dt;
      if (slip.life <= 0) { slip.alive = false; continue; }
      if (this.playerClearance(slip) <= 0) {
        slip.alive = false;
        this.claimLeaveSlip(slip);
      }
    }
    if (this.leaveSlips.length === 0) {
      this.leaveSlipRollTimer -= dt;
      if (this.leaveSlipRollTimer <= 0) {
        this.leaveSlipRollTimer = LEAVE_SLIP_ROLL_INTERVAL;
        if (this.random() < LEAVE_SLIP_CHANCE) this.spawnLeaveSlip();
      }
    }
  }

  private updateAiPickups(dt: number) {
    if (this.practiceProtected && (this.practicePhase !== 'agent' || this.shieldTime > 0)) {
      for (const pickup of this.aiPickups) pickup.phase += dt;
      return;
    }
    // Healing has no purpose at zero workload. A two-slot agent must also leave
    // immediately if the player now has only one slot to clear.
    if (this.workload <= 0) {
      this.aiPickups.length = 0;
      this.aiPickupRollTimer = Math.min(this.aiPickupRollTimer, 8);
      return;
    }
    const upper = playerMovementTop(this.height, this.player.radius) - 60;
    for (const pickup of this.aiPickups) {
      if (!pickup.alive) continue;
      if (pickup.kind === 'agent' && this.workload < 2) { pickup.alive = false; continue; }
      pickup.life -= dt;
      pickup.phase += dt;
      if (pickup.life <= 0) { pickup.alive = false; continue; }
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      if (this.practiceProtected) {
        const parkX = pickup.vx > 0 ? this.width * 0.28 : this.width * 0.72;
        if (pickup.vx > 0 && pickup.x >= parkX || pickup.vx < 0 && pickup.x <= parkX) {
          pickup.x = parkX; pickup.vx = 0;
        }
      } else if (pickup.x < 65 || pickup.x > this.width - 65) {
        pickup.x = clamp(pickup.x, 65, this.width - 65); pickup.vx = pickup.x === 65 ? Math.abs(pickup.vx) : -Math.abs(pickup.vx);
      }
      if (pickup.y < 165 || pickup.y > upper) {
        pickup.y = clamp(pickup.y, 165, upper); pickup.vy = pickup.y === 165 ? Math.abs(pickup.vy) : -Math.abs(pickup.vy);
      }
      if (this.playerClearance(pickup) <= 0) {
        pickup.alive = false;
        const removed = Math.min(this.workload, pickup.kind === 'agent' ? 2 : 1);
        this.workload -= removed;
        this.pushEvent({ type: 'ai-pickup', kind: pickup.kind, x: pickup.x, y: pickup.y, removed, workload: this.workload });
      }
    }
    if (this.practiceProtected || this.aiPickups.some((pickup) => pickup.alive)) return;
    this.aiPickupRollTimer -= dt;
    if (this.aiPickupRollTimer > 0) return;
    this.aiPickupRollTimer = AI_PICKUP_ROLL_INTERVAL;
    if (this.random() >= AI_PICKUP_CHANCE) return;
    this.spawnAiPickup();
  }

  private spawnAiPickup() {
    const kind: AiPickupKind = this.workload >= 2 && this.random() < AI_AGENT_CHANCE_AT_TWO ? 'agent' : 'helper';
    const speed = AI_PICKUP_SPEED[kind];
    let x = 75 + this.random() * (this.width - 150);
    let y = 180 + this.random() * Math.max(1, playerMovementTop(this.height, this.player.radius) - 270);
    for (let attempt = 0; attempt < 8 && distanceSquared({ x, y }, this.player) < 170 ** 2; attempt += 1) {
      x = 75 + this.random() * (this.width - 150);
      y = 180 + this.random() * Math.max(1, playerMovementTop(this.height, this.player.radius) - 270);
    }
    const direction = this.random() * Math.PI * 2;
    this.aiPickups.push({ kind, x, y, vx: Math.cos(direction) * speed, vy: Math.sin(direction) * speed,
      radius: 27, alive: true, life: kind === 'agent' ? 8 : 11, phase: this.random() * Math.PI * 2 });
    this.pushEvent({ type: 'ai-spawn', kind, x, y });
  }

  private spawnLeaveSlip() {
    let x = 70 + this.random() * (this.width - 140);
    let y = 170 + this.random() * 900;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const farFromPlayer = distanceSquared({ x, y }, this.player) >= 150 ** 2;
      const farFromOrbs = this.skillOrbs.every((orb) => distanceSquared({ x, y }, orb) >= 120 ** 2);
      if (farFromPlayer && farFromOrbs) break;
      x = 70 + this.random() * (this.width - 140);
      y = 170 + this.random() * 900;
    }
    this.leaveSlips.push({ kind: 'leave', x, y, radius: 16, alive: true, life: LEAVE_SLIP_LIFETIME, spin: 0 });
    this.pushEvent({ type: 'leave-spawn', x, y });
  }

  /** 拾取请假条：立即清空场上弹幕（每条被清掉的弹幕 +10 分，含文件夹方块），并附加 1 秒无敌。 */
  private claimLeaveSlip(slip: LeaveSlip) {
    this.leaveSlipCount += 1;
    this.leaveSlipFlash = 1.4;
    let cleared = 0;
    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;
      cleared += 1;
      bullet.alive = false;
    }
    const value = cleared * LEAVE_SLIP_CLEAR_VALUE;
    this.bonusScore += value; this.syncScore();
    this.walls.length = 0;
    this.invulnerableTime = Math.max(this.invulnerableTime, LEAVE_SLIP_INVULNERABLE);
    this.pushEvent({ type: 'leave', x: slip.x, y: slip.y, count: cleared, value });
  }

  private completeWave() {
    const config = this.config;
    const bonus = config.phase === 'simple' ? 60 : config.phase === 'normal' ? 120 : 200;
    this.bonusScore += bonus;
    if (this.waveNoHit) {
      this.bonusScore += 150 + Math.min(200, 50 * this.cleanWaveStreak);
      this.cleanWaveStreak += 1;
    } else this.cleanWaveStreak = 0;
    this.lastWaveBonus = bonus;
    this.syncScore();
    this.pushEvent({ type: 'wave-clear', wave: this.wave, bonus, noHit: this.waveNoHit });
    this.startNextWave();
  }

  /** 每 60 秒结算一次困难波次奖励，压力升档独立计时。 */
  private stepHardWave() {
    const noHit = this.waveNoHit;
    const noHitBonus = noHit ? 150 + Math.min(200, 50 * this.cleanWaveStreak) : 0;
    this.cleanWaveStreak = noHit ? this.cleanWaveStreak + 1 : 0;
    const value = 200 + noHitBonus;
    this.bonusScore += value;
    this.lastWaveBonus = value;
    this.waveNoHit = true;
    this.wave += 1;
    this.waveTimer = 0;
    this.syncScore();
    this.pushEvent({ type: 'hard-step', wave: this.wave, value });
  }

  private recycleDead() {
    let write = 0;
    for (const bullet of this.bullets) {
      if (bullet.alive) this.bullets[write++] = bullet;
      else if (bullet.kind === 'folder' && this.bulletPool.length < 64) this.bulletPool.push(bullet);
    }
    this.bullets.length = write;
    write = 0;
    for (const orb of this.skillOrbs) if (orb.alive) this.skillOrbs[write++] = orb;
    this.skillOrbs.length = write;
    write = 0;
    for (const slip of this.leaveSlips) if (slip.alive) this.leaveSlips[write++] = slip;
    this.leaveSlips.length = write;
    write = 0;
    for (const pickup of this.aiPickups) if (pickup.alive) this.aiPickups[write++] = pickup;
    this.aiPickups.length = write;
  }
}
