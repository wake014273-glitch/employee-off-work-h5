import { Color, EffectAsset, Graphics, Label, Mask, Material, Node, Rect, Size, Sprite, SpriteFrame, UITransform } from 'cc';
import { GameModel, SHIELD_DURATION } from './model/GameModel';
import {
  ART_SCALE, DESIGN_HEIGHT, DESIGN_WIDTH, formatClock, HUD_LAYOUT, PLAYER_ENERGY_BAR, playerEnergyBarPoint,
  PORTRAIT_AVATAR, ReferenceBox, referencePoint,
} from './model/GameLayout';
import type { PlayerFacing } from './model/GameLayout';
import { PortraitMotion } from './model/PortraitMotion';

/** Slice the approved textures at runtime; source PNGs and editor metadata stay intact. */
export function sliceFrame(source: SpriteFrame, x: number, y: number, width: number, height: number) {
  const frame = new SpriteFrame();
  frame.texture = source.texture;
  frame.rect = new Rect(x, y, width, height);
  frame.originalSize = new Size(width, height);
  return frame;
}

type Panel = { sprite: Sprite; box: ReferenceBox; crop: Rect };

export class FinalArtHud {
  readonly root: Node;
  readonly panels: Record<string, Panel>;
  readonly time: Label;
  readonly score: Label;
  readonly portrait: Sprite;
  readonly portraitDetails: Graphics;
  readonly portraitMask: Node;
  readonly portraitRing: Sprite;
  private portraitRingMaterial?: Material;
  readonly portraitMotion = new PortraitMotion();
  readonly readyEffects: Graphics;
  readonly energyRoot: Node;
  readonly energyBar: Graphics;
  readonly settingsIcon: Graphics;
  chargeSegments = 0;
  shieldFraction = 0;
  barFraction = 0;
  private chargeFlashes = [0, 0, 0, 0, 0];
  private workloadPulses = [0, 0, 0];
  private clock = 0;
  private energyPoint = { x: 0, y: 0 };
  private portraitCenter: { x: number; y: number };
  readonly slots: Sprite[] = [];
  readonly ownedFrames: SpriteFrame[] = [];
  private emptySlot?: SpriteFrame;
  private filledSlot?: SpriteFrame;
  private portraitFrames: SpriteFrame[] = [];
  readonly expressionFrames: SpriteFrame[][] = [[], [], []];

