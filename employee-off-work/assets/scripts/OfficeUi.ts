import { Color, Graphics } from 'cc';

/** Shared live UI skin: matches the approved orange folders without baking dynamic text into images. */
export const OFFICE = {
  ink: new Color(48, 15, 59), muted: new Color(109, 74, 105), paper: new Color(255, 245, 220),
  gold: new Color(255, 176, 33), orange: new Color(225, 104, 16), cream: new Color(255, 227, 156),
  purple: new Color(161, 76, 200), green: new Color(68, 218, 83), cyan: new Color(36, 216, 246),
};
export type OfficeBox = { x: number; y: number; width: number; height: number };
export type OfficeIcon = 'fish' | 'speaker' | 'book' | 'trophy' | 'gear' | 'shield' | 'task';
export const UI_METRICS = { body: 28, title: 42, touchPixels: 48, rowGap: 20, closeSize: 56 };
export function officeContains(b: OfficeBox, x: number, y: number, minimum = 0) {
  return Math.abs(x - b.x) <= Math.max(minimum, b.width) / 2 && Math.abs(y - b.y) <= Math.max(minimum, b.height) / 2;
}
const rgba = (r: number, g: number, b: number, a = 255) => new Color(r, g, b, a);
function rect(g: Graphics, x: number, y: number, w: number, h: number, r: number, color: Color, stroke?: Color, line = 2) {
  g.fillColor = color; g.roundRect(x, y, w, h, r); g.fill();
  if (stroke) { g.strokeColor = stroke; g.lineWidth = line; g.stroke(); }
}
function circle(g: Graphics, x: number, y: number, radius: number, fill: Color, stroke?: Color, line = 2) {
  g.fillColor = fill; g.circle(x, y, radius); g.fill();
  if (stroke) { g.strokeColor = stroke; g.lineWidth = line; g.stroke(); }
}

export function officeFolder(g: Graphics, width: number, height: number, compact = false) {
  const x = -width / 2, y = -height / 2;
  rect(g, x + 7, y - 11, width + 8, height + 6, 25, rgba(48, 15, 59, 52));
  if (!compact) {
    rect(g, x - 10, y + 13, width, height - 20, 24, OFFICE.orange, OFFICE.ink, 3);
    rect(g, x + 12, y + 23, width, height - 24, 24, OFFICE.gold, OFFICE.ink, 3);
    rect(g, x + 24, height / 2 - 27, width * 0.34, 39, 12, OFFICE.gold, OFFICE.ink, 3);
  }
  rect(g, x, y, width, height, compact ? 17 : 25, OFFICE.orange, OFFICE.ink, compact ? 2 : 4);
  rect(g, x + 4, y + 7, width - 8, height - 10, compact ? 15 : 23, OFFICE.gold);
  rect(g, x + 11, y + 13, width - 22, height - 21, compact ? 13 : 20, OFFICE.cream);
  rect(g, x + 16, y + 18, width - 32, height - 31, compact ? 10 : 18, OFFICE.paper, rgba(255, 253, 238), 2);
  if (!compact) {
    // The purple clip sits above the paper, leaving the header below it readable.
    circle(g, 0, height / 2 + 3, 23, OFFICE.ink);
    circle(g, 0, height / 2 + 5, 19, OFFICE.purple);
    rect(g, -61, height / 2 - 28, 122, 44, 10, OFFICE.ink);
    rect(g, -57, height / 2 - 24, 114, 39, 8, rgba(105, 42, 140));
    rect(g, -54, height / 2 - 19, 108, 33, 8, OFFICE.purple);
    rect(g, -49, height / 2 - 13, 98, 4, 2, rgba(216, 154, 237));
    circle(g, 0, height / 2 + 6, 8, OFFICE.ink);
    circle(g, 0, height / 2 + 6, 4, rgba(217, 161, 237));
  }
}

