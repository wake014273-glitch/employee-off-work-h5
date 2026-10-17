import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, SHIELD_DURATION } from '../assets/scripts/model/GameModel.ts';

test('shield protects until the shared duration expires exactly, including paused frames', () => {
  const m = new GameModel(); m.reset(); m.energy = 100;
  m.bullets.length = m.walls.length = m.skillOrbs.length = 0;
  m.messageTimer = m.requirementTimer = m.wallTimer = m.skillTimer = 999;
  assert.equal(m.activateShield(), true);
  assert.equal(m.shieldTime, SHIELD_DURATION);
  assert.equal(m.hitPlayer(), false);
  for (let i = 0; i < 60; i++) m.update(0.025);
  assert.ok(Math.abs(m.shieldTime - SHIELD_DURATION / 2) < 1e-9);
  m.paused = true; const remaining = m.shieldTime;
  for (let i = 0; i < 60; i++) m.update(0.025);
  assert.equal(m.shieldTime, remaining);
  m.paused = false;
  for (let i = 0; i < 59; i++) m.update(0.025);
  assert.equal(m.hitPlayer(), false);
  m.update(0.025);
  assert.equal(m.shieldTime, 0);
  assert.equal(m.hitPlayer(), true);
});
