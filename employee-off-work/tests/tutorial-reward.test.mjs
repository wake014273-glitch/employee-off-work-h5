import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialRewardPosition, tutorialTapPosition, tutorialPickupRoute, HUD_BOTTOM } from '../assets/scripts/model/GameLayout.ts';

test('pickup achievement stays near the fish without covering the cat or HUD at screen edges', () => {
  for (const height of [960, 1280, 1600, 1800]) for (const x of [40, 360, 680]) {
    for (const y of [130, height / 2, height - HUD_BOTTOM - 65]) {
      const point = tutorialRewardPosition({ x, y }, { x, y }, height);
      assert.ok(point.x >= 200 && point.x <= 520);
      assert.ok(Math.abs(point.y - y) >= 106);
      assert.ok(Math.abs(point.y - y) <= 114);
      assert.ok(point.y <= height - HUD_BOTTOM - 65);
      assert.ok(point.y >= 75);
    }
  }
});

test('double-tap illustration clears the HUD, notice and character on short and tall phones', () => {
  for (const height of [960, 1280, 1600, 1800]) for (const x of [35, 180, 359, 360, 540, 685]) {
    for (const y of [120, height / 2, height - HUD_BOTTOM - 80]) {
      const noticeTop = 206;
      const tip = tutorialTapPosition({ x, y }, height, noticeTop);
      assert.ok(tip.x - 97 >= 40 && tip.x + 113 <= 680, 'caption and expanding ripples stay inside');
      assert.ok(tip.y + 80 < height - HUD_BOTTOM);
      assert.ok(tip.y - 164 >= noticeTop + 36);
      assert.ok(Math.abs(tip.x - x) >= 130, 'hand and caption leave the cat unobscured');
    }
  }
});

test('pickup route stays within the field and follows the collectible, including edge entry', () => {
  for (const x of [35, 360, 685]) for (const targetX of [-48, 250, 470, 768]) {
    const start = { x, y: 400 }, pickup = { x: targetX, y: 630 };
    const route = tutorialPickupRoute(start, pickup);
    assert.deepEqual({ x: route.points[0].x, y: route.points[0].y }, start);
    const last = route.points[route.points.length - 1];
    assert.equal(last.x, route.target.x); assert.equal(last.y, pickup.y);
    assert.ok(route.target.x >= 62 && route.target.x <= 658);
    for (let i = 1; i < route.points.length; i++) {
      assert.ok(route.points[i].x >= 35 && route.points[i].x <= 685);
      assert.ok(route.points[i].distance > route.points[i - 1].distance);
    }
    assert.ok(route.length >= Math.hypot(last.x - x, last.y - 400));
  }
  assert.equal(tutorialPickupRoute({ x: 360, y: 400 }, { x: 360, y: 400 }).length, 0);
});