/** Soft paper folder: broad warm edges and a single cartoon outline, shared by all large dialogs. */
export function officePanel(g: Graphics, width: number, height: number) {
  const x = -width / 2, y = -height / 2, top = height / 2;
  const outline = rgba(89, 43, 49);
  // One offset cover supplies the depth; the front keeps a broad, quiet paper surface.
  rect(g, x + 5, y - 13, width + 12, height + 7, 37, rgba(45, 22, 40, 48));
  g.fillColor = rgba(239, 153, 47); g.strokeColor = outline; g.lineWidth = 4;
  g.moveTo(x + 24, y + 8); g.lineTo(x - 8, y + 18);
  g.quadraticCurveTo(x - 20, y + 22, x - 17, y + 39);
  g.lineTo(x + 4, top - 25); g.quadraticCurveTo(x + 6, top - 6, x + 26, top - 4);
  g.lineTo(width / 2 - 5, top + 8); g.lineTo(width / 2 + 12, y + 32);
  g.quadraticCurveTo(width / 2 + 12, y + 15, width / 2 - 8, y + 14);
  g.close(); g.fill(); g.stroke();
  rect(g, x + 50, top - 15, width * 0.29, 43, 14, rgba(255, 185, 59), outline, 4);
  rect(g, x + 57, top + 13, width * 0.29 - 14, 6, 3, rgba(255, 223, 137));
  rect(g, x + 13, y + 18, width, height - 16, 31, rgba(246, 165, 45), outline, 4);

  // A wide orange band and cream sheet replace the former narrow metallic rails.
  rect(g, x, y, width, height, 34, rgba(241, 147, 38), outline, 4.5);
  rect(g, x + 4, y + 10, width - 8, height - 14, 30, rgba(255, 193, 76));
  rect(g, x + 18, y + 22, width - 36, height - 41, 21, rgba(255, 245, 220), rgba(235, 169, 75), 2.5);
  g.strokeColor = rgba(255, 229, 162); g.lineWidth = 5;
  g.moveTo(x + 8, top - 46); g.quadraticCurveTo(x + 8, top - 9, x + 43, top - 9);
  g.lineTo(-83, top - 9); g.stroke();
  // A restrained paper curl repeats the scorecard motif without introducing another icon.
  g.fillColor = rgba(233, 181, 104, 72);
  g.moveTo(x + 27, top - 59); g.lineTo(x + 59, top - 27); g.lineTo(x + 60, top - 58); g.close(); g.fill();
  g.fillColor = rgba(255, 224, 164); g.strokeColor = rgba(193, 126, 62); g.lineWidth = 2;
  g.moveTo(x + 28, top - 56); g.lineTo(x + 55, top - 29); g.lineTo(x + 55, top - 53);
  g.quadraticCurveTo(x + 43, top - 56, x + 28, top - 56); g.close(); g.fill(); g.stroke();

  // One chunky purple clip, with a circular hanging hole and a softly shaded lower jaw.
  const s = Math.min(1, width / 620);
  rect(g, -73 * s, top - 37 * s, 146 * s, 49 * s, 11 * s, rgba(106, 58, 53, 42));
  g.fillColor = rgba(153, 75, 178); g.strokeColor = OFFICE.ink; g.lineWidth = 4 * s;
  g.moveTo(-62 * s, top - 30 * s); g.lineTo(62 * s, top - 30 * s);
  g.quadraticCurveTo(72 * s, top - 30 * s, 72 * s, top - 20 * s);
  g.lineTo(72 * s, top + 3 * s); g.quadraticCurveTo(72 * s, top + 13 * s, 62 * s, top + 13 * s);
  g.lineTo(26 * s, top + 13 * s);
  g.bezierCurveTo(26 * s, top + 27.36 * s, 14.36 * s, top + 39 * s, 0, top + 39 * s);
  g.bezierCurveTo(-14.36 * s, top + 39 * s, -26 * s, top + 27.36 * s, -26 * s, top + 13 * s);
  g.lineTo(-62 * s, top + 13 * s); g.quadraticCurveTo(-72 * s, top + 13 * s, -72 * s, top + 3 * s);
  g.lineTo(-72 * s, top - 20 * s); g.quadraticCurveTo(-72 * s, top - 30 * s, -62 * s, top - 30 * s);
  g.close(); g.fill(); g.stroke();
  rect(g, -66 * s, top - 25 * s, 132 * s, 8 * s, 4 * s, rgba(111, 46, 139));
  rect(g, -62 * s, top + 3 * s, 124 * s, 4 * s, 2 * s, rgba(223, 172, 237));
  circle(g, 0, top + 17 * s, 8.5 * s, OFFICE.ink, rgba(225, 179, 236), 2.5 * s);
}

export function officeRow(g: Graphics, b: OfficeBox, green = false) {
  const x = b.x - b.width / 2, y = b.y - b.height / 2;
  rect(g, x, y - 2, b.width, b.height, 19, rgba(191, 135, 61, 24));
  rect(g, x, y, b.width, b.height, 19, green ? rgba(218, 244, 198) : rgba(247, 221, 178),
    green ? rgba(177, 217, 155) : rgba(235, 194, 140), 1.5);
  rect(g, x + 3, y + b.height - 12, b.width - 6, 8, 4,
    green ? rgba(241, 255, 230, 130) : rgba(255, 247, 222, 140));
}

