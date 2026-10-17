import type { RunStats } from './GameModel.ts';
import { HARD_START_SECONDS, rankFor, SIMPLE_WAVE_SECONDS } from './GameModel.ts';

export const PROGRESS_KEY = 'off-work.progress.v1';
export const TUTORIAL_REVISION = 6;
export const TUTORIAL_COPY = {
  introTitle: '摸鱼练习',
  introSubtitle: '在正式摸鱼之前先来熟悉一下基础操作吧',
  practice: '开始练习',
  completeTitle: '练习完成',
  completeSubtitle: '成功降低 2 格工作负荷！\n躲弹幕、拾小鱼，满盾双击免疫。',
  success: 'GOOD!',
  dodgeSuccess: '躲得漂亮！',
  shieldSuccess: '太棒啦！',
  agentSuccess: '你学会啦！',
  start: '开始摸鱼！',
};
/** Resume only on visible frames; ignore long background gaps. Gameplay stays paused until completion. */
export class ResumeCountdown {
  remaining = 0;
  get active() { return this.remaining > 0; }
  start() { this.remaining = 3; }
  cancel() { this.remaining = 0; }
  advance(dt: number, visible = true) {
    if (!this.active || !visible || !Number.isFinite(dt) || dt <= 0) return false;
    this.remaining = Math.max(0, this.remaining - Math.min(dt, 0.1));
    return !this.active;
  }
}
export type PlayerProgress = {
  version: 1; tutorialCompleted: boolean; tutorialRevision: number; shieldHintSeen: boolean; soundEnabled: boolean;
  bestScore: number; bestSeconds: number; bestWave: number; runs: number;
};
export const freshProgress = (): PlayerProgress => ({
  version: 1, tutorialCompleted: false, tutorialRevision: 0, shieldHintSeen: false, soundEnabled: true,
  bestScore: 0, bestSeconds: 0, bestWave: 0, runs: 0,
});
export function readProgress(raw: string | null): PlayerProgress {
  const clean = freshProgress();
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1) return clean;
    for (const key of ['bestScore', 'bestSeconds', 'bestWave', 'runs'] as const) {
      const valid = key === 'bestSeconds' ? Number.isFinite(value[key]) : Number.isSafeInteger(value[key]);
      if (typeof value[key] === 'number' && valid && value[key] >= 0) clean[key] = value[key];
    }
    clean.tutorialCompleted = value.tutorialCompleted === true;
    clean.tutorialRevision = clean.tutorialCompleted && Number.isInteger(value.tutorialRevision)
      ? Math.max(0, Math.min(TUTORIAL_REVISION, value.tutorialRevision)) : 0;
    clean.shieldHintSeen = value.shieldHintSeen === true && clean.tutorialRevision === TUTORIAL_REVISION;
    clean.soundEnabled = value.soundEnabled !== false;
  } catch { /* Broken or unavailable storage must never block play. */ }
  return clean;
}