  constructor(parent: Node) {
    this.root = new Node('ApprovedArtHUD');
    parent.addChild(this.root);
    this.panels = {
      time: this.panel('TimePanel', HUD_LAYOUT.time, new Rect(35, 12, 1005, 437)),
      score: this.panel('ScorePanel', HUD_LAYOUT.score, new Rect(185, 0, 800, 396)),
      workload: this.panel('WorkloadPanel', HUD_LAYOUT.workload, new Rect(16, 12, 1128, 428)),
    };
    // Cream patches sit within the printed numeric fields, leaving panel borders intact.
    this.time = this.label('LiveTime', 29, this.rawBox('time', 453, 217, 437, 150));
    this.score = this.label('LiveScore', 29, this.rawBox('score', 311, 201, 564, 146));
    this.time.isBold = this.score.isBold = true;
    for (let index = 0; index < 3; index += 1) {
      this.slots.push(this.sprite(`WorkloadSlot${index}`, this.rawBox('workload', 62 + index * 225, 185, 219, 195)));
    }
    const center = this.rawBox('workload', 937, 234, 0, 0);
    const point = referencePoint(center.x, center.y);
    this.portraitCenter = { x: point.x - DESIGN_WIDTH / 2, y: point.y - DESIGN_HEIGHT / 2 };
    const ring = new Node('PortraitIllustratedRing');
    ring.setPosition(this.portraitCenter.x, this.portraitCenter.y);
    // Use the actual settings artwork at its original HUD scale, including the painted ink and bevel.
    const timePanel = this.panels.time;
    ring.addComponent(UITransform).setContentSize(
      410 * timePanel.box.width * ART_SCALE / timePanel.crop.width,
      410 * timePanel.box.height * ART_SCALE / timePanel.crop.height);
    this.root.addChild(ring); this.portraitRing = ring.addComponent(Sprite);
    this.portraitRing.sizeMode = Sprite.SizeMode.CUSTOM;
    this.portraitMask = new Node('PortraitAvatarMask');
    this.portraitMask.setPosition(this.portraitCenter.x, this.portraitCenter.y);
    this.portraitMask.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.diameter, PORTRAIT_AVATAR.diameter);
    this.root.addChild(this.portraitMask);
    this.portraitMask.addComponent(Mask).type = Mask.Type.GRAPHICS_ELLIPSE;
    // The full-circle backdrop covers both the old static cat and the baked five-sector ring.
    const backdrop = new Node('OriginalPortraitBackdrop'); this.portraitMask.addChild(backdrop);
    backdrop.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.diameter, PORTRAIT_AVATAR.diameter);
    const background = backdrop.addComponent(Graphics);
    const radius = PORTRAIT_AVATAR.diameter / 2;
    background.fillColor = new Color(211, 229, 230);
    background.circle(0, 0, radius); background.fill();
    // Soft mist/mint separates the grey fur and blue sweater from the lavender rim.
    for (let layer = 0; layer < 24; layer++) {
      const t = layer / 23;
      background.fillColor = new Color(Math.round(211 + 29 * t), Math.round(229 + 17 * t), Math.round(230 + 14 * t));
      background.circle(-3 * t, 4 * t, radius * (1 - t * 0.94)); background.fill();
    }
    background.fillColor = new Color(248, 255, 253, 90);
    background.ellipse(-13, 27, 8, 2.5); background.fill();
    background.fillColor = new Color(246, 255, 252, 125);
    background.circle(26, 17, 1.4); background.circle(-28, -8, 1); background.fill();
    background.strokeColor = new Color(246, 255, 252, 190); background.lineWidth = 0.8;
    background.circle(0, 0, radius - 0.6); background.stroke();
    const portrait = new Node('ApprovedCharacterPortrait'); this.portraitMask.addChild(portrait);
    portrait.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
    this.portrait = portrait.addComponent(Sprite); this.portrait.sizeMode = Sprite.SizeMode.CUSTOM;
    const details = new Node('PortraitExpressionDetails'); portrait.addChild(details);
    details.addComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
    this.portraitDetails = details.addComponent(Graphics);
    this.drawPortrait();
    // The original inner ink sits over the animated face, so its painted edge stays intact.
    ring.setSiblingIndex(this.portraitMask.getSiblingIndex() + 1);
    this.energyRoot = new Node('PlayerFishEnergy');
    this.energyRoot.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width + 20, PLAYER_ENERGY_BAR.height + 20);
    this.root.addChild(this.energyRoot);
    const effects = new Node('FullEnergyGoldGlow');
    effects.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width + 20, PLAYER_ENERGY_BAR.height + 20);
    this.energyRoot.addChild(effects); this.readyEffects = effects.addComponent(Graphics);
    const bar = new Node('FiveFishCapsule');
    bar.addComponent(UITransform).setContentSize(PLAYER_ENERGY_BAR.width, PLAYER_ENERGY_BAR.height);
    this.energyRoot.addChild(bar); this.energyBar = bar.addComponent(Graphics);
    const settings = new Node('SettingsGear');
    settings.addComponent(UITransform).setContentSize(72, 72);
    const settingsPoint = referencePoint(67, 309);
    settings.setPosition(settingsPoint.x - DESIGN_WIDTH / 2, settingsPoint.y - DESIGN_HEIGHT / 2);
    this.root.addChild(settings); this.settingsIcon = settings.addComponent(Graphics);
    this.drawSettingsButton(this.settingsIcon, 0, 0);
  }

  private sprite(name: string, box: ReferenceBox) {
    const node = new Node(name);
    const point = referencePoint(box.x + box.width / 2, box.y + box.height / 2);
    node.setPosition(point.x - DESIGN_WIDTH / 2, point.y - DESIGN_HEIGHT / 2);
    node.addComponent(UITransform).setContentSize(box.width * ART_SCALE, box.height * ART_SCALE);
    this.root.addChild(node);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    return sprite;
  }

  private panel(name: string, box: ReferenceBox, crop: Rect): Panel {
    return { sprite: this.sprite(name, box), box, crop };
  }

  private label(name: string, size: number, box: ReferenceBox) {
    const node = new Node(name);
    const point = referencePoint(box.x + box.width / 2, box.y + box.height / 2);
    node.setPosition(point.x - DESIGN_WIDTH / 2, point.y - DESIGN_HEIGHT / 2);
    node.addComponent(UITransform).setContentSize(box.width * ART_SCALE, box.height * ART_SCALE);
    this.root.addChild(node);
    const label = node.addComponent(Label);
    label.fontFamily = 'Arial';
    label.fontSize = size;
    label.lineHeight = size + 4;
    label.color = new Color(61, 36, 60);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    label.enableWrapText = false;
    return label;
  }

  private rawBox(key: string, x: number, y: number, width: number, height: number): ReferenceBox {
    const { box, crop } = this.panels[key];
    return {
      x: box.x + (x - crop.x) / crop.width * box.width,
      y: box.y + (y - crop.y) / crop.height * box.height,
      width: width / crop.width * box.width,
      height: height / crop.height * box.height,
    };
  }

  private slice(source: SpriteFrame, rect: Rect) {
    const frame = sliceFrame(source, rect.x, rect.y, rect.width, rect.height);
    this.ownedFrames.push(frame);
    return frame;
  }

  setArt(key: string, frame: SpriteFrame) {
    if (/^portrait[012]$/.test(key)) {
      const state = Number(key.slice(-1));
      this.expressionFrames[state] = Array.from({ length: 61 }, (_, index) =>
        this.slice(frame, new Rect(index % 8 * 132 + 2, Math.floor(index / 8) * 132 + 2, 128, 128)));
      this.drawPortrait();
      return;
    }
    if (key === 'idleSheet') {
      this.portraitFrames = [40, 38, 12].map(index => this.slice(frame,
        new Rect(index % 8 * 256 + 55, Math.floor(index / 8) * 256 + 35, 130, 150)));
      this.drawPortrait();
      return;
    }
    const panelKey = { timeUI: 'time', scoreUI: 'score', workloadUI: 'workload' }[key];
    if (!panelKey) return;
    const panel = this.panels[panelKey];
    panel.sprite.spriteFrame = this.slice(frame, panel.crop);
    if (panelKey === 'time') {
      const ring = this.slice(frame, new Rect(32, 35, 410, 410));
      // The recolor shader samples source pixels, which must not move into a dynamic atlas.
      ring.packable = false;
      this.portraitRing.spriteFrame = ring;
    }
    if (panelKey === 'time' || panelKey === 'score') {
      const time = panelKey === 'time';
      const patch = this.sprite(`${panelKey}NumberPatch`, time
        ? this.rawBox('time', 470, 225, 400, 132)
        : this.rawBox('score', 324, 208, 544, 132));
      patch.spriteFrame = this.slice(frame, time ? new Rect(904, 226, 20, 132) : new Rect(887, 208, 16, 132));
      // Put the patch above the printed digits and below the live text.
      (time ? this.time : this.score).node.setSiblingIndex(this.root.children.length - 1);
    } else {
      this.emptySlot = this.slice(frame, new Rect(512, 185, 219, 195));
      this.filledSlot = this.slice(frame, new Rect(62, 185, 219, 195));
    }
  }

  update(model: GameModel, ready: boolean, dt = 0) {
    this.time.string = formatClock(model.elapsed);
    this.score.string = String(model.score).padStart(6, '0');
    this.clock += dt;
    for (let index = 0; index < this.chargeFlashes.length; index++) {
      this.chargeFlashes[index] = Math.max(0, this.chargeFlashes[index] - dt);
    }
    this.chargeSegments = Math.min(5, Math.max(0, Math.floor(model.energy / 20)));
    this.shieldFraction = Math.min(1, Math.max(0, model.shieldTime / SHIELD_DURATION));
    this.barFraction = model.shieldTime > 0 ? this.shieldFraction : this.chargeSegments / PLAYER_ENERGY_BAR.segments;
    this.portraitMotion.advance(model.workload, ready && !model.paused && !model.gameOver ? dt : 0);
    this.drawPortrait();
    for (let index = 0; index < this.slots.length; index += 1) {
      this.slots[index].spriteFrame = (index < model.workload ? this.filledSlot : this.emptySlot) ?? null;
      this.workloadPulses[index] = index < model.workload ? Math.max(0, this.workloadPulses[index] - dt) : 0;
      const pop = 1 + 0.16 * Math.sin(Math.PI * this.workloadPulses[index] / 0.3);
      this.slots[index].node.setScale(pop, pop);
    }
    this.energyRoot.active = model.started && !model.gameOver;
    this.syncEnergyPosition(model.player, model.height, model.playerFacing);
    this.drawReadyEffects(model);
    this.drawEnergyBar(model);
    this.root.active = ready;
  }

  /** HUD root is top-aligned, while the moving bar uses playfield coordinates. */
  syncEnergyPosition(player: { x: number; y: number }, height: number, facing: PlayerFacing = -1) {
    this.energyPoint = playerEnergyBarPoint(player, facing);
    this.energyRoot.setPosition(this.energyPoint.x - DESIGN_WIDTH / 2, this.energyPoint.y - height + DESIGN_HEIGHT / 2);
  }

  private drawReadyEffects(model: GameModel) {
    const g = this.readyEffects; g.clear();
    g.node.active = model.started && !model.gameOver && model.energy >= 100 && model.shieldTime <= 0;
    if (!g.node.active) return;
    const { width, height } = PLAYER_ENERGY_BAR, pulse = this.goldPulse();
    // Concentric translucent capsules create a small soft halo without a texture or blur pass.
    for (let layer = 6; layer >= 1; layer--) {
      const spread = layer * 0.9;
      g.fillColor = new Color(255, 196, 48, Math.round((4 + pulse * 8) * (1 - layer / 9)));
      g.roundRect(-width / 2 - spread, -height / 2 - spread, width + spread * 2, height + spread * 2, height / 2 + spread); g.fill();
    }
    g.strokeColor = new Color(255, 221, 121, Math.round(80 + pulse * 160)); g.lineWidth = 1.3;
    g.roundRect(-width / 2 - 1, -height / 2 - 1, width + 2, height + 2, height / 2 + 1); g.stroke();
    for (let i = 0; i < 2; i++) {
      const sx = (i === 0 ? -1 : 1) * (width / 2 + 4), sy = i === 0 ? 2 : -3;
      const size = 1.3 + pulse * 0.8;
      g.fillColor = new Color(255, 240, 182, Math.round(65 + pulse * 180));
      g.moveTo(sx, sy + size); g.lineTo(sx + size * 0.55, sy); g.lineTo(sx, sy - size); g.lineTo(sx - size * 0.55, sy); g.close(); g.fill();
    }
  }

  private goldPulse() { return (1 - Math.cos(this.clock * Math.PI * 2 / 1.1)) / 2; }

  private drawEnergyBar(model: GameModel) {
    const g = this.energyBar; g.clear();
    const { width, height, segments, inset } = PLAYER_ENERGY_BAR;
    const half = width / 2, innerLeft = -half + inset, innerHeight = height - inset * 2, innerWidth = width - inset * 2;
    const cell = innerWidth / segments, radius = innerHeight / 2;
    const capsule = (inset: number, color: Color, y = 0) => {
      g.fillColor = color;
      g.roundRect(-half + inset, -height / 2 + inset + y, width - inset * 2, height - inset * 2, height / 2 - inset); g.fill();
    };
    capsule(0, new Color(80, 48, 70, 48), -1.2);
    // Filled outlines stay legible on phones: sub-pixel Graphics strokes fade in its AA shader.
    capsule(0, new Color(86, 54, 78));
    capsule(1, new Color(116, 210, 214));
    capsule(1.3, new Color(197, 244, 242));
    capsule(1.9, new Color(86, 54, 78));
    capsule(inset, new Color(220, 244, 241));
    const fillCell = (index: number, color: Color, fraction = 1) => {
      const left = innerLeft + index * cell, right = left + cell * fraction;
      const cap = Math.min(radius, (right - left) / 2);
      const roundRight = index === segments - 1;
      g.fillColor = color;
      g.moveTo(left + (index === 0 ? cap : 0), -radius);
      g.lineTo(right - (roundRight ? cap : 0), -radius);
      if (roundRight) for (let step = 1; step <= 10; step++) {
        const angle = -Math.PI / 2 + Math.PI * step / 10;
        g.lineTo(right - cap + Math.cos(angle) * cap, Math.sin(angle) * radius);
      } else g.lineTo(right, radius);
      g.lineTo(left + (index === 0 ? cap : 0), radius);
      if (index === 0) for (let step = 1; step <= 10; step++) {
        const angle = Math.PI / 2 + Math.PI * step / 10;
        g.lineTo(left + cap + Math.cos(angle) * cap, Math.sin(angle) * radius);
      } else g.lineTo(left, -radius);
      g.close(); g.fill();
    };
    const shieldActive = model.shieldTime > 0;
    for (let index = 0; index < segments; index++) {
      const fraction = Math.min(1, Math.max(0, this.barFraction * segments - index));
      if (fraction <= 0) continue;
      fillCell(index, new Color(73, 209, 211), fraction);
      const left = innerLeft + index * cell;
      g.fillColor = new Color(193, 251, 229);
      const pad = index === 0 || index === segments - 1 ? 2.8 : 0.7;
      const highlight = cell * fraction - pad * 2;
      if (highlight > 0) { g.roundRect(left + pad, radius - 2, highlight, 1.2, 0.6); g.fill(); }
      if (!shieldActive && this.chargeFlashes[index] > 0) fillCell(index, new Color(235, 255, 238, Math.round(100 * this.chargeFlashes[index] / 0.3)));
    }
    if (this.chargeSegments === segments && model.shieldTime <= 0) {
      // The full capsule flashes gold, while its fish-coloured cells remain readable.
      const pulse = this.goldPulse();
      capsule(inset, new Color(255, 211, 82, Math.round(15 + pulse * 64)));
      g.strokeColor = new Color(255, 246, 191, Math.round(50 + pulse * 150)); g.lineWidth = 1;
      g.moveTo(-half + 6, height / 2 - 1.6); g.lineTo(half - 6, height / 2 - 1.6); g.stroke();
    }
    // Stable, bold dividers are drawn above every fill and flash.
    g.fillColor = new Color(86, 54, 78);
    for (let index = 1; index < segments; index++) {
      const x = innerLeft + index * cell;
      g.rect(x - 0.8, -radius, 1.6, innerHeight); g.fill();
    }
    g.strokeColor = new Color(255, 244, 214); g.lineWidth = 0.8;
    g.moveTo(-half + 6, height / 2 - 1); g.lineTo(half - 6, height / 2 - 1); g.stroke();
  }

  avatarPoint(height = DESIGN_HEIGHT) {
    return { x: this.portraitCenter.x + DESIGN_WIDTH / 2, y: this.portraitCenter.y + height - DESIGN_HEIGHT / 2 };
  }
  chargePoint(index: number, height = DESIGN_HEIGHT) {
    const { width, segments, inset } = PLAYER_ENERGY_BAR;
    const innerWidth = width - inset * 2;
    return { x: this.energyPoint.x - innerWidth / 2 +
      (Math.min(segments - 1, Math.max(0, index)) + 0.5) * innerWidth / segments, y: this.energyPoint.y };
  }
  pulseCharge(index: number) { if (index >= 0 && index < 5) this.chargeFlashes[index] = 0.3; }
  pulseWorkload(index: number) { if (index >= 0 && index < 3) this.workloadPulses[index] = 0.3; }
  clearFeedback() { this.chargeFlashes.fill(0); this.workloadPulses.fill(0); this.portraitMotion.reset(); }
  containsAvatar(point: { x: number; y: number }, height = DESIGN_HEIGHT) {
    const center = this.avatarPoint(height);
    return Math.hypot(point.x - center.x, point.y - center.y) <= PORTRAIT_AVATAR.hitRadius;
  }

  /** Animate the reference cat inside the fixed circle; fallback while artwork loads. */
  private drawPortrait() {
    const motion = this.portraitMotion, pressure = motion.pressure;
    const node = this.portrait.node;
    node.setPosition(motion.sway, -0.5 + motion.bob + motion.breath * (0.25 + pressure * 0.12));
    node.angle = motion.roll;
    const frames = this.expressionFrames[motion.workload];
    const g = this.portraitDetails; g.clear();
    if (frames.length) {
      node.getComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size);
      node.setScale(PORTRAIT_AVATAR.zoom, PORTRAIT_AVATAR.zoom * (1 + motion.breath * 0.006));
      this.portrait.spriteFrame = frames[motion.clipFrame];
      return;
    }
    node.getComponent(UITransform).setContentSize(PORTRAIT_AVATAR.size, PORTRAIT_AVATAR.size * 150 / 130);
    node.setScale(1, 1 + motion.breath * 0.006);
    // All three frames are from the same sheet used by the playable character.
    this.portrait.spriteFrame = this.portraitFrames[motion.blink > 0.65 ? 2 : motion.blink > 0.2 ? 1 : 0] ?? null;
    if (!this.portrait.spriteFrame) return;
    const ink = new Color(48, 33, 59);
    const factor = PORTRAIT_AVATAR.size / 130;
    const x = (source: number) => (source - 120) * factor;
    const y = (source: number) => (110 - source) * factor;
    // Details are drawn in source-pixel coordinates, on the original cheeks.
    g.lineWidth = 0.85; g.strokeColor = ink;
    if (pressure > 0.05 && motion.blink < 0.2) {
      g.moveTo(x(89), y(89));
      g.quadraticCurveTo(x(96), y(87 - pressure * 2), x(105), y(89 - pressure * 3)); g.stroke();
      g.moveTo(x(127), y(89 - pressure * 3));
      g.quadraticCurveTo(x(135), y(87 - pressure * 2), x(144), y(89)); g.stroke();
    }
    if (pressure > 1.3) {
      // Cover only the tiny printed mouth; the nose and muzzle retain their pixels.
      g.fillColor = new Color(255, 235, 211);
      g.ellipse(x(116), y(132), 2.7, 2.6); g.fill();
      g.fillColor = ink;
      g.ellipse(x(116), y(132), 1.45, 1.65 + motion.breath * 0.2); g.fill();
      g.fillColor = new Color(242, 156, 163);
      g.ellipse(x(116), y(135), 0.8, 0.45); g.fill();
    }
    for (const side of [-1, 1]) {
      const strength = side === 1 ? Math.min(1, pressure) : Math.max(0, pressure - 1);
      if (strength < 0.01) continue;
      const phase = (motion.clock / (pressure > 1.5 ? 0.9 : 1.7) + (side < 0 ? 0.5 : 0)) % 1;
      const alpha = Math.round(235 * strength * Math.sin(phase * Math.PI));
      const px = side * 15.3, py = 6 - phase * 12;
      g.fillColor = new Color(119, 223, 240, alpha); g.strokeColor = new Color(40, 105, 145, alpha); g.lineWidth = 0.55;
      g.moveTo(px, py + 2.5); g.bezierCurveTo(px + 3, py - 2.5, px - 3, py - 2.5, px, py + 2.5);
      g.close(); g.fill(); g.stroke();
      g.fillColor = new Color(239, 255, 255, alpha);
      g.ellipse(px - 0.4, py, 0.35, 0.8); g.fill();
    }
    if (pressure > 1.5) {
      const alpha = Math.round(210 * Math.max(0, Math.sin(motion.clock * 4)) * (pressure - 1));
      g.strokeColor = new Color(112, 93, 140, alpha); g.lineWidth = 0.75;
      g.moveTo(-3, 15); g.lineTo(-3.5, 18); g.stroke();
      g.moveTo(1, 15.5); g.lineTo(1.5, 18.5); g.stroke();
    }
  }

  setPortraitRingEffect(effect: EffectAsset) {
    if (this.portraitRingMaterial) return;
    this.portraitRingMaterial = new Material();
    this.portraitRingMaterial.initialize({ effectAsset: effect });
    this.portraitRing.customMaterial = this.portraitRingMaterial;
  }

  private drawSettingsButton(g: Graphics, x: number, y: number) {
    // Cover only the baked pause glyph; keep its illustrated plum/gold circular frame.
    g.fillColor = new Color(250, 231, 195); g.circle(x, y, 23.5); g.fill();
    const points = Array.from({ length: 32 }, (_, i) => {
      const angle = i * Math.PI / 16 - Math.PI / 2;
      const radius = i % 4 === 0 || i % 4 === 3 ? 12.8 : 18;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    const gear = (offsetY: number) => {
      const last = points[points.length - 1], first = points[0];
      g.moveTo(x + (last.x + first.x) / 2, y + (last.y + first.y) / 2 + offsetY);
      for (let i = 0; i < points.length; i++) {
        const p = points[i], next = points[(i + 1) % points.length];
        g.quadraticCurveTo(x + p.x, y + p.y + offsetY,
          x + (p.x + next.x) / 2, y + (p.y + next.y) / 2 + offsetY);
      }
      g.close(); g.fill(); g.stroke();
    };
    g.lineWidth = 2; g.strokeColor = new Color(86, 54, 78);
    g.fillColor = new Color(111, 73, 122); gear(-1.4);
    g.fillColor = new Color(186, 147, 198); gear(0);
    g.lineWidth = 1.6; g.strokeColor = new Color(239, 216, 244);
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 4;
      const cx = x + Math.cos(angle) * 13, cy = y + Math.sin(angle) * 13;
      g.moveTo(cx - 1.6, cy + 0.6); g.lineTo(cx + 1.6, cy + 0.6); g.stroke();
    }
    g.fillColor = new Color(111, 73, 122); g.circle(x, y - 0.7, 7); g.fill();
    g.fillColor = new Color(255, 239, 211); g.strokeColor = new Color(86, 54, 78);
    g.lineWidth = 1.5; g.circle(x, y + 0.6, 5.8); g.fill(); g.stroke();
  }

  drawSettingsCover(graphics: Graphics, paused: boolean, height = DESIGN_HEIGHT) {
    if (!paused) return;
    const point = referencePoint(67, 309);
    point.y += (height - DESIGN_HEIGHT) / 2;
    const x = point.x - DESIGN_WIDTH / 2;
    const y = point.y - DESIGN_HEIGHT / 2;
    this.drawSettingsButton(graphics, x, y);
  }

  destroy() {
    this.portraitRingMaterial?.destroy();
    for (const frame of this.ownedFrames) frame.destroy();
  }
}