export function officeButton(g: Graphics, b: OfficeBox, kind: 'green' | 'cream' | 'gold' = 'green') {
  if (kind !== 'green') { officeRow(g, b); return; }
  const x = b.x - b.width / 2, y = b.y - b.height / 2, r = Math.min(b.height / 2, 28);
  rect(g, x + 2, y - 5, b.width, b.height, r, rgba(108, 57, 12, 55));
  rect(g, x, y, b.width, b.height, r, OFFICE.ink);
  rect(g, x + 3, y + 4, b.width - 6, b.height - 7, r - 2,
    kind === 'green' ? rgba(17, 128, 76) : OFFICE.orange);
  rect(g, x + 6, y + 8, b.width - 12, b.height - 14, r - 4,
    kind === 'green' ? OFFICE.green : kind === 'gold' ? OFFICE.gold : OFFICE.paper);
  rect(g, x + 10, y + b.height * 0.53, b.width - 20, b.height * 0.34, r - 7,
    kind === 'green' ? rgba(107, 237, 105) : kind === 'gold' ? rgba(255, 213, 66) : rgba(255, 253, 240));
  g.fillColor = kind === 'green' ? rgba(193, 255, 174, 230) : rgba(255, 255, 245, 240);
  g.ellipse(x + 24, y + b.height - 20, 9, 4); g.fill();
  g.ellipse(x + b.width - 22, y + 18, 6, 3); g.fill();
}

export function officeUnderline(g: Graphics, width: number, y: number) {
  g.strokeColor = OFFICE.gold; g.lineWidth = 5;
  g.moveTo(-width / 2, y); g.quadraticCurveTo(0, y + 9, width / 2, y); g.stroke();
}

export function officeChevron(g: Graphics, x: number, y: number, size = 12) {
  g.strokeColor = OFFICE.ink; g.lineWidth = 5;
  g.moveTo(x - size / 3, y + size / 2); g.lineTo(x + size / 3, y); g.lineTo(x - size / 3, y - size / 2); g.stroke();
}

export function officeSwitch(g: Graphics, b: OfficeBox, enabled: boolean) {
  const x = b.x - b.width / 2, y = b.y - b.height / 2, r = b.height / 2;
  rect(g, x, y - 2, b.width, b.height, r, OFFICE.ink);
  rect(g, x + 3, y + 3, b.width - 6, b.height - 6, r - 3, enabled ? OFFICE.green : rgba(207, 190, 208));
  circle(g, b.x + (enabled ? 1 : -1) * (b.width / 2 - r), b.y + 1, r - 6, OFFICE.paper, rgba(117, 90, 117), 2);
}

