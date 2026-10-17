import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_BODY, playerMovementTop } from '../assets/scripts/model/GameLayout.ts';
import {
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GameModel,
  GestureRecognizer,
  HUD_SAFE_HEIGHT,
  PHASE_LABELS,
  createFolderWall,
  createMessage,
  createRequirement,
  formatGameOverSummary,
  rankFor,
  waveConfigFor,
  waveMultiplierFor,
} from '../assets/scripts/model/GameModel.ts';

test('energy is capped at 100 and shield consumes it for about three seconds', () => {
  const game = new GameModel(() => 0.5);
  game.started = true;
  game.addEnergy(140);
  assert.equal(game.energy, 100);
  assert.equal(game.activateShield(), true);
  assert.equal(game.energy, 0);
  assert.equal(game.shieldTime, 3);
  for (let frame = 0; frame < 181; frame++) game.update(1 / 60);
  assert.equal(game.shieldTime, 0);
});

test('a lethal collision ends the frame before pickups, healing or extra rewards', () => {
  const game=new GameModel(()=>0.5);game.reset();game.bullets.length=0;game.workload=2;
  game.messageTimer=game.requirementTimer=game.wallTimer=game.skillTimer=999;
  game.bullets.push(createMessage(game.player.x,game.player.y,0,0));
  game.skillOrbs.push({kind:'skill',...game.player,alive:true,pulse:0});
  game.leaveSlips.push({kind:'leave',...game.player,alive:true,life:10,spin:0});
  game.aiPickups.push({kind:'agent',...game.player,vx:0,vy:0,alive:true,life:10,phase:0});
  game.takeEvents();game.update(0.01);
  assert.equal(game.gameOver,true);assert.equal(game.workload,3);assert.equal(game.energy,0);
  assert.equal(game.leaveSlipCount,0);assert.equal(game.aiPickups[0].alive,true);
  assert.deepEqual(game.takeEvents().map(event=>event.type),['hit']);
});

test('double tap accepts two short taps anywhere and rejects drag', () => {
  const taps = new GestureRecognizer(0.3, 18);
  taps.begin(100, 100, 1.0);
  assert.equal(taps.end(105, 100, 1.05), false);
  taps.begin(102, 98, 1.20);
  assert.equal(taps.end(102, 98, 1.24), true);

  // 不需要点到角色身上：远离角色的任意位置双击同样成立
  taps.reset();
  taps.begin(600, 900, 3.0);
  assert.equal(taps.end(600, 900, 3.05), false);
  taps.begin(600, 900, 3.2);
  assert.equal(taps.end(600, 900, 3.24), true);

  taps.reset();
  taps.begin(100, 100, 4.0);
  taps.move(140, 100);
  assert.equal(taps.end(140, 100, 4.05), false);
  taps.begin(100, 100, 4.15);
  assert.equal(taps.end(100, 100, 4.20), false);
});

test('shield prevents damage and three unshielded hits end the run', () => {
  const game = new GameModel(() => 0.5);
  game.energy = 100;
  game.activateShield();
  assert.equal(game.hitPlayer(), false);
  assert.equal(game.workload, 0);
  game.shieldTime = 0;
  for (let hit = 1; hit <= 3; hit++) {
    game.invulnerableTime = 0;
    assert.equal(game.hitPlayer(), true);
    assert.equal(game.workload, hit);
  }
  assert.equal(game.gameOver, true);
});

test('message locks instantly inside the sensing radius and reports a break when shaken off', () => {
  const message = createMessage(0, 0, 1, 0);
  assert.equal(message.update(0.1, { x: 400, y: 0 }), null);
  assert.equal(message.state, 'cruise');
  message.update(0.1, { x: 100, y: 0 });
  // 无预警：进入感应圈立即开始追踪
  assert.equal(message.state, 'homing');
  const shakenOff = message.update(1.9, { x: 700, y: 0 });
  assert.equal(message.state, 'cruise');
  assert.equal(shakenOff, 'lock-lost');
});

