/** Reference coordinates use the approved 1080 × 2400 composition, with Y measured from the top. */
export const REFERENCE_WIDTH = 1080;
export const REFERENCE_HEIGHT = 2400;
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1600;
export const ART_SCALE = DESIGN_WIDTH / REFERENCE_WIDTH;
export const PLAYER_SCALE = 9 / 8;
export const PLAYER_EDGE_MARGIN = 34 * PLAYER_SCALE;
/** Source atlas has its tail on the right. Horizontal movement selects the mirror. */
export type PlayerFacing = -1 | 1;
export const playerMirrorSign = (facing: PlayerFacing = -1) => -facing;
export const HUD_SAFE_HEIGHT = 280;
/** Keep incoming top-edge artwork and its soft shadow entirely outside the viewport. */
export const TOP_SPAWN_MARGIN = 48;
export const PLAYER_START_Y = DESIGN_HEIGHT - 1860 * ART_SCALE;
export const FOLDER_SPACING = 64;
export const FOLDER_RADIUS = 28;

export type ReferenceBox = { x: number; y: number; width: number; height: number };
export const HUD_LAYOUT = {
  time: { x: 6, y: 240, width: 290, height: 127 },
  score: { x: 424, y: 248, width: 232, height: 115 },
  workload: { x: 748, y: 242, width: 327, height: 124 },
} satisfies Record<string, ReferenceBox>;

export const SPRITE_SIZES = {
  message: { width: 42, height: 40 },
  requirement: { width: 43, height: 44 },
  folder: { width: FOLDER_SPACING, height: 52 },
  fish: { width: 48, height: 25 },
  // The uniform atlas cell includes transparent padding around the cat.
  player: { width: 144 * PLAYER_SCALE, height: 144 * PLAYER_SCALE },
};

/** Head/torso capsule grows with the cat; excludes tail, ears and padding. */
export const PLAYER_BODY = { offsetX: -8 * PLAYER_SCALE, bottom: -24 * PLAYER_SCALE,
  top: 18 * PLAYER_SCALE, radius: 24 * PLAYER_SCALE };
// Approved 50-frame atlas: highest visible ear is 50.06px above the sprite centre.
export const PLAYER_VISUAL_TOP = 51 * PLAYER_SCALE;
/** Match the visible torso, excluding the atlas padding and swinging tail. */
export const PLAYER_ENERGY_BAR = { width: 72, height: 14, headGap: 6, segments: 5, inset: 2.6 };
export function playerEnergyBarPoint(player: { x: number; y: number }, facing: PlayerFacing = -1) {
  return { x: player.x + PLAYER_BODY.offsetX * playerMirrorSign(facing),
    y: player.y + PLAYER_VISUAL_TOP + PLAYER_ENERGY_BAR.headGap + PLAYER_ENERGY_BAR.height / 2 };
}
export const HUD_BOTTOM = Math.max(...Object.values(HUD_LAYOUT).map(box => (box.y + box.height) * ART_SCALE));
export const PLAYER_HUD_GAP = 10;
export const playerMovementTop = (height: number, radius = PLAYER_BODY.radius) =>
  height - HUD_BOTTOM - PLAYER_HUD_GAP - Math.max(
    PLAYER_VISUAL_TOP + PLAYER_ENERGY_BAR.headGap + PLAYER_ENERGY_BAR.height, PLAYER_BODY.top + radius);
export const playerDragTop = (height: number) => height - HUD_BOTTOM - PLAYER_HUD_GAP;
/** Fill the settings artwork's inner opening; its original painted band covers the old charge ring. */
export const PORTRAIT_AVATAR = { size: 56, diameter: 56, zoom: 1.35, hitRadius: 46 };

/** Keep the compact achievement near its pickup, outside both the cat and HUD. */
export function tutorialRewardPosition(fish: { x: number; y: number }, cat: { x: number; y: number }, height: number) {
  const top = height - HUD_BOTTOM - 65;
  const above = Math.max(fish.y + 106, cat.y + 114);
  return { x: Math.max(200, Math.min(DESIGN_WIDTH - 200, fish.x)),
    y: above <= top ? above : Math.max(75, Math.min(fish.y - 106, cat.y - 114)) };
}

/** The fingertip stays in the play area; its caption clears the teaching notice. */
export function tutorialTapPosition(player: { x: number; y: number }, height: number, noticeTop: number) {
  return { x: Math.max(100, Math.min(DESIGN_WIDTH - 100, player.x + (player.x < 360 ? 170 : -170))),
    y: Math.max(noticeTop + 200, Math.min(height - HUD_BOTTOM - 85, player.y + 195)) };
}

/** A gentle curve, with room around the character and the collectible at both ends. */
export function tutorialPickupRoute(player: { x: number; y: number }, pickup: { x: number; y: number }) {
  const target = { x: Math.max(62, Math.min(DESIGN_WIDTH - 62, pickup.x)), y: pickup.y };
  const length = Math.hypot(target.x - player.x, target.y - player.y);
  const control = { x: Math.max(75, Math.min(DESIGN_WIDTH - 75, (player.x + target.x) / 2)),
    y: (player.y + target.y) / 2 + Math.min(72, length * 0.18) };
  const points: { x: number; y: number; distance: number }[] = [];
  let distance = 0;
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, inverse = 1 - t;
    const x = inverse ** 2 * player.x + 2 * inverse * t * control.x + t ** 2 * target.x;
    const y = inverse ** 2 * player.y + 2 * inverse * t * control.y + t ** 2 * target.y;
    if (points.length) distance += Math.hypot(x - points[points.length - 1].x, y - points[points.length - 1].y);
    points.push({ x, y, distance });
  }
  return { target, points, length: distance };
}

export function referencePoint(x: number, top: number) {
  return { x: x * ART_SCALE, y: DESIGN_HEIGHT - top * ART_SCALE };
}

export function containsReferencePoint(point: { x: number; y: number }, box: ReferenceBox, height = DESIGN_HEIGHT) {
  const top = (height - point.y) / ART_SCALE;
  const x = point.x / ART_SCALE;
  return x >= box.x && x <= box.x + box.width && top >= box.y && top <= box.y + box.height;
}

/** Fixed-width playfield; cover the viewport without changing the artwork's aspect. */
export function viewportLayout(width: number, height: number) {
  const fieldHeight = DESIGN_WIDTH * height / Math.max(1, width);
  const cover = Math.max(1, fieldHeight / DESIGN_HEIGHT);
  return { fieldHeight, backgroundWidth: DESIGN_WIDTH * cover, backgroundHeight: DESIGN_HEIGHT * cover };
}

export const SETTINGS_HIT_BOX: ReferenceBox = { x: 6, y: 258, width: 112, height: 109 };
export const PAUSE_HIT_BOX = SETTINGS_HIT_BOX;
export const formatClock = (seconds: number) => {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