export type GuideStep = 'off' | 'intro' | 'practice' | 'practice-retry' | 'dodge-reward' | 'fish' | 'collect-reward' | 'shield' | 'shield-reward' | 'shield-active' | 'agent' | 'agent-reward' | 'ready';
export class TutorialGuide {
  step: GuideStep = 'off';
  fish = 0;
  lowered = 0;
  dodged = false;
  retryRemaining = 0;
  rewardRemaining = 0;
  get active() { return this.step !== 'off'; }
  get introducing() { return this.step === 'intro'; }
  get ready() { return this.step === 'ready'; }
  get rewarding() { return this.step === 'dodge-reward' || this.step === 'collect-reward' || this.step === 'shield-reward' || this.step === 'agent-reward'; }
  get playing() { return ['practice', 'fish', 'shield', 'shield-reward', 'shield-active', 'agent'].includes(this.step); }
  get feedback() { return this.step === 'dodge-reward' ? TUTORIAL_COPY.dodgeSuccess : this.step === 'collect-reward' ? TUTORIAL_COPY.success : this.step === 'shield-reward' ? TUTORIAL_COPY.shieldSuccess : TUTORIAL_COPY.agentSuccess; }
  get rewardDuration() { return 1.15; }
  get rewardProgress() { return this.rewarding ? 1 - this.rewardRemaining / this.rewardDuration : 0; }
  start(enabled: boolean) {
    this.step = enabled ? 'intro' : 'off'; this.fish = this.lowered = 0; this.dodged = false;
    this.retryRemaining = this.rewardRemaining = 0;
  }
  beginPractice() {
    if (!this.introducing) return false;
    this.step = 'practice'; return true;
  }
  avoided() {
    if (this.step !== 'practice') return false;
    this.dodged = true; this.step = 'dodge-reward'; this.rewardRemaining = this.rewardDuration; return true;
  }
  hit() {
    if (this.step !== 'practice') return false;
    this.step = 'practice-retry'; this.retryRemaining = 2; return true;
  }
  advance(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    if (this.step === 'practice-retry') {
      this.retryRemaining = Math.max(0, this.retryRemaining - Math.min(seconds, 0.1));
      if (this.retryRemaining > 1e-6) return null;
      this.retryRemaining = 0; this.step = 'practice'; return this.step;
    }
    if (!this.rewarding) return null;
    this.rewardRemaining = Math.max(0, this.rewardRemaining - Math.min(seconds, 0.1));
    if (this.rewardRemaining > 1e-6) return null;
    this.rewardRemaining = 0;
    this.step = this.step === 'dodge-reward' ? 'fish' : this.step === 'collect-reward' ? 'shield' : this.step === 'shield-reward' ? 'shield-active' : 'ready';
    return this.step;
  }
  picked(energy: number) {
    if (this.step !== 'fish' || !this.dodged || !Number.isFinite(energy) || energy < 100) return false;
    this.fish = 1; this.step = 'collect-reward'; this.rewardRemaining = this.rewardDuration; return true;
  }
  activatedShield() {
    if (this.step !== 'shield') return false;
    this.step = 'shield-reward'; this.rewardRemaining = this.rewardDuration; return true;
  }
  pickedAi(kind: string, removed: number) {
    if (this.step !== 'agent' || kind !== 'agent' || removed !== 2) return false;
    this.lowered = removed; this.step = 'agent-reward'; this.rewardRemaining = this.rewardDuration; return true;
  }
  shieldEnded(remaining: number) {
    if (this.step !== 'shield-active' || remaining !== 0) return false;
    this.step = 'agent'; return true;
  }
  skip() { this.step = 'off'; }
  get title() {
    if (this.step === 'practice') return '1/4  拖动躲避';
    if (this.step === 'practice-retry') return '负荷满啦，再试一次';
    if (this.step === 'fish') return '2/4  拾取小鱼';
    if (this.step === 'shield') return '3/4  双击免疫';
    if (this.step === 'shield-active') return '免疫生效中';
    if (this.step === 'agent') return '4/4  拾取 Agent';
    if (this.rewarding) return this.feedback;
    return '';
  }
  get text() {
    if (this.step === 'practice') return '碰到弹幕负荷 +1，满 3 格失败。\n先拖动躲开眼前的弹幕。';
    if (this.step === 'practice-retry') return '碰到弹幕负荷 +1，满 3 格失败。\n练习自动重来，拖动躲开吧。';
    if (this.step === 'fish') return '沿虚线拾鱼，充满最后 1 格护盾。';
    if (this.step === 'shield') return '护盾已满！松手后双击屏幕，\n获得 3 秒免疫。';
    if (this.step === 'shield-active') return '现在碰到弹幕也不会增加负荷。\n等护盾结束，学习减负。';
    if (this.step === 'agent') return '沿虚线拾取 Agent，\n降低 2 格工作负荷。';
    return '';
  }
}

/** Records the first full charge until immunity is used; this tracker does not freeze gameplay or show a banner. */
export class ShieldCoach {
  seen = false;
  remaining = 0;
  reset(seen: boolean) { this.seen = seen; this.remaining = 0; }
  charged(energy: number) {
    if (this.seen || energy < 100) return false;
    this.seen = true; this.remaining = 6; return true;
  }
  released() { this.remaining = 0; }
  advance(_dt: number) { /* Deliberately stays visible until released or reset. */ }
  get active() { return this.remaining > 0; }
}

export type Settlement = {
  score: number; rank: string; newRecord: boolean; firstRun: boolean;
  bestScore: number; previousBest: number; seconds: number; wave: number;
  maxCombo: number; gaps: number; breaks: number; goal: string;
};
export function settleRun(previous: PlayerProgress, stats: RunStats, shieldsUsed: number, energy: number) {
  const profile: PlayerProgress = { ...previous,
    bestScore: Math.max(previous.bestScore, stats.score),
    bestSeconds: Math.max(previous.bestSeconds, stats.elapsed),
    bestWave: Math.max(previous.bestWave, stats.wave), runs: previous.runs + 1,
  };
  let goal: string;
  if (!shieldsUsed) goal = energy >= 100 ? '下一局：双击屏幕开启免疫' : '下一局：集满 5 条小鱼';
  else if (stats.elapsed < SIMPLE_WAVE_SECONDS) goal = `下一局：${Math.max(1, Math.ceil(SIMPLE_WAVE_SECONDS - stats.elapsed))} 秒后进第 2 波`;
  else if (stats.elapsed < HARD_START_SECONDS) goal = `下一局：${Math.max(1, Math.ceil(HARD_START_SECONDS - stats.elapsed))} 秒后进第 3 波`;
  else goal = `下一局：挑战 ${Math.ceil((profile.bestScore + Math.max(100, profile.bestScore * 0.1)) / 100) * 100} 分`;
  const result: Settlement = {
    score: stats.score, rank: rankFor(stats.wave, stats.score, stats.bestGrade ?? null),
    newRecord: stats.score > previous.bestScore, firstRun: previous.runs === 0,
    bestScore: profile.bestScore, previousBest: previous.bestScore, seconds: stats.elapsed,
    wave: stats.wave, maxCombo: stats.maxCombo, gaps: stats.gapClears, breaks: stats.breakLocks, goal,
  };
  return { profile, result };
}