test('folder wall contains one contiguous traversable gap', () => {
  const wall = createFolderWall(720, 0.5);
  assert.ok(wall.orbs.length >= 6);
  assert.ok(wall.gapEnd - wall.gapStart >= 100);
  assert.ok(wall.orbs.every((orb) => orb.x < wall.gapStart || orb.x > wall.gapEnd));
  const left = wall.orbs.some((orb) => orb.x < wall.gapStart);
  const right = wall.orbs.some((orb) => orb.x > wall.gapEnd);
  assert.equal(left && right, true);
});

test('player stops at the actual HUD and visible-head boundary', () => {
  const game = new GameModel(() => 0.5);
  game.movePlayer(360, 9999);
  assert.equal(game.player.y, playerMovementTop(FIELD_HEIGHT));
});

test('game over summary carries wave, rank and risk stats', () => {
  assert.equal(
    formatGameOverSummary({ elapsed: 12.34, score: 123, wave: 3, maxCombo: 5, gapClears: 1, breakLocks: 2, leaveSlips: 0 }),
    '任务堆满，被迫开工\n抵达第 3 波 · 存活 12.3 秒 · 123 分\n评级：C · 打工仔\n最高连击 5 · 穿缝 1 · 甩脱 2 · 请假条 0\n\n点击重新摸鱼',
  );
});

test('requirement turns at its timer with no warning and cannot reverse', () => {
  const requirement = createRequirement(0, 0, 100, 0, () => 0);
  requirement.turnTimer = 0;
  requirement.update(0.01);
  // 无预警：计时到点立即转向，但单次转角上限 ±0.72π，不会 180° 掉头
  const dot = 100 * requirement.vx;
  assert.ok(dot > -0.95 * 100 * Math.hypot(requirement.vx, requirement.vy));
  assert.ok(Math.abs(Math.hypot(requirement.vx, requirement.vy) - 100) < 0.001);
  assert.ok(requirement.turnTimer >= 1.5 && requirement.turnTimer <= 3.0);
});

test('wave table follows the confirmed plan and keeps hard floors', () => {
  assert.equal(PHASE_LABELS.hard, '困难');
  assert.equal(waveConfigFor(1).phase, 'simple');
  assert.equal(waveConfigFor(2).phase, 'normal');
  assert.equal(waveConfigFor(3).phase, 'hard');
  assert.equal(waveConfigFor(4).phase, 'hard');
  assert.equal(waveConfigFor(1).duration, 8);
  assert.equal(waveConfigFor(2).duration, 16);
  assert.equal(waveConfigFor(3).duration, 60);
  assert.equal(waveConfigFor(9).duration, 60);
  // 简单波加量：需求表刷新更密、同屏上限提高
  assert.equal(waveConfigFor(1).requirementInterval, 1.1);
  assert.equal(waveConfigFor(1).maxThreats, 8);
  // 颜色分阶段：简单只有需求表（紫·随机运动）、一般加入文件夹（黄）、困难再加入消息（红·追踪）
  assert.equal(waveConfigFor(1).requirements, true);
  assert.equal(waveConfigFor(1).walls, false);
  assert.equal(waveConfigFor(1).messages, false);
  assert.equal(waveConfigFor(2).walls, true);
  assert.equal(waveConfigFor(2).messages, false);
  assert.equal(waveConfigFor(3).walls, true);
  assert.equal(waveConfigFor(3).messages, true);

  // 后期仍有清晰的可操作底线。
  const deep = waveConfigFor(60);
  assert.equal(deep.speedScale, 1.36);
  assert.equal(deep.messageInterval, 1.0);
  assert.equal(deep.requirementInterval, 1.4);
  assert.equal(deep.wallInterval, 6);
  assert.equal(deep.gapWidth, 128);
  assert.equal(deep.maxThreats, 20);
  assert.equal(deep.maxHoming, 3);
  assert.equal(waveMultiplierFor(1), 1);
  assert.equal(waveMultiplierFor(21), 3);
  assert.equal(waveMultiplierFor(99), 3);
});

