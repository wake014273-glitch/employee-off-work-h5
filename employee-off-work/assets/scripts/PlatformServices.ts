import { assetManager, AudioClip, AudioSource, director, Director, game, Node, sys } from 'cc';
import { freshProgress, PlayerProgress, PROGRESS_KEY, readProgress, Settlement, settleRun, TUTORIAL_REVISION } from './model/GameExperience';
import type { RunStats } from './model/GameModel';

type StartupLoading = { getProgress(): number; getTarget(): number; freeze?(): void; end(): void };
const startupLoading = (): StartupLoading | undefined => (game as any).__offworkStartup ?? (globalThis as any).__offworkStartup;
let coverDismissScheduled = false;
export function readStartupLoadingProgress() {
  const startup = startupLoading();
  return { value: startup?.getProgress() ?? 0, target: startup?.getTarget() ?? 0 };
}

/** A DOM cover must survive until the Cocos frame behind it has actually drawn. */
export function dismissStartupCover() {
  if (!sys.isBrowser || typeof document === 'undefined' || coverDismissScheduled || !document.getElementById('startup-cover')) return;
  coverDismissScheduled = true;
  startupLoading()?.freeze?.();
  director.once(Director.EVENT_AFTER_DRAW, () => {
    startupLoading()?.end();
    document.getElementById('startup-cover')?.remove();
    coverDismissScheduled = false;
  });
}

/** Hand the WeChat bootstrap poster over after the native loading artwork is drawable. */
export function notifyStartupLoadingReady() {
  if (sys.platform !== sys.Platform.WECHAT_GAME) return;
  game.emit('offwork-loading-frame-ready');
}

/** Platform coordinates are converted once on resize; gameplay never calls wx APIs. */
export function readUiViewport(fallbackWidth: number, fallbackHeight: number) {
  const platform = (globalThis as any).wx;
  let width = fallbackWidth, height = fallbackHeight, top = 0, bottom = 0;
  try {
    const info = platform?.getWindowInfo?.() || platform?.getSystemInfoSync?.();
    if (info?.windowWidth && info?.windowHeight) {
      width = info.windowWidth; height = info.windowHeight;
      top = Math.max(0, info.safeArea?.top || 0);
      bottom = Math.max(0, height - (info.safeArea?.bottom ?? height));
      const capsule = platform.getMenuButtonBoundingClientRect?.();
      if (capsule?.bottom > 0) top = Math.max(top, capsule.bottom + 8);
    } else if (sys.isBrowser && typeof document !== 'undefined') {
      width = globalThis.innerWidth || width; height = globalThis.innerHeight || height;
      const probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)';
      document.body.appendChild(probe); const style = getComputedStyle(probe);
      top = parseFloat(style.paddingTop) || 0; bottom = parseFloat(style.paddingBottom) || 0; probe.remove();
    }
  } catch { /* Fixed-width layout remains usable when optional platform metrics fail. */ }
  return { cssWidth: width, safeTop: top * 720 / Math.max(1, width), safeBottom: bottom * 720 / Math.max(1, width) };
}

/** Cocos-backed local services keep platform APIs outside game rules. */
export class ProgressStore {
  profile = freshProgress();
  constructor() {
    try { this.profile = readProgress(sys.localStorage.getItem(PROGRESS_KEY)); } catch { /* Memory fallback. */ }
  }
  save() { try { sys.localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.profile)); } catch { /* Keep the current session playable. */ } }
  completeTutorial() { this.profile.tutorialCompleted = true; this.profile.tutorialRevision = TUTORIAL_REVISION; this.save(); }
  markShieldHintSeen() { this.profile.shieldHintSeen = true; this.save(); }
  setSound(enabled: boolean) { this.profile.soundEnabled = enabled; this.save(); }
  settle(stats: RunStats, shieldsUsed: number, energy: number): Settlement {
    const settlement = settleRun(this.profile, stats, shieldsUsed, energy);
    this.profile = settlement.profile; this.save(); return settlement.result;
  }
}

