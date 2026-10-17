import { Graphics, Node, Sprite, SpriteFrame, UITransform } from 'cc';
import { sliceFrame } from './FinalArtHud';
import { officeButton, officeFolder, officePanel } from './OfficeUi';

/** Shared illustrated panels/icons and native buttons, with live text laid out above them. */
export class OfficeSkin {
  private frames = new Map<string, SpriteFrame>();
  private owned: SpriteFrame[] = [];
  private slots: { sprite: Sprite; key: string; width: number; height: number; panel: boolean; fallback?: Graphics; paintedWidth?: number; paintedHeight?: number }[] = [];
  sprite(parent: Node, name: string, key: string, width: number, height: number, panel = false) {
    const node = new Node(name); parent.addChild(node); node.addComponent(UITransform);
    const sprite = node.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    const slot: typeof this.slots[number] = { sprite, key, width, height, panel };
    if (panel) {
      const fallback = new Node(name + '-LoadingFallback'); node.addChild(fallback);
      fallback.addComponent(UITransform); slot.fallback = fallback.addComponent(Graphics);
    }
    this.slots.push(slot); this.refresh(slot);
    return sprite;
  }
  size(sprite: Sprite, width: number, height: number) {
    const slot = this.slots.find(s => s.sprite === sprite)!;
    if (slot.width === width && slot.height === height) return;
    slot.width = width; slot.height = height; this.refresh(slot);
  }
  setArt(key: string, source: SpriteFrame) {
    if (key === 'uiPanel') {
      const frame = sliceFrame(source, 0, 0, 1024, 1536); frame.insetTop = 240; frame.insetBottom = 260;
      frame.insetLeft = 120; frame.insetRight = 120;
      this.owned.push(frame); this.frames.set(key, frame);
    } else if (key === 'uiIcons') {
      // Crop each illustration to its visible silhouette, then preserve its aspect ratio.
      const crops: Record<string, [number, number, number, number]> = {
        speaker: [109, 114, 468, 431], book: [667, 144, 536, 417],
        trophy: [76, 691, 538, 468], home: [676, 692, 516, 471],
      };
      for (const [name, crop] of Object.entries(crops)) {
        const frame = sliceFrame(source, ...crop);
        this.owned.push(frame); this.frames.set(name, frame);
      }
    } else if (key === 'uiButton') {
      const frame = sliceFrame(source, 45, 115, 2030, 480);
      frame.insetLeft = frame.insetRight = 310; frame.insetTop = frame.insetBottom = 100;
      this.owned.push(frame); this.frames.set('greenButton', frame);
    } else this.frames.set(key, source);
    for (const slot of this.slots) this.refresh(slot);
  }
  private refresh(slot: typeof this.slots[number]) {
    // A native paper fallback is visible until the illustrated folder is ready.
    if (slot.fallback && (slot.key === 'greenButton' || (slot.key === 'uiPanel' && !this.frames.has('uiPanel')))) {
      slot.sprite.enabled = false; slot.sprite.node.setScale(1, 1);
      slot.sprite.node.getComponent(UITransform)!.setContentSize(slot.width, slot.height);
      slot.fallback.node.active = true;
      if (slot.paintedWidth !== slot.width || slot.paintedHeight !== slot.height) {
        slot.fallback.clear();
        if (slot.key === 'uiPanel') officePanel(slot.fallback, slot.width, slot.height);
        else officeButton(slot.fallback, { x: 0, y: 0, width: slot.width, height: slot.height });
        slot.paintedWidth = slot.width; slot.paintedHeight = slot.height;
      }
      return;
    }
    const frame = this.frames.get(slot.key);
    if (!frame) {
      slot.sprite.node.getComponent(UITransform)!.setContentSize(slot.width, slot.height);
      if (slot.fallback) {
        slot.fallback.clear();
        if (slot.key === 'greenButton') officeButton(slot.fallback, { x: 0, y: 0, width: slot.width, height: slot.height });
        else officeFolder(slot.fallback, slot.width, slot.height);
      }
      return;
    }
    if (slot.fallback) slot.fallback.node.active = false;
    const { sprite, width, height } = slot; sprite.enabled = true; sprite.spriteFrame = frame;
    if (slot.panel) {
      // Retain source width so the clip and round corners never distort horizontally.
      const button = slot.key === 'greenButton', folder = slot.key === 'uiPanel';
      // The source includes the clip above the main body. Keep it outside the content
      // padding, while preserving every top/bottom corner and the circular hanging hole.
      const visualWidth = folder ? width + 36 : width;
      const visualHeight = folder ? height + 52 : height;
      const scale = button ? height / frame.rect.height : visualWidth / frame.rect.width;
      sprite.type = Sprite.Type.SLICED; sprite.node.setScale(scale, scale);
      if (folder) sprite.node.setPosition(0, 14);
      sprite.node.getComponent(UITransform)!.setContentSize(visualWidth / scale, visualHeight / scale);
    } else {
      const scale = Math.min(width / frame.rect.width, height / frame.rect.height);
      sprite.node.getComponent(UITransform)!.setContentSize(frame.rect.width * scale, frame.rect.height * scale);
    }
  }
  destroy() { for (const frame of this.owned) frame.destroy(); }
}