test('every wave advances automatically while preserving bullets, player, energy and shield', () => {
  for (const [wave, duration] of [[1,8], [2,16], [3,60]]) {
    const game = new GameModel(() => 0.5);
    game.reset(); game.wave=wave; game.waveTimer=duration-0.01;
    game.bullets.length=0; game.messageTimer=game.requirementTimer=game.wallTimer=999;
    game.energy=40; game.shieldTime=2; game.invulnerableTime=999;
    const bullet=createMessage(100, 700, 0, -100); game.bullets.push(bullet);
    const player={...game.player};
    game.update(0.02);
    assert.equal(game.wave, wave+1);
    assert.equal(game.waveState,'running');
    assert.equal(game.bullets[0],bullet);
    assert.ok(bullet.y<700);
    assert.deepEqual(game.player,player);
    assert.equal(game.energy,40);
    assert.equal(game.shieldTime,1.98);
    const bonus=game.bonusScore;
    assert.ok(bonus>0);
    assert.equal(game.takeEvents().filter(e=>e.type==='wave-clear'||e.type==='hard-step').length,1);
    game.update(0.02);
    assert.ok(game.elapsed>0.02 && game.shieldTime<1.98);
    assert.equal(game.bonusScore,bonus,'reward is applied once');
    assert.equal(game.takeEvents().length,0);
    if(wave<3) assert.ok(game.messageTimer>1 && game.wallTimer>2,'new threats are staggered');
  }
});

test('grazing builds combo with a global cooldown and resets on hit', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  const bullet = createMessage(game.player.x + 40, game.player.y, 0, 0);
  game.bullets.push(bullet);
  game.update(1 / 60);
  assert.equal(game.combo, 1);
  assert.equal(game.maxCombo, 1);
  assert.equal(bullet.grazed, true);

  const blocked = createMessage(game.player.x + PLAYER_BODY.offsetX - 45, game.player.y, 0, 0);
  game.bullets.push(blocked);
  game.update(1 / 60);
  assert.equal(game.combo, 1);
  assert.equal(blocked.grazed, false);

  for (let frame = 0; frame < 30; frame++) {
    game.bullets.length = 0;
    game.update(1 / 60);
  }
  const third = createMessage(game.player.x + 42, game.player.y, 0, 0);
  game.bullets.push(third);
  game.update(1 / 60);
  assert.equal(game.combo, 2);
  assert.ok(Math.abs(game.comboMultiplier - 1.1) < 1e-9);

  game.invulnerableTime = 0;
  game.hitPlayer();
  assert.equal(game.combo, 0);
});

test('skimming a folder edge rewards a gap clear once per wall', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.player.y = 500;
  const pushWall = (playerX) => {
    game.player.x = playerX;
    const shape = createFolderWall(FIELD_WIDTH, 0.5, 124, game.player.y + PLAYER_BODY.bottom, 0);
    game.walls.push({ gapStart: shape.gapStart, gapEnd: shape.gapEnd, evaluated: false, orbs: shape.orbs });
    game.bullets.push(...shape.orbs);
    game.update(1 / 60);
  };
  pushWall(360); // 缺口正中：不给奖励
  assert.equal(game.gapClears, 0);
  const wall = createFolderWall(FIELD_WIDTH, 0.5, 124, game.player.y + PLAYER_BODY.bottom, 0);
  const leftFolder = wall.orbs.filter((orb) => orb.x < 360).at(-1);
  pushWall(leftFolder.x + leftFolder.radius + game.player.radius - PLAYER_BODY.offsetX + 3); // 贴边余量 3px：+50 且不受击
  assert.equal(game.gapClears, 1);
  assert.equal(game.workload, 0);
  assert.ok(game.bonusScore >= 50);
});

test('leave slip pickup clears the field, scores 10 per bullet and grants a short safety window', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.bullets.length = 0;
  game.bullets.push(createMessage(game.player.x + 200, game.player.y, 0, 0));
  game.bullets.push(createRequirement(game.player.x + 240, game.player.y, 0, 0, () => 0.5));
  const bonusBefore = game.bonusScore;
  game.leaveSlips.push({ kind: 'leave', x: game.player.x, y: game.player.y, radius: 16, alive: true, life: 12, spin: 0 });
  game.update(1 / 60);
  assert.equal(game.leaveSlipCount, 1);
  assert.equal(game.bullets.length, 0);
  assert.ok(game.invulnerableTime > 0.9);
  assert.equal(game.bonusScore - bonusBefore, 20);
});