export function officeIcon(g: Graphics, kind: OfficeIcon, x: number, y: number, size = 44) {
  const s = size / 44;
  if (kind === 'fish') {
    g.fillColor = OFFICE.cyan; g.strokeColor = OFFICE.ink; g.lineWidth = 2.5 * s;
    g.moveTo(x + 12 * s, y); g.lineTo(x + 27 * s, y + 12 * s);
    g.quadraticCurveTo(x + 30 * s, y, x + 27 * s, y - 12 * s); g.close(); g.fill(); g.stroke();
    g.ellipse(x - 2 * s, y, 23 * s, 15 * s); g.fill(); g.stroke();
    circle(g, x - 12 * s, y + 4 * s, 3.2 * s, OFFICE.ink);
    g.strokeColor = rgba(232, 255, 252); g.lineWidth = 2 * s;
    g.moveTo(x - 8 * s, y + 10 * s); g.lineTo(x + 3 * s, y + 10 * s); g.stroke();
  } else if (kind === 'speaker') {
    rect(g, x - 20 * s, y - 9 * s, 14 * s, 18 * s, 3 * s, OFFICE.purple, OFFICE.ink, 2 * s);
    g.fillColor = OFFICE.purple; g.moveTo(x - 8 * s, y + 10 * s); g.lineTo(x + 5 * s, y + 18 * s);
    g.lineTo(x + 5 * s, y - 18 * s); g.lineTo(x - 8 * s, y - 10 * s); g.close(); g.fill(); g.stroke();
    g.strokeColor = OFFICE.purple; g.lineWidth = 3 * s;
    for (const d of [13, 21]) { g.moveTo(x + d * s, y - 13 * s); g.quadraticCurveTo(x + (d + 10) * s, y, x + d * s, y + 13 * s); g.stroke(); }
  } else if (kind === 'trophy') {
    g.strokeColor = OFFICE.orange; g.lineWidth = 4 * s;
    for (const sign of [-1, 1]) { g.moveTo(x + sign * 14 * s, y + 14 * s); g.bezierCurveTo(x + sign * 33 * s, y + 22 * s, x + sign * 30 * s, y - 12 * s, x + sign * 10 * s, y - 8 * s); g.stroke(); }
    g.fillColor = OFFICE.gold; g.strokeColor = OFFICE.ink; g.lineWidth = 2 * s;
    g.moveTo(x - 17 * s, y + 19 * s); g.lineTo(x + 17 * s, y + 19 * s);
    g.quadraticCurveTo(x + 15 * s, y - 10 * s, x, y - 13 * s); g.quadraticCurveTo(x - 15 * s, y - 10 * s, x - 17 * s, y + 19 * s); g.close(); g.fill(); g.stroke();
    rect(g, x - 4 * s, y - 20 * s, 8 * s, 11 * s, 2 * s, OFFICE.gold, OFFICE.ink, s);
    rect(g, x - 14 * s, y - 25 * s, 28 * s, 7 * s, 3 * s, OFFICE.gold, OFFICE.ink, 2 * s);
  } else if (kind === 'gear') {
    g.fillColor = OFFICE.purple; g.strokeColor = OFFICE.ink; g.lineWidth = 2 * s;
    for (let i = 0; i < 32; i++) {
      const a = i * Math.PI / 16, r = (i % 4 < 2 ? 21 : 16) * s;
      if (i === 0) g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.close(); g.fill(); g.stroke(); circle(g, x, y, 8 * s, OFFICE.paper, OFFICE.ink, 2 * s);
  } else if (kind === 'shield') {
    g.fillColor = OFFICE.cream; g.strokeColor = OFFICE.ink; g.lineWidth = 2.5 * s;
    g.moveTo(x - 18 * s, y + 18 * s); g.lineTo(x, y + 24 * s); g.lineTo(x + 18 * s, y + 18 * s);
    g.quadraticCurveTo(x + 19 * s, y - 13 * s, x, y - 24 * s); g.quadraticCurveTo(x - 19 * s, y - 13 * s, x - 18 * s, y + 18 * s); g.close(); g.fill(); g.stroke();
    g.strokeColor = rgba(30, 157, 90); g.lineWidth = 4 * s;
    g.moveTo(x - 10 * s, y); g.lineTo(x - 2 * s, y - 8 * s); g.lineTo(x + 12 * s, y + 9 * s); g.stroke();
  } else {
    rect(g, x - 18 * s, y - 22 * s, 36 * s, 44 * s, 5 * s, OFFICE.paper, OFFICE.ink, 2 * s);
    rect(g, x - 7 * s, y + 17 * s, 14 * s, 8 * s, 3 * s, OFFICE.purple, OFFICE.ink, 1.5 * s);
    for (let i = 0; i < 3; i++) {
      rect(g, x - 12 * s, y + (7 - i * 10) * s, 5 * s, 5 * s, s, OFFICE.cream);
      rect(g, x - 2 * s, y + (8 - i * 10) * s, 14 * s, 3 * s, s, OFFICE.purple);
    }
  }
}

export function officeNotice(g: Graphics, width: number, height: number, icon: OfficeIcon = 'fish') {
  officeRow(g, { x: 0, y: 0, width, height }, icon === 'shield');
  rect(g, -width / 2 + 10, -height / 2 + 12, 5, height - 24, 2,
    icon === 'shield' ? rgba(91, 184, 89) : OFFICE.gold);
}

/** A round paper inset with a drawn cross, independent of font baseline/metrics. */
export function officeClose(g: Graphics, b: OfficeBox) {
  const r = Math.min(b.width, b.height) / 2 - 3;
  circle(g, b.x, b.y - 2, r + 1, rgba(130, 78, 63, 110));
  circle(g, b.x, b.y, r, OFFICE.ink);
  circle(g, b.x, b.y, r - 2.5, OFFICE.paper);
  circle(g, b.x, b.y + 1, r - 5, rgba(249, 235, 213));
  g.fillColor = OFFICE.ink;
  const d = r * 0.29;
  for (const direction of [-1, 1]) {
    const t = 1.8;
    g.moveTo(b.x - d - t, b.y - d * direction + t * direction);
    g.lineTo(b.x - d + t, b.y - d * direction - t * direction);
    g.lineTo(b.x + d + t, b.y + d * direction - t * direction);
    g.lineTo(b.x + d - t, b.y + d * direction + t * direction);
    g.close(); g.fill();
  }
}
