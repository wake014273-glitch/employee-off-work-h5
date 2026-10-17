import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, createMessage, createFolderWall } from '../assets/scripts/model/GameModel.ts';

test('shield passes through bullets without clearing them', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.energy = 100;
  game.activateShield();
  const bullet = createMessage(game.player.x, game.player.y, 0, 0);
  game.bullets.push(bullet);
  game.update(1 / 60);
  assert.equal(game.workload, 0);
  assert.equal(game.bullets.includes(bullet), true);
});

test('shield cannot collect or consume skill orbs while active', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.energy = 100;
  game.activateShield();
  const orb = {
    kind: 'skill',
    x: game.player.x,
    y: game.player.y,
    radius: 17,
    alive: true,
    pulse: 0,
  };
  game.skillOrbs.push(orb);
  game.update(1 / 60);
  assert.equal(game.energy, 0);
  assert.equal(game.skillOrbs.includes(orb), true);
});

test('five minute wave simulation stays finite, bounded and can restart', () => {
  let state = 123456789;
  const random = () => ((state = (1103515245 * state + 12345) & 0x7fffffff) / 0x80000000);
  const game = new GameModel(random);
  game.reset();
  let peakBullets = 0;
  for (let frame = 0; frame < 60 * 60 * 5; frame++) {
    game.invulnerableTime = 999;
    game.update(1 / 60);
    assert.equal(game.waveState, 'running');
    peakBullets = Math.max(peakBullets, game.bullets.length);
    for (const bullet of game.bullets) {
      assert.equal(Number.isFinite(bullet.x) && Number.isFinite(bullet.y), true);
    }
  }
  assert.ok(peakBullets < 250, `peak bullet count was ${peakBullets}`);
  assert.ok(game.wave >= 6, `reached wave ${game.wave}`);
  assert.ok(game.elapsed > 290, `elapsed ${game.elapsed}`);
  assert.equal(Number.isFinite(game.score), true);
  assert.ok(game.score > 0);
  assert.equal(game.events.length <= 48, true);
  game.reset();
  assert.equal(game.bullets.length, 3); // 开局齐射：3 颗紫弹立即进场
  assert.equal(game.gameOver, false);
  assert.equal(game.wave, 1);
  game.update(1 / 60);
  assert.ok(game.elapsed > 0);
});

test('five minutes at final pressure respect threat, homing and wall budgets', () => {
  let seed = 20261017;
  const game = new GameModel(() => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32));
  game.reset(); game.wave = 60; game.waveTimer = 12;
  game.invulnerableTime = 999;
  let peakThreats = 0, peakLocks = 0, peakWalls = 0;
  for (let frame = 0; frame < 60 * 60 * 5; frame++) {
    game.update(1 / 60); game.takeEvents();
    const threats = game.bullets.filter(b => b.kind !== 'folder').length;
    const locks = game.bullets.filter(b => b.kind === 'message' && b.state === 'homing').length;
    peakThreats = Math.max(peakThreats, threats);
    peakLocks = Math.max(peakLocks, locks);
    peakWalls = Math.max(peakWalls, game.folderWalls.length);
    assert.ok(threats <= 20 && locks <= 3 && game.folderWalls.length <= 2);
    assert.ok(game.bullets.every(b => Number.isFinite(b.x) && Number.isFinite(b.y)));
  }
  assert.ok(peakThreats > 0 && peakLocks === 3 && peakWalls > 0);
  assert.ok(!game.gameOver && Number.isFinite(game.score));
});

test('the final folder gap admits the player across every generated gap position', () => {
  const game = new GameModel();
  game.reset();
  game.wave = 60;
  const config = game.config;
  for (let step = 0; step <= 100; step++) {
    const wall = createFolderWall(game.width, step / 100, config.gapWidth, game.player.y, 115 * config.speedScale);
    game.movePlayer((wall.gapStart + wall.gapEnd) / 2, game.player.y);
    for (const facing of [-1, 1]) {
      game.playerFacing = facing;
      assert.ok(wall.orbs.every(orb => game.playerClearance(orb) > 0), `blocked gap at ${step}% facing ${facing}`);
    }
  }
});
