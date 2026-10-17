import {
  _decorator, assetManager, Canvas, Color, Component, director, Director, EventKeyboard, EventTouch,
  game, Game, Graphics, input, Input, KeyCode, Label, LabelOutline, Mask, Material, EffectAsset, Node, profiler, ResolutionPolicy, Sprite, SpriteFrame, UITransform, Vec3, view,
} from 'cc';
import {
  GameModel, GestureRecognizer, HUD_SAFE_HEIGHT,
} from './model/GameModel';
import type { Point } from './model/GameModel';
import { FinalArtHud, sliceFrame } from './FinalArtHud';
import { containsReferencePoint, DESIGN_HEIGHT, DESIGN_WIDTH, SETTINGS_HIT_BOX, PLAYER_BODY, PLAYER_SCALE, SPRITE_SIZES, viewportLayout, playerMovementTop, playerDragTop, playerMirrorSign } from './model/GameLayout';
import { ResumeCountdown, ShieldCoach, TutorialGuide, Settlement, TUTORIAL_REVISION } from './model/GameExperience';
import { FriendLeaderboardService, GameAudio, ProgressStore, dismissStartupCover, notifyStartupLoadingReady, readStartupLoadingProgress, readUiViewport } from './PlatformServices';
import { GameInterface, MenuAction, MenuMode } from './GameInterface';
import { LoadingProgress, retryLoad } from './model/AsyncLoading';
import { BodySpring } from './model/BodySpring';
import { SpringSprite } from './SpringSprite';
import { PlayerTrail } from './model/PlayerTrail';
import { OFFICE, officeNotice } from './OfficeUi';

const { ccclass } = _decorator;
const W = DESIGN_WIDTH;
const FLOATER_SLOTS = 6;
const ART_PATHS = {
  loadingUI: 'menus/loading/spriteFrame',
  uiPanel: 'menus/office-panel-paper-v3/spriteFrame',
  uiIcons: 'menus/settings-icons-v2/spriteFrame',
  uiButton: 'menus/green-button-v2/spriteFrame',
  homeUI: 'menus/home/spriteFrame',
  resultUI: 'menus/result/spriteFrame',
  tutorialIntroUI: 'menus/tutorial-intro/spriteFrame',
  tutorialCompleteUI: 'menus/tutorial-complete/spriteFrame',
  background: 'background/office-night/spriteFrame',
  message: 'bullets/message/spriteFrame',
  folder: 'bullets/folder/spriteFrame',
  requirement: 'bullets/request-sheet/spriteFrame',
  fish: 'pickups/fish/spriteFrame',
  leave: 'pickups/leave-slip/spriteFrame',
  helper: 'pickups/ai-helper/spriteFrame',
  agent: 'pickups/ai-agent/spriteFrame',
  timeUI: 'hud/time/spriteFrame',
  scoreUI: 'hud/score/spriteFrame',
  workloadUI: 'hud/workload/spriteFrame',
  idleSheet: 'character/approved-idle-sheet/spriteFrame',
  portrait0: 'character/workload-expression-0/spriteFrame',
  portrait1: 'character/workload-expression-1/spriteFrame',
  portrait2: 'character/workload-expression-2/spriteFrame',
};
const IDLE_FRAMES = 50;
const ART_FRAME_COUNT = Object.keys(ART_PATHS).length + IDLE_FRAMES;
// Ignore the supplied PNGs' faint stray pixels outside their visible artwork.
const ART_CROPS: Record<string, [number, number, number, number]> = {
  message: [212, 230, 875, 819],
  folder: [86, 202, 1080, 890],
  requirement: [140, 65, 1065, 1080],
  fish: [50, 62, 1556, 820],
};
// Pupil regions in the approved PNGs, before ART_CROPS. Repaint only the small
// highlight inside each dark eye; the illustrated eye contours and body stay intact.
const EYE_ART = {
  message: { points: [[494, 659, 23, 34], [760, 659, 23, 34]], ink: new Color(62, 14, 52), light: new Color(255, 205, 161) },
  folder: { points: [[483, 731, 25, 36], [796, 731, 25, 36]], ink: new Color(82, 11, 78), light: new Color(255, 236, 151) },
  requirement: { points: [[493, 829, 20, 20], [761, 879, 20, 20]], ink: new Color(56, 11, 69), light: new Color(252, 125, 255) },
};

type Floater = { node: Node; label: Label; base: Color; life: number; maxLife: number; x: number; y: number };
type Spark = { x: number; y: number; life: number };
type Burst = { x: number; y: number; life: number; maxLife: number; radius: number; color: Color };
type PickupFlight = { x: number; y: number; segment: number; life: number };