test('leave slip rolls are throttled and only spawn on a lucky roll', () => {
  const unlucky = new GameModel(() => 0.99);
  unlucky.reset();
  unlucky.leaveSlipRollTimer = 0.01;
  unlucky.update(1 / 60);
  assert.equal(unlucky.leaveSlips.length, 0);
  assert.ok(unlucky.leaveSlipRollTimer > 27);

  const lucky = new GameModel(() => 0.1);
  lucky.reset();
  lucky.leaveSlipRollTimer = 0.01;
  lucky.update(1 / 60);
  assert.equal(lucky.leaveSlips.length, 1);
  assert.equal(lucky.leaveSlips[0].life > 11, true);
});

test('AI pickups appear only for damaged players and match the remaining workload', () => {
  const game = new GameModel(() => 0.1);
  game.reset(); game.invulnerableTime = 999;
  game.aiPickupRollTimer = 0.01;
  game.update(1 / 60);
  assert.equal(game.aiPickups.length, 0);
  game.workload = 1; game.aiPickupRollTimer = 0.01;
  game.update(1 / 60);
  assert.equal(game.aiPickups[0].kind, 'helper');
  game.workload = 2; game.aiPickups.length = 0; game.aiPickupRollTimer = 0.01;
  game.update(1 / 60);
  assert.equal(game.aiPickups[0].kind, 'agent');
  game.workload = 1;
  game.update(1 / 60);
  assert.equal(game.aiPickups.some(item => item.kind === 'agent'), false);
});

test('AI helper and faster agent remove one and two workload slots on contact', () => {
  const game = new GameModel(() => 0.99);
  game.reset(); game.invulnerableTime = 999;
  for (const [kind, workload, expected] of [['helper', 2, 1], ['agent', 2, 0]]) {
    game.workload = workload;
    game.aiPickups.push({ kind, x: game.player.x, y: game.player.y, vx: 0, vy: 0,
      radius: 27, alive: true, life: 5, phase: 0 });
    game.update(1 / 60);
    assert.equal(game.workload, expected);
    assert.equal(game.aiPickups.length, 0);
  }
  const fast = new GameModel(() => 0.1), slow = new GameModel(() => 0.5);
  for (const model of [fast, slow]) {
    model.reset(); model.workload = 2; model.aiPickupRollTimer = 0.01;
    model.invulnerableTime = 999; model.update(1 / 60);
  }
  assert.equal(fast.aiPickups[0].kind, 'agent');
  assert.equal(slow.aiPickups[0].kind, 'helper');
  const speed = item => Math.hypot(item.vx, item.vy);
  assert.ok(speed(fast.aiPickups[0]) > speed(slow.aiPickups[0]) * 2);
});

function laughGame(roll) {
  const game = new GameModel(() => roll);
  game.reset(); game.wave = 3; game.invulnerableTime = 999;
  game.requirementTimer = game.wallTimer = game.skillTimer = 999;
  game.messageTimer = 0.01;
  return game;
}

test('red message laugh includes the increased 35 percent boundary', () => {
  for (const roll of [0, 0.16, 0.349999, 0.35, 0.9]) {
    const game = laughGame(roll);
    game.update(1 / 60);
    const expected = roll < .35;
    assert.equal(game.takeEvents().filter(event => event.type === 'evil-laugh').length, expected ? 1 : 0, String(roll));
    assert.equal(game.bullets.some(bullet => bullet.kind === 'message' && bullet.tauntTime > 0), expected);
    if (expected) assert.ok(game.evilLaughCooldown >= 12 && game.evilLaughCooldown < 24);
  }
});

test('red message laugh waits for its shorter cooldown and freezes while paused', () => {
  const lucky = laughGame(0.1);
  lucky.update(1 / 60);
  assert.equal(lucky.takeEvents().filter(event => event.type === 'evil-laugh').length, 1);
  assert.equal(lucky.evilLaughCooldown, 13.2);
  lucky.messageTimer = 0.01;
  lucky.update(1 / 60);
  assert.equal(lucky.takeEvents().filter(event => event.type === 'evil-laugh').length, 0);
  lucky.paused = true;
  const remaining = lucky.evilLaughCooldown;
  for (let i = 0; i < 60; i++) lucky.update(1 / 60);
  assert.equal(lucky.evilLaughCooldown, remaining);
  lucky.paused = false; lucky.practiceProtected = true;
  for (let i = 0; i < 800; i++) lucky.update(1 / 60);
  assert.equal(lucky.evilLaughCooldown, 0);
  lucky.practiceProtected = false; lucky.bullets.length = 0; lucky.messageTimer = 0.01;
  lucky.takeEvents(); lucky.update(1 / 60);
  assert.equal(lucky.takeEvents().filter(event => event.type === 'evil-laugh').length, 1);
});