/** Only messages and local scores cross this boundary. Friend data stays in the open data context. */
export class FriendLeaderboardService {
  private context: { postMessage(message: object): void } | null = null;
  private bestScore = 0;
  private authorized = false;
  private authorizing = false;
  private pendingView: ((ok: boolean) => void) | null = null;
  constructor() {
    const platform = (globalThis as any).wx;
    if (sys.platform !== sys.Platform.WECHAT_GAME || !platform?.getOpenDataContext) return;
    try { this.context = platform.getOpenDataContext(); } catch { /* Show the unavailable state. */ }
    if (platform.getPrivacySetting) {
      try { platform.getPrivacySetting({ success: (result: { needAuthorization: boolean }) => {
        if (!result.needAuthorization) { this.authorized = true; this.send('sync'); }
      } }); } catch { /* Opening the board can retry authorization. */ }
    } else this.authorized = !platform.requirePrivacyAuthorize;
  }
  get available() { return this.context !== null; }
  sync(score: number) {
    if (!Number.isSafeInteger(score) || score < 0) return;
    this.bestScore = Math.max(this.bestScore, score);
    if (this.authorized) this.send('sync');
  }
  show(done: (ok: boolean) => void): 'opened' | 'pending' | 'unavailable' {
    if (!this.available) return 'unavailable';
    const platform = (globalThis as any).wx;
    if (this.authorized || !platform?.requirePrivacyAuthorize) { done(this.send('show')); return 'opened'; }
    this.pendingView = done;
    if (!this.authorizing) {
      this.authorizing = true;
      const failed = () => {
        this.authorizing = false;
        const callback = this.pendingView; this.pendingView = null; callback?.(false);
      };
      try { platform.requirePrivacyAuthorize({
        success: () => {
          this.authorizing = false; this.authorized = true; this.send('sync');
          const callback = this.pendingView; this.pendingView = null;
          if (callback) callback(this.send('show'));
        },
        fail: failed,
      }); } catch { failed(); }
    }
    return this.authorizing ? 'pending' : 'opened';
  }
  hide() { this.pendingView = null; this.send('hide'); }
  private send(action: string) {
    try { this.context?.postMessage({ type: 'offwork-friends', action, bestScore: this.bestScore }); return this.available; }
    catch { return false; }
  }
  share(): 'opened' | 'unavailable' {
    const platform = (globalThis as any).wx;
    if (!this.available || !platform?.shareAppMessage) return 'unavailable';
    try {
      platform.shareAppMessage({ title: '来玩摸鱼请走位，看看谁的摸鱼积分更高！' });
      return 'opened'; // Opening the sheet is not proof that a share completed.
    } catch { return 'unavailable'; }
  }
}

export const SOUND_NAMES = ['ui', 'pickup', 'ready', 'shield', 'block', 'hit', 'wave', 'result', 'laugh',
  'leave', 'reduce', 'countdown', 'resume', 'grade', 'skill'] as const;
export type SoundName = typeof SOUND_NAMES[number];
export class GameAudio {
  readonly source: AudioSource;
  readonly musicSource: AudioSource;
  readonly clips = new Map<SoundName, AudioClip>();
  private soundEnabled = true;
  private musicActive = false;
  private unlocked = false;
  private musicRunning = false;
  private alive = true;
  private lastPlayed = new Map<SoundName, number>();
  constructor(parent: Node) {
    const node = new Node('GameAudio'); parent.addChild(node);
    this.source = node.addComponent(AudioSource); this.source.playOnAwake = false;
    this.source.volume = 0.55;
    const music = new Node('BackgroundMusic'); parent.addChild(music);
    this.musicSource = music.addComponent(AudioSource);
    this.musicSource.playOnAwake = false; this.musicSource.loop = true;
    this.musicSource.volume = 0.6;
  }
  get enabled() { return this.soundEnabled; }
  set enabled(value: boolean) {
    this.soundEnabled = value;
    if (!value) this.source.stop();
    this.syncMusic();
  }
  load(bundle: NonNullable<ReturnType<typeof assetManager.getBundle>>) {
    // The critical art loader owns subpackage download; sound never starts a second one.
    if (!this.alive) return;
    for (const name of SOUND_NAMES) bundle.load(`audio/${name}`, AudioClip, (clipError, clip) => {
      if (!clipError && clip && this.alive) this.clips.set(name, clip);
    });
    bundle.load('audio/bgm', AudioClip, (clipError, clip) => {
      if (clipError || !clip || !this.alive) return;
      this.musicSource.clip = clip;
      this.syncMusic();
    });
  }
  /** Called from a real touch/key handler; loading alone must not autoplay. */
  unlock() { this.unlocked = true; this.syncMusic(); }
  setMusicActive(active: boolean) { this.musicActive = active; this.syncMusic(); }
  private syncMusic() {
    const shouldPlay = this.alive && this.enabled && this.unlocked && this.musicActive && !!this.musicSource.clip;
    if (shouldPlay === this.musicRunning) return;
    this.musicRunning = shouldPlay;
    if (shouldPlay) this.musicSource.play(); else this.musicSource.pause();
  }
  play(name: SoundName) {
    const clip = this.clips.get(name);
    if (!this.enabled || !clip || !this.alive) return;
    const now = performance.now();
    const cooldown = name === 'pickup' ? 70 : name === 'block' ? 220
      : name === 'skill' || name === 'grade' || name === 'leave' ? 500 : name === 'reduce' ? 240 : 120;
    // A recent rating takes priority over small technique rewards across adjacent frames too.
    if (name === 'skill' && now - (this.lastPlayed.get('grade') ?? -Infinity) < 500) return;
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < cooldown) return;
    this.lastPlayed.set(name, now);
    this.source.playOneShot(clip, name === 'block' ? 0.35 : name === 'hit' ? 0.65 : name === 'laugh' ? 0.5
      : name === 'skill' ? 0.35 : name === 'grade' ? 0.55 : name === 'countdown' ? 0.6
      : name === 'reduce' ? 0.65 : name === 'leave' || name === 'resume' ? 0.7 : 0.85);
  }
  stop() { this.setMusicActive(false); this.source.stop(); }
  destroy() { this.alive = false; this.stop(); }
}