@ccclass('GameMain')
export class GameMain extends Component {
  // Updated by scripts/build.mjs and checked against the compiled game bundle.
  readonly buildFingerprint = 'source:5f07a47b3b94efe4';
  private fieldHeight = DESIGN_HEIGHT;
  private visualDt = 0;
  private hintPaper!: Graphics;
  private bulletShadows!: Graphics;
  private playerShadow!: Graphics;
  private fishGlow!: Graphics;
  private bulletCues!: Graphics;
  private pickupLight!: Graphics;
  private pickupFlights: PickupFlight[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0, segment: 0, life: 0 }));
  private resume = new ResumeCountdown();
  private appVisible = true;
  private playerHitTime = 0;
  private shieldBlockTime = 0;
  private shieldReleaseTime = 0;
  private shieldBlockAngle = 0;
  private model = new GameModel();
  private progress = new ProgressStore();
  private guide = new TutorialGuide();
  private shieldCoach = new ShieldCoach();
  private audio!: GameAudio;
  private interface!: GameInterface;
  private settlement: Settlement | null = null;
  private shieldsUsed = 0;
  private pendingAction: MenuAction | null = null;
  private friends = new FriendLeaderboardService();
  private pendingPoint: Point | null = null;
  private activeTouchId: number | null = null;
  private gesture = new GestureRecognizer();
  private paintNode!: Node;
  private graphics!: Graphics;
  private background!: Sprite;
  private bulletLayer!: Node;
  private folderLayer!: Node;
  private workLayer!: Node;
  private pickupLayer!: Node;
  private playerSprite!: Sprite;
  private bodySpring = new BodySpring();
  private bulletSprites: Sprite[] = [];
  private bulletEyes: Graphics[] = [];
  private eyePhase = new WeakMap<object, number>();
  private eyePhaseCursor = 0;
  private fishSprites: Sprite[] = [];
  private leaveSprites: Sprite[] = [];
  private aiSprites: { node: Node; left: Sprite; right: Sprite; core: Sprite }[] = [];
  private aiFrames = new Map<string, { left: SpriteFrame; right: SpriteFrame; core: SpriteFrame }>();
  private art = new Map<string, SpriteFrame>();
  private atlasFrames: SpriteFrame[] = [];
  private croppedFrames: SpriteFrame[] = [];
  private animationClock = 0;
  private artReady = false;
  private artLoadGeneration = 0;
  private artLoadFailed = false;
  private artLoadStatus = '资源加载中…';
  private artLoadProgress = 0;
  private loadingProgress = new LoadingProgress();
  private artLoadComplete = false;
  private loadingFinishScheduled = false;
  private startupHandedOff = false;
  private artHud!: FinalArtHud;
  private overlay!: Graphics;
  private centerText!: Label;
  private floaters: Floater[] = [];
  private floaterCursor = 0;
  private sparks: Spark[] = [];
  private bursts: Burst[] = [];
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };
  private immunityArt!: Graphics;
  private immunityLabel!: Label;
  private immunityCopies: Sprite[] = [];
  private playerTrail = new PlayerTrail();
  private trailArt!: Graphics;
  private immunityMaterial?: Material;
  private hintText = '';
  private hintTime = 0;
  private hitFlash = 0;
  private shakeTime = 0;

  onLoad() {
    profiler.hideStats();
    view.setDesignResolutionSize(W, DESIGN_HEIGHT, ResolutionPolicy.FIXED_WIDTH);
    this.fieldHeight = view.getVisibleSize().height;
    this.model.height = this.fieldHeight;
    this.model.player.y *= this.fieldHeight / DESIGN_HEIGHT;
    const canvas = this.getComponent(Canvas) ?? this.addComponent(Canvas);
    canvas.alignCanvasWithScreen = true;
    const transform = this.getComponent(UITransform) ?? this.addComponent(UITransform);
    transform.setContentSize(W, this.fieldHeight);

    this.background = this.makeArtSprite('ApprovedOfficeBackground', W, this.fieldHeight);

    this.paintNode = new Node('ProgrammaticGraphics');
    this.paintNode.addComponent(UITransform).setContentSize(W, this.fieldHeight);
    this.node.addChild(this.paintNode);
    this.graphics = this.paintNode.addComponent(Graphics);

    this.bulletLayer = new Node('PooledWorkBullets');
    const fieldTransform = this.bulletLayer.addComponent(UITransform);
    // Clip at screen edges, so top arrivals stay visible throughout the office header.
    // HUD_SAFE_HEIGHT only constrains player movement and resource placement.
    fieldTransform.setContentSize(W, this.fieldHeight);
    fieldTransform.setAnchorPoint(0.5, 0.5);
    this.bulletLayer.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.node.addChild(this.bulletLayer);
    this.bulletShadows = this.makeGraphics('BulletShadows', this.bulletLayer);
    this.folderLayer = this.makeBulletLayer('FolderWorkLayer');
    this.bulletCues = this.makeGraphics('HomingMessageTrails', this.bulletLayer);
    this.workLayer = this.makeBulletLayer('OtherWorkLayer');
    this.pickupLayer = this.makeBulletLayer('ResourcePickupLayer');
    this.fishGlow = this.makeGraphics('FishPickupGlow', this.pickupLayer);
    this.playerShadow = this.makeGraphics('EmployeeShadow', this.node);
    this.trailArt = this.makeGraphics('CatParticleRibbon', this.node);
    for (let i = 0; i < 24; i++) this.immunityCopies.push(this.makeArtSprite(`ImmunitySilhouette${i}`, SPRITE_SIZES.player.width, SPRITE_SIZES.player.height, this.node, true));
    this.playerSprite = this.makeArtSprite('Employee', SPRITE_SIZES.player.width, SPRITE_SIZES.player.height, this.node, true);
    this.bodySpring.reset(this.model.player);
    this.playerSprite.node.active = false;

    this.immunityArt = this.makeGraphics('WorkImmunityDetails', this.node);
    this.immunityLabel = this.makeLabel('WorkImmunityStatus', 24, Vec3.ZERO, 220, 38);
    this.immunityLabel.isBold = true; this.immunityLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.immunityLabel.verticalAlign = Label.VerticalAlign.CENTER;
    this.immunityLabel.enableWrapText = false;
    this.immunityLabel.color = new Color(255, 235, 160);
    const immunityOutline = this.immunityLabel.node.addComponent(LabelOutline);
    immunityOutline.color = OFFICE.ink.clone(); immunityOutline.width = 3;
    this.artHud = new FinalArtHud(this.node);
    this.pickupLight = this.makeGraphics('PickupChargeFlights', this.node);
    const overlayNode = new Node('InterfaceOverlay');
    overlayNode.addComponent(UITransform).setContentSize(W, this.fieldHeight);
    this.node.addChild(overlayNode);
    this.overlay = overlayNode.addComponent(Graphics);
    this.hintPaper = this.makeGraphics('WorkFolderNote', this.node);
    officeNotice(this.hintPaper, 620, 64, 'shield');
    this.centerText = this.makeLabel('CenterText', 22, new Vec3(16, 35), 530, 54);
    this.centerText.color = OFFICE.ink.clone();
    this.centerText.horizontalAlign = Label.HorizontalAlign.CENTER;
    this.centerText.verticalAlign = Label.VerticalAlign.CENTER;

    for (let index = 0; index < FLOATER_SLOTS; index += 1) {
      const node = new Node(`Floater${index}`);
      node.addComponent(UITransform).setContentSize(360, 48);
      this.node.addChild(node);
      const label = node.addComponent(Label);
      label.fontSize = 26;
      label.lineHeight = 32;
      label.color = new Color(220, 242, 255, 255);
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.verticalAlign = Label.VerticalAlign.CENTER;
      node.active = false;
      this.floaters.push({ node, label, base: new Color(220, 242, 255, 255), life: 0, maxLife: 0.9, x: 0, y: 0 });
    }
    this.interface = new GameInterface(this.node);
    this.audio = new GameAudio(this.node);
    this.audio.enabled = this.progress.profile.soundEnabled;
    this.friends.sync(this.progress.profile.bestScore);

    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    // Creator also converts mouse gestures to touch. Listening to both would
    // handle every press twice and immediately undo the pause toggle.
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    game.on(Game.EVENT_HIDE, this.onGameHide, this);
    game.on(Game.EVENT_SHOW, this.onGameShow, this);
    view.on('canvas-resize', this.resizeViewport, this);
    this.resizeViewport();
    this.loadArt();
    this.draw();
  }

  onDestroy() {
    this.artLoadGeneration++;
    this.friends.hide();
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    game.off(Game.EVENT_HIDE, this.onGameHide, this);
    game.off(Game.EVENT_SHOW, this.onGameShow, this);
    view.off('canvas-resize', this.resizeViewport, this);
    this.artHud.destroy();
    this.interface.destroy();
    this.audio.destroy();
    this.immunityMaterial?.destroy();
    for (const frame of this.atlasFrames) frame.destroy();
    for (const frame of this.croppedFrames) frame.destroy();
  }

  update(dt: number) {
    dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    if (!this.artReady) {
      this.loadingProgress.report(this.artLoadProgress);
      this.loadingProgress.advance(this.appVisible ? dt : 0);
      if (this.artLoadComplete && this.loadingProgress.value === 1 && !this.loadingFinishScheduled) {
        this.loadingFinishScheduled = true;
        const generation = this.artLoadGeneration;
        // Render 100% once before exposing the home screen and its touch targets.
        director.once(Director.EVENT_AFTER_DRAW, () => {
          if (generation === this.artLoadGeneration && this.node.isValid) this.artReady = true;
        });
      }
    }
    this.interface.friends.advance(dt);
    const countingDown = this.resume.active;
    const countdownDigit = Math.ceil(this.resume.remaining);
    if (this.resume.advance(dt, this.appVisible)) {
      this.model.paused = false;
      this.audio.play('resume');
    } else if (this.appVisible && this.resume.active && Math.ceil(this.resume.remaining) !== countdownDigit) {
      this.audio.play('countdown');
    }
    if (countingDown || !this.appVisible) dt = 0;
    this.updateGuide(dt);
    const tutorialFrozen = this.guide.active && !this.guide.playing;
    if (!countingDown && this.appVisible && !tutorialFrozen) {
      // Touch movement is applied in drag(), preserving the initial finger offset.
      this.model.update(dt);
    }
    this.consumeEvents();
    if (this.model.gameOver && !this.settlement) {
      this.settleCurrentRun();
      this.audio.play('result'); this.clearInput();
    }
    this.syncMusic();
    if (this.model.paused) dt = 0;
    this.visualDt = dt;
    this.bodySpring.advance(dt, this.model.player);
    if (this.model.started && !this.model.gameOver) {
      this.playerTrail.advance(dt, this.model.player);
    } else this.playerTrail.clear();
    this.animationClock += dt;
    this.shieldCoach.advance(dt);
    this.hintTime = Math.max(0, this.hintTime - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.playerHitTime = Math.max(0, this.playerHitTime - dt);
    this.shieldBlockTime = Math.max(0, this.shieldBlockTime - dt);
    this.shieldReleaseTime = Math.max(0, this.shieldReleaseTime - dt);
    for (const flight of this.pickupFlights) {
      if (flight.life <= 0) continue;
      flight.life = Math.max(0, flight.life - dt);
      if (flight.life === 0 && this.model.energy >= (flight.segment + 1) * 20) this.artHud.pulseCharge(flight.segment);
    }
    for (const spark of this.sparks) spark.life -= dt;
    this.sparks = this.sparks.filter((spark) => spark.life > 0);
    for (const burst of this.bursts) burst.life -= dt;
    this.bursts = this.bursts.filter((burst) => burst.life > 0);
    for (const floater of this.floaters) {
      if (floater.life <= 0) { floater.node.active = false; continue; }
      floater.life -= dt;
      const progress = 1 - Math.max(0, floater.life) / floater.maxLife;
      floater.node.setPosition(new Vec3(floater.x - W / 2, floater.y - this.fieldHeight / 2 + 20 + progress * 46, 0));
      floater.label.color = new Color(floater.base.r, floater.base.g, floater.base.b, Math.max(0, Math.floor(255 * (1 - progress))));
      if (floater.life <= 0) floater.node.active = false;
    }
    this.draw();
    this.syncArt();
  }

  private resizeViewport() {
    const visible = view.getVisibleSize();
    const layout = viewportLayout(visible.width, visible.height);
    const oldHeight = this.fieldHeight;
    this.fieldHeight = layout.fieldHeight;
    this.model.height = this.fieldHeight;
    this.model.player.y *= this.fieldHeight / oldHeight;
    this.model.player.y = Math.max(90, Math.min(playerMovementTop(this.fieldHeight, this.model.player.radius), this.model.player.y));
    this.bodySpring.reset(this.model.player);
    this.playerTrail.clear();
    this.node.getComponent(UITransform)!.setContentSize(W, this.fieldHeight);
    this.overlay.node.getComponent(UITransform)!.setContentSize(W, this.fieldHeight);
    this.background.getComponent(UITransform)!.setContentSize(layout.backgroundWidth, layout.backgroundHeight);
    // Top alignment preserves the elevator and office header when the bottom is cropped.
    this.background.node.setPosition(0, (this.fieldHeight - layout.backgroundHeight) / 2);
    this.artHud.root.setPosition(0, (this.fieldHeight - DESIGN_HEIGHT) / 2);
    const field = this.bulletLayer.getComponent(UITransform)!;
    field.setContentSize(W, this.fieldHeight);
    field.setAnchorPoint(0.5, 0.5);
    const frame = view.getFrameSize();
    this.interface.resize(this.fieldHeight, readUiViewport(frame.width, frame.height));
    this.clearInput();
  }


  private makeGraphics(name: string, parent: Node) {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(W, this.fieldHeight);
    parent.addChild(node);
    return node.addComponent(Graphics);
  }

  private drawShadows() {
    const ellipse = (g: Graphics, x: number, y: number, rx: number, ry: number) => {
      for (let layer = 3; layer >= 1; layer--) {
        g.fillColor = new Color(59, 48, 74, layer === 3 ? 20 : layer === 2 ? 32 : 48);
        const spread = 1 + (layer - 1) * 0.18;
        g.ellipse(x - W / 2 + 3, y - this.fieldHeight / 2, rx * spread, ry * spread); g.fill();
      }
    };
    this.bulletShadows.clear();
    for (const bullet of this.model.bullets) {
      const size = SPRITE_SIZES[bullet.kind];
      ellipse(this.bulletShadows, bullet.x, bullet.y - size.height * 0.4, size.width * 0.43, size.height * 0.15);
    }
    this.playerShadow.clear();
    this.playerShadow.node.active = this.isPlayerVisible();
    if (this.playerShadow.node.active) {
      const shake = this.paintNode.position;
      ellipse(this.playerShadow, this.model.player.x - 5 * PLAYER_SCALE * playerMirrorSign(this.model.playerFacing) + shake.x,
        this.model.player.y - 45 * PLAYER_SCALE + shake.y, 35 * PLAYER_SCALE, 10 * PLAYER_SCALE);
    }
  }

  private isPlayerVisible() {
    return this.artReady && this.model.started &&
      (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0);
  }

  private drawFishGlow() {
    const g = this.fishGlow;
    g.clear();
    if (!this.artReady) return;
    for (const orb of this.model.skillOrbs) {
      const x = orb.x - W / 2, y = orb.y - this.fieldHeight / 2 + Math.sin(orb.pulse * 5) * 5;
      const pulse = (Math.sin(orb.pulse * 3.5) + 1) / 2;
      for (let layer = 3; layer >= 1; layer--) {
        g.fillColor = new Color(97, 255, 104, Math.round(20 + (4 - layer) * 10 + pulse * 17));
        g.ellipse(x, y, 22 + layer * 7 + pulse * 4, 10 + layer * 5); g.fill();
      }
      g.strokeColor = new Color(170, 255, 146, Math.round(110 + pulse * 70));
      g.lineWidth = 1.4; g.ellipse(x, y, 31 + pulse * 2, 19 + pulse); g.stroke();
      for (let index = 0; index < 6; index++) {
        const angle = orb.pulse * 1.25 + index * Math.PI / 3;
        const px = x + Math.cos(angle) * 33, py = y + Math.sin(angle) * 21;
        const size = 2.1 + (Math.sin(orb.pulse * 4 + index) + 1) * 0.7;
        g.fillColor = new Color(194, 255, 165, 225);
        g.moveTo(px, py + size); g.lineTo(px + size * 0.65, py);
        g.lineTo(px, py - size); g.lineTo(px - size * 0.65, py); g.close(); g.fill();
      }
    }
    for (const slip of this.model.leaveSlips) {
      const x = slip.x - W / 2, y = slip.y - this.fieldHeight / 2;
      const pulse = (Math.sin(slip.spin * 6) + 1) / 2;
      g.fillColor = new Color(126, 255, 170, 34 + Math.round(pulse * 45));
      g.ellipse(x, y, 49 + pulse * 8, 34 + pulse * 5); g.fill();
      g.strokeColor = new Color(206, 255, 211, 95 + Math.round(pulse * 100)); g.lineWidth = 2;
      g.ellipse(x, y, 46 + pulse * 6, 31 + pulse * 5); g.stroke();
    }
    for (const pickup of this.model.aiPickups) {
      const x = pickup.x - W / 2, y = pickup.y - this.fieldHeight / 2;
      const pulse = (Math.sin(pickup.phase * 9) + 1) / 2;
      g.fillColor = pickup.kind === 'agent' ? new Color(198, 145, 255, 55 + pulse * 42) : new Color(96, 226, 255, 50 + pulse * 40);
      g.ellipse(x, y, 46 + pulse * 6, 42 + pulse * 5); g.fill();
      for (let i = 0; i < 3; i++) {
        const a = pickup.phase * 2.8 + i * Math.PI * 2 / 3;
        g.fillColor = new Color(255, 255, 255, 130 + pulse * 100);
        g.circle(x + Math.cos(a) * 49, y + Math.sin(a) * 39, 2.5 + pulse); g.fill();
      }
    }
  }

  private drawBulletCues() {
    const g = this.bulletCues; g.clear(); let visible = false;
    for (const bullet of this.model.bullets) {
      if (bullet.kind !== 'message' || bullet.state !== 'homing') continue;
      const speed = Math.hypot(bullet.vx, bullet.vy);
      if (speed < 1) continue;
      visible = true;
      const x = bullet.x - W / 2, y = bullet.y - this.fieldHeight / 2;
      const dx = bullet.vx / speed, dy = bullet.vy / speed;
      for (let part = 0; part < 3; part++) {
        g.strokeColor = new Color(255, 128, 137, 160 - part * 45); g.lineWidth = 5 - part;
        g.moveTo(x - dx * (12 + part * 10), y - dy * (12 + part * 10));
        g.lineTo(x - dx * (24 + part * 10), y - dy * (24 + part * 10)); g.stroke();
      }
    }
    g.node.active = visible;
  }

  private drawPickupFlights() {
    const g = this.pickupLight; g.clear();
    for (const flight of this.pickupFlights) {
      if (flight.life <= 0) continue;
      const target = this.artHud.chargePoint(flight.segment, this.fieldHeight);
      const progress = 1 - flight.life / 0.55;
      const control = { x: (flight.x + target.x) / 2 - 20, y: Math.max(flight.y, target.y) + 20 };
      for (let part = 5; part >= 0; part--) {
        const t = Math.max(0, progress - part * 0.025), a = 1 - t;
        const x = a * a * flight.x + 2 * a * t * control.x + t * t * target.x - W / 2;
        const y = a * a * flight.y + 2 * a * t * control.y + t * t * target.y - this.fieldHeight / 2;
        g.fillColor = new Color(67, 221, 213, part === 0 ? 80 : 65 - part * 8);
        g.circle(x, y, part === 0 ? 12 : 7 - part * 0.65); g.fill();
        if (part === 0) {
          g.fillColor = new Color(161, 249, 226, 250); g.circle(x, y, 5); g.fill();
          g.fillColor = new Color(238, 255, 247, 255); g.circle(x - 1, y + 1, 2.3); g.fill();
        }
      }
    }
  }

  private makeArtSprite(name: string, width: number, height: number, parent: Node = this.node, spring = false): Sprite {
    const node = new Node(name);
    node.addComponent(UITransform).setContentSize(width, height);
    parent.addChild(node);
    const sprite = spring ? node.addComponent(SpringSprite) : node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    return sprite;
  }

  private async loadArt() {
    const generation = ++this.artLoadGeneration;
    this.artLoadFailed = false; this.artLoadStatus = '资源加载中…';
    this.artLoadComplete = false; this.loadingFinishScheduled = false;
    const startup = readStartupLoadingProgress();
    this.loadingProgress.reset(this.startupHandedOff ? this.loadingProgress.value : startup.value);
    this.artLoadProgress = Math.max(this.loadingProgress.value, startup.target);
    const current = () => generation === this.artLoadGeneration && this.node.isValid;
    const retrying = () => { if (current()) this.artLoadStatus = '正在重新连接…'; };
    try {
      const bundle = await retryLoad<NonNullable<ReturnType<typeof assetManager.getBundle>>>(done =>
        assetManager.loadBundle('art', { onFileProgress: (event: { progress: number }) => {
          if (current() && Number.isFinite(event.progress)) {
            this.artLoadProgress = Math.max(this.artLoadProgress, Math.min(0.7, event.progress / 100 * 0.7));
            this.artLoadStatus = `资源加载中 ${Math.round(this.artLoadProgress * 100)}%`;
          }
        } }, done), { label: '美术分包', timeoutMs: 45000, onRetry: retrying, isCurrent: current });
      if (!current()) return;
      const paths = Object.entries(ART_PATHS);
      let next = 0;
      const load = async () => {
        while (next < paths.length && current()) {
          const [key, path] = paths[next++];
          if (this.art.has(key)) continue;
          let frame = await retryLoad<SpriteFrame>(done => bundle.load(path, SpriteFrame, done),
            { label: '美术资源', timeoutMs: 20000, onRetry: retrying, isCurrent: current });
          if (!current()) return;
          const crop = ART_CROPS[key];
          if (crop) {
            frame = sliceFrame(frame, ...crop);
            this.croppedFrames.push(frame);
          }
          this.art.set(key, frame);
          if (key === 'helper' || key === 'agent') {
            const parts = {
              left: sliceFrame(frame, 13, 68, 83, 101),
              right: sliceFrame(frame, 288, 68, 83, 101),
              core: sliceFrame(frame, 88, 18, 209, 219),
            };
            this.croppedFrames.push(parts.left, parts.right, parts.core);
            this.aiFrames.set(key, parts);
          }
          if (key === 'background') this.background.spriteFrame = frame;
          this.artHud.setArt(key, frame);
          this.interface.setArt(key, frame);
          if (key === 'idleSheet') {
            for (let index = 0; index < IDLE_FRAMES; index += 1) {
              const cell = sliceFrame(frame, (index % 8) * 256, Math.floor(index / 8) * 256, 256, 256);
              this.atlasFrames.push(cell);
              this.art.set(`idle_${String(index + 1).padStart(2, '0')}`, cell);
            }
          }
          const completed = paths.filter(([name]) => this.art.has(name)).length;
          this.artLoadProgress = Math.max(this.artLoadProgress, 0.7 + completed / paths.length * 0.27);
          this.artLoadStatus = `资源加载中 ${Math.round(this.artLoadProgress * 100)}%`;
          this.syncArt();
        }
      };
      // Limit concurrent image decoding on phones; audio follows critical visuals.
      await Promise.all([load(), load()]);
      if (!current()) return;
      if (!this.immunityMaterial) {
        const effect = await retryLoad<EffectAsset>(done => bundle.load('effects/immunity-silhouette', EffectAsset, done),
          { label: '护盾轮廓', timeoutMs: 20000, onRetry: retrying, isCurrent: current });
        if (!current()) return;
        this.immunityMaterial = new Material();
        this.immunityMaterial.initialize({ effectAsset: effect });
        for (const copy of this.immunityCopies) copy.customMaterial = this.immunityMaterial;
      }
      const ringEffect = await retryLoad<EffectAsset>(done => bundle.load('effects/settings-ring-recolor', EffectAsset, done),
        { label: '头像原画圆环', timeoutMs: 20000, onRetry: retrying, isCurrent: current });
      if (!current()) return;
      this.artHud.setPortraitRingEffect(ringEffect);
      if (this.art.size !== ART_FRAME_COUNT) throw new Error('美术资源未完整加载');
      this.artLoadComplete = true;
      this.audio.load(bundle);
      this.artLoadProgress = 1;
      this.syncArt();
    } catch (error) {
      if (!current()) return;
      this.artLoadGeneration++; this.artLoadFailed = true; this.artLoadComplete = false;
      this.artLoadStatus = '重新加载';
      console.warn('[art] Loading stopped after retries', error);
    }
  }

  private pooledSprite(pool: Sprite[], index: number, name: string, size: number, parent: Node): Sprite {
    while (pool.length <= index) {
      const sprite = this.makeArtSprite(`${name}${pool.length}`, size, size, parent);
      sprite.node.active = false;
      pool.push(sprite);
    }
    return pool[index];
  }

  private makeBulletLayer(name: string) {
    const layer = new Node(name);
    layer.addComponent(UITransform).setContentSize(W, this.fieldHeight);
    this.bulletLayer.addChild(layer);
    return layer;
  }

  private pooledAiSprite(index: number) {
    while (this.aiSprites.length <= index) {
      const node = new Node(`AiPickup${this.aiSprites.length}`);
      this.pickupLayer.addChild(node);
      const left = this.makeArtSprite('LeftWing', 27, 33, node);
      const right = this.makeArtSprite('RightWing', 27, 33, node);
      const core = this.makeArtSprite('Core', 68, 72, node);
      node.active = false;
      this.aiSprites.push({ node, left, right, core });
    }
    return this.aiSprites[index];
  }

  private drawPlayerTrail() {
    const g = this.trailArt;
    if (!g) return;
    g.clear();
    const points = this.playerTrail.ribbon();
    g.node.active = this.playerSprite.node.active && points.length > 1;
    if (!g.node.active) return;
    const shake = this.paintNode.position;
    // Start near the feet so the torso does not hide most of a short curved trail.
    g.node.setPosition(shake.x, shake.y - 42 * PLAYER_SCALE);
    const shield = this.model.shieldTime > 0;
    // Soft fringe, mint body and a narrow cream highlight, all behind the cat.
    for (const layer of [{ width: 1.35, opacity: 0.14 }, { width: 1, opacity: 0.95 }, { width: 0.48, opacity: 0.55 }]) {
      const start = layer.width < 0.5 ? [207, 223, 231] : shield ? [195, 160, 210] : [186, 157, 211];
      const end = layer.width < 0.5 ? [255, 246, 221] : shield ? [255, 226, 155] : [111, 221, 215];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], t = (a.progress + b.progress) / 2;
        g.fillColor = new Color(...start.map((c, channel) => Math.round(c + (end[channel] - c) * t)) as [number, number, number],
          Math.round((a.alpha + b.alpha) / 2 * layer.opacity));
        const ar = a.radius * layer.width, br = b.radius * layer.width;
        g.moveTo(a.x - W / 2 + a.nx * ar, a.y - this.fieldHeight / 2 + a.ny * ar);
        g.lineTo(b.x - W / 2 + b.nx * br, b.y - this.fieldHeight / 2 + b.ny * br);
        g.lineTo(b.x - W / 2 - b.nx * br, b.y - this.fieldHeight / 2 - b.ny * br);
        g.lineTo(a.x - W / 2 - a.nx * ar, a.y - this.fieldHeight / 2 - a.ny * ar);
        g.close(); g.fill();
      }
      const head = points[points.length - 1];
      const cream = layer.width < 0.5;
      g.fillColor = cream ? new Color(255, 246, 221, Math.round(head.alpha * layer.opacity))
        : shield ? new Color(255, 226, 155, Math.round(head.alpha * layer.opacity))
        : new Color(111, 221, 215, Math.round(head.alpha * layer.opacity));
      g.circle(head.x - W / 2, head.y - this.fieldHeight / 2, head.radius * layer.width); g.fill();
    }
  }

  private syncArt() {
    if (!this.playerSprite || !this.bulletLayer) return;
    this.drawShadows();
    this.drawFishGlow();
    this.drawBulletCues();
    this.drawPickupFlights();
    const player = this.model.player;
    const mirror = playerMirrorSign(this.model.playerFacing);
    const frameNumber = Math.floor(this.animationClock * 12) % IDLE_FRAMES + 1;
    const frame = this.art.get(`idle_${String(frameNumber).padStart(2, '0')}`) ?? this.art.get('idle_01');
    this.playerSprite.spriteFrame = frame ?? null;
    this.interface.setHero(frame ?? null);
    this.playerSprite.node.active = !!frame && this.isPlayerVisible();
    const shake = this.paintNode.position;
    const hop = this.guide.rewarding ? Math.min(Math.sin(Math.PI * this.guide.rewardProgress) * 10,
      Math.max(0, playerMovementTop(this.fieldHeight) - player.y)) : 0;
    this.playerSprite.node.setPosition(player.x - W / 2 + shake.x, player.y - this.fieldHeight / 2 + shake.y + hop);
    const bendY = Math.min(this.bodySpring.y, Math.max(0, playerMovementTop(this.fieldHeight) - player.y - hop));
    (this.playerSprite as SpringSprite).setBend(this.bodySpring.x * mirror, bendY);
    this.artHud.syncEnergyPosition({ x: player.x + shake.x + this.bodySpring.x,
      y: player.y + shake.y + hop + bendY }, this.fieldHeight, this.model.playerFacing);
    const squash = Math.sin(Math.PI * this.playerHitTime / 0.28);
    this.playerSprite.node.setScale(mirror * (1 + squash * 0.06), 1 - squash * 0.09);
    this.drawPlayerTrail();
    const immunityPulse = (1 - Math.cos(this.animationClock * Math.PI * 2 / 1.5)) / 2;
    const launch = this.shieldReleaseTime / 0.45;
    for (let i = 0; i < this.immunityCopies.length; i++) {
      const copy = this.immunityCopies[i], layer = Math.floor(i / 8);
      copy.node.active = this.playerSprite.node.active && this.model.shieldTime > 0;
      if (!copy.node.active) continue;
      copy.spriteFrame = frame ?? null;
      (copy as SpringSprite).setBend(this.bodySpring.x * mirror, bendY);
      const pulse = immunityPulse;
      const angle = (i % 8) * Math.PI / 4;
      const radius = layer === 0 ? 15 + pulse * 3 + launch * 6
        : layer === 1 ? 8 + pulse * 2 + launch * 4 : 3 + pulse * 1.3 + launch * 2;
      const ox = Math.cos(angle) * radius, oy = Math.sin(angle) * radius;
      copy.node.setPosition(this.playerSprite.node.position.x + ox, this.playerSprite.node.position.y + oy);
      copy.node.setScale(mirror, 1);
      copy.color = layer === 0
        ? new Color(255, 214, 116, Math.round(14 + pulse * 14 + launch * 18))
        : layer === 1 ? new Color(255, 228, 154, Math.round(42 + pulse * 23 + launch * 32))
        : new Color(255, 246, 207, Math.round(140 + pulse * 65 + launch * 35));
    }

    let bulletIndex = 0;
    for (const bullet of this.model.bullets) {
      const frame = this.art.get(bullet.kind);
      if (!frame) continue;
      const parent = bullet.kind === 'folder' ? this.folderLayer : this.workLayer;
      const sprite = this.pooledSprite(this.bulletSprites, bulletIndex++, 'WorkBullet', 44, parent);
      // A pooled slot may change kind after removal or spawning; its layer must follow.
      if (sprite.node.parent !== parent) sprite.node.setParent(parent);
      const size = SPRITE_SIZES[bullet.kind];
      sprite.getComponent(UITransform)!.setContentSize(size.width, size.height);
      sprite.spriteFrame = frame;
      sprite.node.active = true;
      sprite.node.setPosition(bullet.x - W / 2, bullet.y - this.fieldHeight / 2);
      const chasing = bullet.kind === 'message' && bullet.state === 'homing';
      const pulse = Math.sin(this.animationClock * (bullet.kind === 'message' ? 11 : 7) + this.eyePhaseCursor * 0.08);
      sprite.node.setScale(chasing ? 1.08 + pulse * 0.06 : 1 + pulse * 0.055,
        chasing ? 1.08 - pulse * 0.045 : 1 - pulse * 0.045);
      sprite.node.angle = bullet.kind === 'requirement'
        ? bullet.turnDirection * 14 * Math.sin(Math.PI * bullet.turnFlash / 0.26) : 0;
      const eyeIndex = bulletIndex - 1;
      const eyes = this.bulletEyes[eyeIndex] ?? (this.bulletEyes[eyeIndex] = this.makeGraphics('WorkBulletEyes', sprite.node));
      eyes.node.getComponent(UITransform)!.setContentSize(size.width, size.height);
      this.drawWorkEyes(eyes, bullet, sprite.node.angle);
    }
    for (let index = bulletIndex; index < this.bulletSprites.length; index += 1) this.bulletSprites[index].node.active = false;

    const fishFrame = this.art.get('fish');
    let fishIndex = 0;
    if (fishFrame) for (const orb of this.model.skillOrbs) {
      const sprite = this.pooledSprite(this.fishSprites, fishIndex++, 'FishPickup', 50, this.pickupLayer);
      sprite.getComponent(UITransform)!.setContentSize(SPRITE_SIZES.fish.width, SPRITE_SIZES.fish.height);
      sprite.spriteFrame = fishFrame;
      sprite.node.active = true;
      sprite.node.setPosition(orb.x - W / 2, orb.y - this.fieldHeight / 2 + Math.sin(orb.pulse * 5) * 5);
      sprite.node.angle = Math.sin(orb.pulse * 4) * 9;
      const fishScale = 1 + Math.sin(orb.pulse * 5) * 0.11;
      sprite.node.setScale(fishScale, fishScale);
    }
    for (let index = fishIndex; index < this.fishSprites.length; index += 1) this.fishSprites[index].node.active = false;
    const leaveFrame = this.art.get('leave');
    let leaveIndex = 0;
    if (leaveFrame) for (const slip of this.model.leaveSlips) {
      const sprite = this.pooledSprite(this.leaveSprites, leaveIndex++, 'LeaveSlip', 76, this.pickupLayer);
      sprite.getComponent(UITransform)!.setContentSize(78, 52);
      sprite.spriteFrame = leaveFrame;
      sprite.node.active = slip.life > 3 || Math.floor(slip.life * 8) % 2 === 0;
      sprite.node.setPosition(slip.x - W / 2, slip.y - this.fieldHeight / 2 + Math.sin(slip.spin * 4) * 3);
      const slipScale = 1 + Math.sin(slip.spin * 6) * 0.06;
      sprite.node.setScale(slipScale, slipScale);
      sprite.node.angle = Math.sin(slip.spin * 3) * 5;
    }
    for (let index = leaveIndex; index < this.leaveSprites.length; index++) this.leaveSprites[index].node.active = false;
    let aiIndex = 0;
    for (const pickup of this.model.aiPickups) {
      const parts = this.aiFrames.get(pickup.kind);
      if (!parts) continue;
      const sprite = this.pooledAiSprite(aiIndex++);
      sprite.node.active = true;
      sprite.node.setPosition(pickup.x - W / 2, pickup.y - this.fieldHeight / 2 + Math.sin(pickup.phase * 8) * 4);
      sprite.core.spriteFrame = parts.core;
      sprite.left.spriteFrame = parts.left;
      sprite.right.spriteFrame = parts.right;
      const coreScale = 1 + Math.sin(pickup.phase * 8) * 0.045;
      sprite.core.node.setScale(coreScale, coreScale);
      const flap = Math.sin(pickup.phase * (pickup.kind === 'agent' ? 28 : 19));
      sprite.left.node.setPosition(-40, 5 + flap * 5);
      sprite.right.node.setPosition(40, 5 + flap * 5);
      sprite.left.node.angle = -flap * 27;
      sprite.right.node.angle = flap * 27;
    }
    for (let index = aiIndex; index < this.aiSprites.length; index++) this.aiSprites[index].node.active = false;
  }

  private drawWorkEyes(g: Graphics, bullet: GameModel['bullets'][number], angle: number) {
    g.clear();
    const art = EYE_ART[bullet.kind], size = SPRITE_SIZES[bullet.kind];
    const [cropX, cropY, cropWidth, cropHeight] = ART_CROPS[bullet.kind];
    let phase = this.eyePhase.get(bullet);
    if (phase === undefined) { phase = (this.eyePhaseCursor++ % 11) * 0.47; this.eyePhase.set(bullet, phase); }
    const clock = this.animationClock + phase;
    const cycle = clock % 3.6;
    const blink = cycle > 3.42 ? 0.15 + 0.85 * Math.abs((cycle - 3.51) / 0.09) : 1;
    const chasing = bullet.kind === 'message' && bullet.state === 'homing';
    const grin = (chasing ? 0.48 : 0.72 + Math.sin(clock * 2.1) * 0.12) * blink;
    const dx = this.model.player.x - bullet.x, dy = this.model.player.y - bullet.y;
    const distance = Math.max(1, Math.hypot(dx, dy)), rotation = -angle * Math.PI / 180;
    const gazeX = (dx * Math.cos(rotation) - dy * Math.sin(rotation)) / distance;
    const gazeY = (dx * Math.sin(rotation) + dy * Math.cos(rotation)) / distance;
    for (const [px, py, rx, ry] of art.points) {
      const x = ((px - cropX) / cropWidth - 0.5) * size.width;
      const y = (0.5 - (py - cropY) / cropHeight) * size.height;
      const coverX = rx / cropWidth * size.width, coverY = ry / cropHeight * size.height;
      g.fillColor = art.ink; g.ellipse(x, y, coverX, coverY); g.fill();
      const cx = x + gazeX * coverX * 0.24, cy = y + gazeY * coverY * 0.15;
      const width = coverX * 0.78, height = coverY * grin;
      // The bright crescent narrows into a sly squint; staggered blinks avoid a whole row blinking together.
      g.fillColor = art.light; g.moveTo(cx - width, cy + height * 0.15);
      g.bezierCurveTo(cx - width * 0.4, cy - height * 0.9, cx + width * 0.4, cy - height * 0.9, cx + width, cy + height * 0.15);
      g.bezierCurveTo(cx + width * 0.4, cy + height * 0.65, cx - width * 0.4, cy + height * 0.65, cx - width, cy + height * 0.15);
      g.close(); g.fill();
      if (bullet.kind === 'message' || bullet.kind === 'requirement') {
        const eyebrow = bullet.kind === 'message' ? Math.sin(clock * 5) * 3 : Math.sin(clock * 4) * 5;
        g.strokeColor = art.ink; g.lineWidth = 2.8;
        g.moveTo(x - coverX * 0.8, y + coverY * 1.18 + eyebrow);
        g.lineTo(x + coverX * 0.8, y + coverY * (bullet.kind === 'message' ? 1.5 : 1.1) - eyebrow);
        g.stroke();
      }
    }
    if (bullet.kind === 'message' && bullet.tauntTime > 0) {
      const t = bullet.tauntTime / 0.9;
      g.strokeColor = new Color(255, 108, 143, Math.round(210 * t)); g.lineWidth = 2.5;
      g.ellipse(0, 0, size.width * (0.56 + (1 - t) * 0.17), size.height * (0.55 + (1 - t) * 0.17)); g.stroke();
      for (let i = 0; i < 4; i++) {
        const a = clock * 5 + i * Math.PI / 2;
        g.fillColor = new Color(255, 230, 156, Math.round(240 * t));
        g.circle(Math.cos(a) * size.width * 0.57, Math.sin(a) * size.height * 0.58, 2.5); g.fill();
      }
    }
    if (bullet.kind === 'requirement' && bullet.turnFlash > 0) {
      g.strokeColor = new Color(238, 132, 255, Math.round(230 * bullet.turnFlash / 0.26)); g.lineWidth = 3;
      g.ellipse(0, 0, size.width * 0.55, size.height * 0.54); g.stroke();
    }
  }

  private consumeEvents() {
    const events = this.model.takeEvents();
    const rated = events.some(event => event.type === 'grade');
    for (const event of events) {
      if (event.type === 'pickup') {
        if (this.guide.picked(event.energy)) {
          this.interface.placeReward(event, this.model.player);
          this.clearInput(); this.audio.play('wave');
          this.model.invulnerableTime = 0; this.playerHitTime = 0;
        }
        if (!this.guide.active) this.shieldCoach.charged(event.energy);
        this.audio.play(event.energy >= 100 && event.gained > 0 ? 'ready' : 'pickup');
        const flight = event.gained > 0 ? this.pickupFlights.find((item) => item.life <= 0) : undefined;
        if (flight) { flight.x = event.x; flight.y = event.y; flight.segment = Math.min(4, Math.floor(event.energy / 20) - 1); flight.life = 0.55; }
        this.bursts.push({ x: event.x, y: event.y, life: 0.28, maxLife: 0.28, radius: 44, color: new Color(156, 255, 126) });
      } else if (event.type === 'graze') {
        this.sparks.push({ x: event.x, y: event.y, life: 0.25 });
      } else if (event.type === 'gap') {
        if (!rated) this.audio.play('skill');
        this.spawnFloater(`穿缝 +${event.value}`, event.x, event.y, new Color(150, 255, 240));
        this.bursts.push({ x: event.x, y: event.y, life: 0.35, maxLife: 0.35, radius: 70, color: new Color(190, 255, 250) });
      } else if (event.type === 'break') {
        if (!rated) this.audio.play('skill');
        this.spawnFloater(`已读不回 +${event.value}`, event.x, event.y, new Color(255, 218, 150));
      } else if (event.type === 'grade') {
        this.audio.play('grade');
        const gradeColor = event.grade === 'S' ? new Color(255, 210, 90) : event.grade === 'A' ? new Color(205, 150, 255) : new Color(120, 230, 255);
        this.spawnFloater(`${event.grade} 评价 · ${event.label} +${event.value}`, event.x, event.y - 40, gradeColor, 30, 1.3);
        this.bursts.push({ x: event.x, y: event.y, life: 0.4, maxLife: 0.4, radius: 120, color: gradeColor });
      } else if (event.type === 'practice-hit') {
        this.audio.play('hit');
        this.guide.hit(); this.clearInput();
        this.spawnFloater('工作负荷 +1', event.x, event.y + 72, new Color(255, 190, 145), 28, 1.2);
      } else if (event.type === 'practice-dodged') {
        if (this.guide.avoided()) {
          this.interface.placeReward(event, this.model.player); this.clearInput(); this.audio.play('wave');
        }
      } else if (event.type === 'hit') {
        this.audio.play('hit');
        this.hitFlash = 0.5;
        this.shakeTime = 0.4;
        this.playerHitTime = 0.28;
        this.artHud.pulseWorkload(event.workload - 1);
      } else if (event.type === 'shield-block') {
        this.audio.play('block'); this.shieldBlockTime = 0.3;
        this.shieldBlockAngle = Math.atan2(event.y - this.model.player.y, event.x - this.model.player.x);
      } else if (event.type === 'shield') {
        if (this.guide.activatedShield()) {
          this.interface.placeReward(this.model.player, this.model.player); this.clearInput();
          this.model.startPracticeImmunity();
        }
        this.shieldReleaseTime = 0.45;
        this.shieldsUsed += 1;
        this.audio.play('shield');
        if (this.shieldCoach.active) this.progress.markShieldHintSeen();
        this.shieldCoach.released();
      } else if (event.type === 'wave-clear') {
        this.audio.play('wave');
      } else if (event.type === 'difficulty-step') {
        this.audio.play('wave');
      } else if (event.type === 'leave-spawn') {
        this.spawnFloater('请假条出现', event.x, event.y, new Color(255, 255, 255));
      } else if (event.type === 'leave') {
        this.audio.play('leave');
        this.spawnFloater(event.value > 0 ? `请假获批 · 清屏 ×${event.count} +${event.value}` : '请假获批！', event.x, event.y, new Color(255, 255, 255));
        this.bursts.push({ x: this.model.player.x, y: this.model.player.y, life: 0.5, maxLife: 0.5, radius: 240, color: new Color(255, 255, 255) });
        this.shakeTime = 0.3;
        this.hitFlash = 0;
      } else if (event.type === 'ai-spawn') {
        if (!this.guide.active) this.spawnFloater(event.kind === 'agent' ? 'Agent 出现' : 'AI 出现', event.x, event.y + 55,
          event.kind === 'agent' ? new Color(227, 177, 255) : new Color(146, 242, 255));
      } else if (event.type === 'ai-pickup') {
        const taughtAi = this.guide.pickedAi(event.kind, event.removed);
        if (taughtAi) {
          this.interface.placeReward(event, this.model.player); this.clearInput(); this.audio.play('wave');
        }
        this.audio.play('reduce');
        if (!taughtAi) this.spawnFloater(`工作负荷 −${event.removed}`, event.x, event.y + 45,
          event.kind === 'agent' ? new Color(225, 167, 255) : new Color(138, 246, 255), 30, 1.2);
        this.bursts.push({ x: event.x, y: event.y, life: 0.48, maxLife: 0.48, radius: 100,
          color: event.kind === 'agent' ? new Color(213, 157, 255) : new Color(121, 226, 255) });
      } else if (event.type === 'evil-laugh') {
        this.audio.play('laugh');
      }
    }
  }

  private spawnFloater(text: string, x: number, y: number, color: Color, size = 26, life = 0.9) {
    const floater = this.floaters[this.floaterCursor];
    this.floaterCursor = (this.floaterCursor + 1) % this.floaters.length;
    floater.maxLife = life;
    floater.life = life;
    floater.x = x; floater.y = y;
    floater.base = color;
    floater.label.fontSize = size;
    floater.label.lineHeight = size * 1.25;
    floater.label.string = text;
    floater.label.color = color;
    floater.node.active = true;
    floater.node.setPosition(new Vec3(x - W / 2, y - this.fieldHeight / 2 + 20, 0));
  }

  private makeLabel(name: string, fontSize: number, position: Vec3, width: number, height: number) {
    const node = new Node(name);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(width, height);
    this.node.addChild(node);
    const label = node.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.color = new Color(220, 242, 255, 255);
    label.enableWrapText = true;
    return label;
  }

  private pointFromUI(ui: { x: number; y: number }): Point {
    const local = this.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(ui.x, ui.y));
    return { x: local.x + W / 2, y: local.y + this.fieldHeight / 2 };
  }

  private press(point: Point, time: number) {
    this.audio.unlock();
    if (!this.artReady) {
      if (this.artLoadFailed && this.interface.actionAt(point) === 'primary') {
        this.pendingAction = 'primary'; this.pendingPoint = point;
      }
      return;
    }
    this.pendingAction = null; this.pendingPoint = null;
    const action = this.interface.actionAt(point);
    if (action) { this.pendingAction = action; this.pendingPoint = point; this.interface.setPressed(action, point); return; }
    if (this.interface.friends.open || this.interface.helpOpen || this.interface.exitOpen) return;
    if (this.model.started && !this.model.gameOver && containsReferencePoint(point, SETTINGS_HIT_BOX, this.fieldHeight)) {
      this.togglePause(); return;
    }
    if (this.model.paused || this.model.gameOver || !this.model.started) return;
    if (this.guide.introducing || this.guide.rewarding || this.guide.ready) return;
    // The portrait is display-only: tapping it never enters the shield gesture.
    if (this.artHud.containsAvatar(point, this.fieldHeight)) return;
    this.dragging = true;
    this.dragOffset.x = this.model.player.x - point.x;
    this.dragOffset.y = this.model.player.y - point.y;
    this.gesture.begin(point.x, point.y, time);
  }

  private drag(point: Point) {
    if (this.pendingAction) {
      const valid = !!this.pendingPoint && Math.hypot(point.x - this.pendingPoint.x, point.y - this.pendingPoint.y) <= 18 && this.interface.actionAt(point) === this.pendingAction;
      this.interface.setPressed(valid ? this.pendingAction : null, point); return;
    }
    if (!this.dragging || this.model.gameOver || this.model.paused || this.guide.introducing || this.guide.rewarding || this.guide.ready) return;
    this.gesture.move(point.x, point.y);
    this.model.movePlayer(point.x + this.dragOffset.x, point.y + this.dragOffset.y);
  }

  private release(point: Point, time: number) {
    this.interface.setPressed(null);
    if (this.pendingAction && this.pendingPoint) {
      const action = this.pendingAction, origin = this.pendingPoint;
      this.pendingAction = null; this.pendingPoint = null;
      if (Math.hypot(point.x - origin.x, point.y - origin.y) > 18) return;
      if (!this.artReady && this.artLoadFailed && action === 'primary' && this.interface.actionAt(point) === action) {
        this.loadArt(); return;
      }
      if (this.interface.actionAt(point) === action) this.handleMenuAction(action);
      return;
    }
    if (!this.dragging) return;
    this.dragging = false;
    if (this.gesture.end(point.x, point.y, time)) this.tryActivateShield();
  }

  private tryActivateShield() {
    if (this.guide.active && this.guide.step !== 'shield') return;
    if (this.model.activateShield()) {
      this.hintText = '';
      this.hintTime = 0;
      return;
    }
    this.hintText = this.model.shieldTime > 0 ? '免疫中' : '集满 5 条小鱼后双击免疫';
    this.hintTime = 0.9;
  }

  private onTouchStart(event: EventTouch) {
    const id = event.getID(), point = this.pointFromUI(event.getUILocation());
    if (this.activeTouchId !== null) return;
    this.activeTouchId = id; this.press(point, performance.now() / 1000);
  }
  private onTouchMove(event: EventTouch) { if (event.getID() === this.activeTouchId) this.drag(this.pointFromUI(event.getUILocation())); }
  private onTouchEnd(event: EventTouch) {
    const id = event.getID(), point = this.pointFromUI(event.getUILocation());
    if (id !== this.activeTouchId) return;
    this.activeTouchId = null; this.release(point, performance.now() / 1000);
  }
  private onTouchCancel(event?: EventTouch) {
    if (event && event.getID() !== this.activeTouchId) return;
    this.clearInput();
  }
  private onKeyDown(event: EventKeyboard) {
    this.audio.unlock();
    if (this.interface.exitOpen) {
      if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('exit-cancel');
      return;
    }
    if (this.interface.helpOpen) {
      if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('help-close');
      return;
    }
    if (this.interface.friends.open) {
      if (event.keyCode === KeyCode.ESCAPE) this.handleMenuAction('friends-close');
      return;
    }
    if (event.keyCode === KeyCode.ESCAPE && this.model.started && !this.model.gameOver) { this.togglePause(); return; }
    if (event.keyCode !== KeyCode.SPACE) return;
    if (!this.artReady) return;
    if (this.resume.active) return;
    if (this.guide.introducing && !this.model.paused) { this.beginPractice(); return; }
    if (this.guide.ready && !this.model.paused) { this.finishPractice(); return; }
    if (this.guide.active && !this.model.paused) return;
    if (this.model.paused) { this.togglePause(); return; }
    if (this.model.gameOver || !this.model.started) { this.restart(); return; }
    this.tryActivateShield();
  }

  private restart(forceTutorial = false) {
    this.interface.hideExitConfirmation();
    this.interface.hideHelp();
    this.model.reset();
    this.clearFeedback();
    this.gesture.reset();
    this.dragging = false;
    this.hintTime = this.hitFlash = this.shakeTime = 0;
    this.animationClock = 0;
    this.settlement = null; this.shieldsUsed = 0;
    this.guide.start(forceTutorial || this.progress.profile.tutorialRevision !== TUTORIAL_REVISION);
    this.shieldCoach.reset(forceTutorial ? false : this.progress.profile.shieldHintSeen);
    this.model.practiceProtected = this.guide.active;
    if (this.guide.active) this.model.setupPractice();
    this.bodySpring.reset(this.model.player);
    this.updateGuide(0);
    this.clearInput();
    this.sparks.length = this.bursts.length = 0;
    for (const floater of this.floaters) { floater.life = 0; floater.node.active = false; }
  }

  private togglePause() {
    if (!this.model.started || this.model.gameOver || !this.appVisible) return;
    if (this.resume.active) this.resume.cancel();
    else if (this.model.paused) { this.resume.start(); this.audio.play('countdown'); }
    this.model.paused = true;
    this.syncMusic();
    this.clearInput();
    if (!this.resume.active) this.audio.play('ui');
  }

  private get menuMode(): MenuMode {
    return !this.model.started ? 'home' : this.model.gameOver ? 'result' : this.resume.active ? 'resuming' : this.model.paused ? 'paused' : this.guide.introducing ? 'tutorial-intro' : this.guide.ready ? 'tutorial-ready' : 'hidden';
  }
  private clearInput() {
    this.interface.setPressed(null);
    this.dragging = false; this.gesture.reset(); this.activeTouchId = null;
    this.pendingAction = null; this.pendingPoint = null;
  }
  private handleMenuAction(action: MenuAction) {
    if (action === 'exit-cancel') { this.interface.hideExitConfirmation(); this.clearInput(); this.audio.play('ui'); return; }
    if (action === 'exit-confirm') { if (this.interface.exitOpen) this.goHome(true); return; }
    if (action === 'help-controls' || action === 'help-bullets' || action === 'help-resources') {
      this.clearInput(); this.audio.play('ui');
      this.interface.selectHelp(action === 'help-controls' ? 'controls' : action === 'help-bullets' ? 'bullets' : 'resources');
      return;
    }
    if (action === 'help' || action === 'help-close') {
      this.clearInput(); this.audio.play('ui');
      if (action === 'help') this.interface.showHelp(); else this.interface.hideHelp();
      return;
    }
    if (action === 'friends') {
      this.clearInput(); this.audio.play('ui');
      // Create/size the shared canvas first, then ask the open data context to render.
      this.interface.friends.show(this.friends.available, this.progress.profile.bestScore, this.menuMode === 'result', this.menuMode === 'paused');
      this.requestFriendBoard();
      return;
    }
    if (action === 'friends-close') { this.interface.friends.hide(); this.friends.hide(); this.clearInput(); this.audio.play('ui'); return; }
    if (action === 'friends-refresh') {
      this.audio.play('ui'); this.friends.sync(this.progress.profile.bestScore);
      this.requestFriendBoard(true);
      return;
    }
    if (action === 'friends-share') {
      this.audio.play('ui');
      if (this.friends.share() === 'unavailable') this.interface.friends.inform('请在微信中邀请好友');
      return;
    }
    if (action === 'sound') {
      this.progress.setSound(!this.progress.profile.soundEnabled);
      this.audio.enabled = this.progress.profile.soundEnabled;
      this.audio.play('ui'); return;
    }
    this.audio.play('ui');
    if (action === 'primary') {
      if (this.model.paused) this.togglePause(); else if (this.guide.introducing) this.beginPractice(); else if (this.guide.ready) this.finishPractice(); else this.restart();
    } else if (this.menuMode === 'home') this.restart(true);
    else if (this.model.paused && !this.model.gameOver) this.interface.showExitConfirmation();
    else this.goHome();
  }
  private requestFriendBoard(feedback = false) {
    const state = this.friends.show(ok => {
      if (!this.interface.friends.open) return;
      if (ok) this.interface.friends.setAvailability(true, this.progress.profile.bestScore);
      else this.interface.friends.showPrivacy(false, this.progress.profile.bestScore);
    });
    if (state === 'pending') this.interface.friends.showPrivacy(true, this.progress.profile.bestScore);
    if (state === 'unavailable') {
      this.interface.friends.setAvailability(false, this.progress.profile.bestScore);
      if (feedback) this.interface.friends.inform('请在微信小游戏中查看');
    }
  }
  private goHome(saveRun = false) {
    // Only the player's confirmed exit settles a formal run; fixture/reset calls do not.
    if (saveRun && this.model.started && !this.model.practiceProtected) this.settleCurrentRun();
    this.interface.hideExitConfirmation();
    this.interface.hideHelp();
    this.clearInput(); this.guide.start(false); this.shieldCoach.reset(this.progress.profile.shieldHintSeen);
    this.clearFeedback();
    this.model.reset();
    this.model.started = false; this.model.gameOver = false; this.model.paused = false; this.model.practiceProtected = false;
    this.audio.stop();
    this.bodySpring.reset(this.model.player);
    this.model.bullets.length = this.model.skillOrbs.length = this.model.leaveSlips.length = this.model.aiPickups.length = 0;
    this.settlement = null; this.hintTime = this.hitFlash = this.shakeTime = 0;
    this.sparks.length = this.bursts.length = 0;
    for (const floater of this.floaters) { floater.life = 0; floater.node.active = false; }
  }
  private settleCurrentRun() {
    if (this.settlement) return;
    this.settlement = this.progress.settle(this.model.stats(), this.shieldsUsed, this.model.energy);
    this.friends.sync(this.progress.profile.bestScore);
  }
  private finishPractice() {
    if (!this.guide.ready) return;
    this.progress.completeTutorial(); this.progress.markShieldHintSeen();
    this.restart();
  }
  private beginPractice() {
    if (!this.guide.beginPractice()) return;
    this.clearInput(); this.model.update(0); this.consumeEvents(); this.draw();
  }
  private updateGuide(dt: number) {
    if (!this.model.started || this.model.gameOver) return;
    this.model.practiceProtected = this.guide.active;
    if (!this.guide.active || this.model.paused || !this.appVisible) return;
    const next = this.guide.advance(dt);
    if (next) {
      this.clearInput();
      if (next === 'practice') { this.model.setupPractice(); this.bodySpring.reset(this.model.player); this.playerTrail.clear(); }
      if (next === 'fish') this.model.startPracticeFish();
      if (next === 'shield') { this.model.practicePhase = 'shield'; this.audio.play('ui'); }
    }
    if (this.guide.shieldEnded(this.model.shieldTime)) {
      this.clearInput(); this.model.startPracticeAgent(); this.audio.play('ui');
    }
  }

  private syncMusic() {
    this.audio.setMusicActive(this.artReady && this.appVisible && this.model.started && !this.model.paused && !this.model.gameOver);
  }

  private onGameHide() {
    this.appVisible = false; this.resume.cancel();
    this.audio.stop();
    this.clearInput();
    if (this.model.started && !this.model.gameOver) {
      this.model.paused = true;
    }
  }
  private onGameShow() { this.appVisible = true; }

  private clearFeedback() {
    this.resume.cancel(); this.playerHitTime = this.shieldBlockTime = this.shieldReleaseTime = 0;
    this.playerTrail.clear();
    for (const flight of this.pickupFlights) flight.life = 0;
    this.artHud.clearFeedback();
  }

  private drawImmunity() {
    const g = this.immunityArt; g.clear();
    const active = this.model.shieldTime > 0;
    const visible = this.artReady && this.model.started && !this.model.gameOver && active &&
      (this.shieldBlockTime > 0 || this.shieldReleaseTime > 0);
    g.node.active = visible;
    const showStatus = this.artReady && active && this.menuMode === 'hidden';
    this.immunityLabel.node.active = showStatus;
    this.immunityLabel.string = showStatus ? '免疫已开启' : '';
    this.immunityLabel.node.setPosition(
      Math.max(120, Math.min(W - 120, this.model.player.x)) - W / 2,
      Math.max(26, this.model.player.y - 86) - this.fieldHeight / 2);
    if (!visible) return;
    const x = this.model.player.x - W / 2, y = this.model.player.y - this.fieldHeight / 2;
    const sparkle = (sx: number, sy: number, size: number, alpha: number) => {
      g.fillColor = new Color(255, 241, 200, alpha);
      g.moveTo(sx, sy + size); g.lineTo(sx + size * 0.35, sy + size * 0.25);
      g.lineTo(sx + size, sy); g.lineTo(sx + size * 0.35, sy - size * 0.25);
      g.lineTo(sx, sy - size); g.lineTo(sx - size * 0.35, sy - size * 0.25);
      g.lineTo(sx - size, sy); g.lineTo(sx - size * 0.35, sy + size * 0.25); g.close(); g.fill();
    };
    if (this.shieldReleaseTime > 0) {
      const progress = 1 - this.shieldReleaseTime / 0.45;
      const alpha = Math.round(225 * (1 - progress));
      const radius = 48 + progress * 43;
      g.strokeColor = new Color(255, 228, 149, alpha); g.lineWidth = 4 * (1 - progress) + 1;
      g.ellipse(x, y, radius, radius * 0.88); g.stroke();
      g.strokeColor = new Color(255, 249, 220, Math.round(alpha * 0.8)); g.lineWidth = 1.5;
      g.ellipse(x, y, radius + 5, radius * 0.88 + 5); g.stroke();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 + 0.2;
        sparkle(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * 0.88,
          3 + (1 - progress) * 5, alpha);
      }
    }
    if (this.shieldBlockTime > 0) {
      const t = 1 - this.shieldBlockTime / 0.3;
      for (let i = -1; i <= 1; i++) {
        const angle = this.shieldBlockAngle + i * 0.4;
        sparkle(x + Math.cos(angle) * (50 + t * 22), y + Math.sin(angle) * (50 + t * 22), 8 * (1 - t) + 2, Math.round(250 * (1 - t)));
      }
    }
  }

  private glow(x: number, y: number, radius: number, color: Color, core = true) {
    const g = this.graphics;
    const lx = x - W / 2;
    const ly = y - this.fieldHeight / 2;
    g.fillColor = new Color(color.r, color.g, color.b, 25); g.circle(lx, ly, radius * 1.85); g.fill();
    g.fillColor = new Color(color.r, color.g, color.b, 70); g.circle(lx, ly, radius * 1.35); g.fill();
    g.fillColor = new Color(color.r, color.g, color.b, 210); g.circle(lx, ly, radius); g.fill();
    if (core) { g.fillColor = new Color(240, 255, 255, 235); g.circle(lx - radius * 0.22, ly + radius * 0.25, radius * 0.35); g.fill(); }
  }

  private draw() {
    if (!this.graphics) return;
    const g = this.graphics;
    g.clear();
    if (this.shakeTime > 0 && this.visualDt > 0) {
      const amplitude = this.shakeTime * 22;
      const offset = new Vec3((Math.random() - 0.5) * amplitude, (Math.random() - 0.5) * amplitude, 0);
      this.paintNode.setPosition(offset);
      this.bulletLayer.setPosition(offset);
    } else if (this.shakeTime <= 0) { this.paintNode.setPosition(Vec3.ZERO); this.bulletLayer.setPosition(Vec3.ZERO); }

    if (!this.background.spriteFrame) {
      g.fillColor = new Color(145, 177, 180, 255); g.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight); g.fill();
    }

    // 文件夹墙无预警：不再绘制边缘预告条（墙本身从屏幕外直接推进）

    for (const bullet of this.model.bullets) {
      if (this.art.has(bullet.kind)) continue;
      if (bullet.kind === 'message') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 77, 77));
      else if (bullet.kind === 'folder') this.glow(bullet.x, bullet.y, bullet.radius, new Color(255, 206, 66));
      else this.glow(bullet.x, bullet.y, bullet.radius, new Color(176, 92, 255));
    }
    if (!this.art.has('fish')) for (const orb of this.model.skillOrbs) this.glow(orb.x, orb.y, orb.radius + Math.sin(orb.pulse * 5) * 2, new Color(56, 255, 142));

    // Art remains optional during loading; this fallback keeps pickup feedback visible.
    if (!this.art.has('leave')) for (const slip of this.model.leaveSlips) {
      const blink = slip.life > 3 || Math.floor(slip.life * 8) % 2 === 0;
      if (!blink) continue;
      const lx = slip.x - W / 2;
      const ly = slip.y - this.fieldHeight / 2;
      g.fillColor = new Color(240, 248, 255, 235);
      g.rect(lx - 15, ly - 19, 30, 38);
      g.fill();
      g.strokeColor = new Color(120, 140, 160, 220);
      g.lineWidth = 2;
      g.rect(lx - 15, ly - 19, 30, 38);
      g.stroke();
      g.fillColor = new Color(220, 45, 60, 235);
      g.circle(lx, ly + 3, 8);
      g.fill();
      g.fillColor = new Color(220, 45, 60, 160);
      g.rect(lx - 11, ly - 12, 22, 4);
      g.fill();
    }

    const p = this.model.player;
    this.drawImmunity();
    if (!this.art.has('idle_01') && (this.model.invulnerableTime <= 0 || Math.floor(this.model.invulnerableTime * 12) % 2 === 0))
      this.glow(p.x, p.y, p.radius, new Color(112, 242, 255));

    // 擦弹火花与事件光环
    for (const spark of this.sparks) {
      g.fillColor = new Color(255, 255, 210, Math.floor(200 * (spark.life / 0.25)));
      g.circle(spark.x - W / 2, spark.y - this.fieldHeight / 2, 6 + (0.25 - spark.life) * 40);
      g.fill();
    }
    for (const burst of this.bursts) {
      const progress = 1 - burst.life / burst.maxLife;
      g.strokeColor = new Color(burst.color.r, burst.color.g, burst.color.b, Math.floor(210 * (1 - progress)));
      g.lineWidth = 6;
      g.circle(burst.x - W / 2, burst.y - this.fieldHeight / 2, burst.radius * progress);
      g.stroke();
    }

    this.artHud.update(this.model, this.artReady && this.menuMode !== 'home' && this.menuMode !== 'result', this.visualDt);
    const overlay = this.overlay;
    overlay.clear();
    // Screen-space damage feedback covers the HUD and actors, without camera shake gaps.
    if (this.hitFlash > 0) {
      overlay.fillColor = new Color(255, 60, 60, Math.floor(90 * (this.hitFlash / 0.5)));
      overlay.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight); overlay.fill();
    }
    this.artHud.drawSettingsCover(overlay, this.model.paused, this.fieldHeight);
    const modal = this.menuMode !== 'hidden';
    this.centerText.node.setPosition(16, -this.fieldHeight / 2 + 255);
    this.hintPaper.node.setPosition(0, -this.fieldHeight / 2 + 255);
    if (modal) {
      overlay.fillColor = new Color(52, 42, 65, 90);
      overlay.rect(-W / 2, -this.fieldHeight / 2, W, this.fieldHeight); overlay.fill();
    }
    this.centerText.string = modal || !this.artReady ? '' : this.model.leaveSlipFlash > 0
      ? '请假获批 · 清屏' : this.hintTime > 0 ? this.hintText : '';
    this.hintPaper.node.active = this.centerText.string.length > 0;
    this.interface.update(this.menuMode, this.progress.profile, this.settlement, this.model.elapsed, this.visualDt);
    this.interface.updateCountdown(this.resume.remaining);
    if (!this.artReady) {
      this.interface.showResourceLoading(this.artLoadStatus, this.artLoadFailed, this.loadingProgress.value);
    } else this.interface.finishLoading();
    if (!this.startupHandedOff && (this.art.has('loadingUI') || this.artReady || this.artLoadFailed)) {
      // Re-read the platform animation at the actual handoff, not at loader entry.
      const startup = readStartupLoadingProgress();
      this.loadingProgress.value = Math.max(this.loadingProgress.value, startup.value);
      this.loadingProgress.report(Math.max(this.artLoadProgress, startup.target));
      if (!this.artReady) this.interface.showResourceLoading(this.artLoadStatus, this.artLoadFailed, this.loadingProgress.value);
      this.startupHandedOff = true;
      dismissStartupCover();
      notifyStartupLoadingReady();
    }
    this.interface.updateGuide(this.guide, false, {
      player: this.model.player, target: this.guide.step === 'fish' ? this.model.skillOrbs[0] : this.guide.step === 'agent' ? this.model.aiPickups[0] : undefined,
      time: this.animationClock,
    });
  }
}