test('rank thresholds follow the confirmed table and gate S on a risk grade', () => {
  assert.equal(rankFor(12, 12000, 'S'), 'S · 摸鱼大师');
  assert.equal(rankFor(12, 12000, 'A'), 'A · 摸鱼高手'); // 少了操作评价 S：S 级不放行
  assert.equal(rankFor(12, 12000, null), 'A · 摸鱼高手');
  assert.equal(rankFor(11, 20000, 'S'), 'A · 摸鱼高手');
  assert.equal(rankFor(12, 11999, 'S'), 'A · 摸鱼高手');
  assert.equal(rankFor(9, 7000), 'A · 摸鱼高手');
  assert.equal(rankFor(6, 3500), 'B · 合格摸鱼');
  assert.equal(rankFor(5, 20000), 'C · 打工仔');
});

test('hard phase runs non-stop: no intermission, no instant clear, one step per 60 seconds', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.invulnerableTime = 999;
  game.bullets.length = 0;
  game.wave = 3;
  game.waveTimer = 59.99;
  game.bullets.push(createMessage(game.player.x + 300, 200, 0, 0));
  game.update(1 / 60);
  assert.equal(game.wave, 4, 'hard step should advance the wave');
  assert.equal(game.waveState, 'running', 'hard phase must never enter intermission');
  assert.equal(game.bullets.length, 1, 'hard step must not clear the field');
  game.waveTimer = 59.99;
  game.update(1 / 60);
  assert.equal(game.wave, 5);
  assert.equal(game.waveState, 'running');
  assert.ok(game.bonusScore >= 200, `hard step bonus was ${game.bonusScore}`);
});

test('break-lock bursts award B, A then S grades with escalating bonuses', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.invulnerableTime = 999;
  const pushHoming = () => {
    const message = createMessage(game.player.x - 340, game.player.y, 0, 0);
    message.state = 'homing';
    message.homingTime = 0.001;
    game.bullets.push(message);
  };
  game.takeEvents();
  pushHoming(); pushHoming();
  game.update(1 / 60);
  pushHoming();
  game.update(1 / 60);
  pushHoming();
  game.update(1 / 60);
  const grades = game.takeEvents().filter((event) => event.type === 'grade');
  assert.deepEqual(grades.map((event) => event.grade), ['B', 'A', 'S']);
  assert.ok(grades.every((event) => event.label === '甩脱爆发'));
  assert.equal(game.gradeCount, 3);
  assert.equal(game.bestGrade, 'S');
  assert.equal(game.bonusScore, 4 * 30 + 80 + 160 + 300);
});

test('threading two gaps within the chain window awards a B grade', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.invulnerableTime = 999;
  game.player.y = 500;
  const pushWall = (playerX) => {
    game.player.x = playerX;
    const shape = createFolderWall(FIELD_WIDTH, 0.5, 124, game.player.y + PLAYER_BODY.bottom, 0);
    game.walls.push({ gapStart: shape.gapStart, gapEnd: shape.gapEnd, evaluated: false, orbs: shape.orbs });
    game.bullets.push(...shape.orbs);
    game.update(1 / 60);
  };
  game.takeEvents();
  const shape = createFolderWall(FIELD_WIDTH, 0.5, 124, game.player.y + PLAYER_BODY.bottom, 0);
  const leftFolder = shape.orbs.filter((orb) => orb.x < 360).at(-1);
  const edge = leftFolder.x + leftFolder.radius + game.player.radius - PLAYER_BODY.offsetX;
  pushWall(edge + 3);
  pushWall(edge + 5);
  const grades = game.takeEvents().filter((event) => event.type === 'grade');
  assert.equal(grades.length, 1);
  assert.equal(grades[0].grade, 'B');
  assert.equal(grades[0].label, '穿缝连击');
  assert.equal(game.gapClears, 2);
});

test('graze chains award B, A and S at 6, 10 and 15 hits', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.invulnerableTime = 999;
  const graze = () => {
    game.grazeCooldown = 0;
    game.bullets.length = 0;
    game.bullets.push(createMessage(game.player.x + 37, game.player.y, 0, 0));
    game.update(1 / 60);
  };
  game.takeEvents();
  for (let i = 0; i < 15; i++) graze();
  const grades = game.takeEvents().filter((event) => event.type === 'grade');
  assert.deepEqual(grades.map((event) => event.grade), ['B', 'A', 'S']);
  assert.ok(grades.every((event) => event.label === '擦弹大师'));
  assert.equal(game.bestGrade, 'S');
  assert.equal(game.bonusScore, 60 + 140 + 260);
});

test('wave 1 opens with a three-bullet volley so the field is never empty', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  assert.equal(game.bullets.length, 3);
  assert.ok(game.bullets.every((bullet) => bullet.kind === 'requirement'));
  const xs = game.bullets.map((bullet) => bullet.x).sort((a, b) => a - b);
  assert.ok(xs[0] < 0, 'volley enters from the left edge');
  assert.ok(xs[xs.length - 1] > FIELD_WIDTH, 'volley enters from the right edge');
});

test('a released message must leave the sense radius before locking again', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.wave = 3;
  game.bullets.length = 0;
  const message = createMessage(200, game.player.y, 0, 0);
  game.bullets.push(message);
  game.update(1 / 60);
  assert.equal(message.state, 'homing'); // 进入感应圈：立即锁定
  message.homingTime = 0.001;
  game.update(1 / 60);
  assert.equal(message.state, 'cruise'); // 追踪结束：放弃
  game.update(1 / 60);
  assert.equal(message.state, 'cruise'); // 仍在圈内：不会立刻再次锁定
  game.player.x = 440; // 离开感应圈：重新武装
  game.update(1 / 60);
  assert.equal(message.state, 'cruise');
  game.player.x = 300; // 再次进入感应圈：重新锁定
  game.update(1 / 60);
  assert.equal(message.state, 'homing');
});

test('messages reserve space for purple tasks without exceeding the shared cap', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.wave = 3;
  game.bullets.length = 0;
  const cap = waveConfigFor(3).maxThreats;
  for (let index = 0; index < cap - 2; index += 1) {
    game.bullets.push(createMessage(60 + index * 40, 1000, 0, 0));
  }
  game.messageTimer = game.requirementTimer = 0;
  game.update(1 / 60);
  const requirements = game.bullets.filter((bullet) => bullet.kind === 'requirement');
  const messages = game.bullets.filter((bullet) => bullet.kind === 'message');
  assert.equal(requirements.length, 1);
  assert.equal(messages.length, cap - 2);
  game.messageTimer = game.requirementTimer = 0;
  game.update(1 / 60);
  assert.equal(game.bullets.filter(b => b.kind === 'requirement').length, 2);
  assert.equal(game.bullets.filter(b => b.kind !== 'folder').length, cap);
});

test('hard curve continues tightening after two minutes with readable limits', () => {
  const early = waveConfigFor(4, 44);
  const later = waveConfigFor(5, 44);
  assert.ok(later.messageInterval < early.messageInterval);
  assert.ok(later.requirementInterval < early.requirementInterval);
  assert.ok(later.wallInterval < early.wallInterval);
  assert.ok(later.gapWidth < early.gapWidth);
  assert.ok(later.maxThreats > early.maxThreats);
  assert.ok(later.speedScale > early.speedScale);
  assert.ok(later.maxHoming <= 2 && later.speedScale <= 1.22 && later.gapWidth >= 144);
});

test('invalid frame and input values cannot poison a running game', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  const before = { elapsed: game.elapsed, x: game.player.x, y: game.player.y };
  for (const value of [NaN, Infinity, -Infinity]) {
    game.update(value);
    game.movePlayer(value, 300);
    game.movePlayer(300, value);
    game.addEnergy(value);
  }
  assert.equal(game.elapsed, before.elapsed);
  assert.deepEqual({ x: game.player.x, y: game.player.y }, { x: before.x, y: before.y });
  assert.equal(game.energy, 0);
  game.update(1 / 60);
  assert.ok(game.elapsed > 0 && Number.isFinite(game.score));
});
