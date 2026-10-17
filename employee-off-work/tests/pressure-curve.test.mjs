import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, createMessage, hardTierFor, waveConfigFor, HARD_TIER_SECONDS, HARD_LATE_TIER_SECONDS, HARD_RAMP_SECONDS } from '../assets/scripts/model/GameModel.ts';

const configAt = seconds => waveConfigFor(3 + Math.floor(seconds / 60), seconds % 60);

const safeGame = () => {
  const game = new GameModel(() => 0.5);
  game.reset(); game.invulnerableTime = 999;
  return game;
};

test('natural opening reaches hard at 24 seconds and phase two never creates red messages', () => {
  const game = safeGame();
  let sawWall = false;
  while (game.elapsed < 23.95) {
    game.update(0.01); game.takeEvents();
    assert.ok(game.wave < 3);
    assert.ok(game.bullets.every(b => b.kind !== 'message'));
    if (game.wave === 2 && game.folderWalls.length) sawWall = true;
  }
  assert.ok(sawWall, 'yellow rows actually enter during the second phase');
  while (game.wave < 3) game.update(0.01);
  assert.ok(game.elapsed >= 24 && game.elapsed < 24.04);
  assert.equal(game.config.maxHoming, 1);
  assert.equal(game.config.messageInterval, 3.4);
  assert.ok(game.messageTimer >= 3.39 && game.wallTimer >= 4.99, 'hard arrivals are staggered');
});

test('45-second early and 30-second late targets ramp over 12 seconds without scoring-wave jumps', () => {
  assert.equal(HARD_TIER_SECONDS, 45); assert.equal(HARD_LATE_TIER_SECONDS, 30); assert.equal(HARD_RAMP_SECONDS, 12);
  for (const boundary of [45,90,135,180,225,270,300,330,360]) {
    const before = configAt(boundary - 0.001);
    const start = configAt(boundary);
    const middle = configAt(boundary + 6);
    const end = configAt(boundary + 12);
    assert.ok(Math.abs(start.messageInterval - before.messageInterval) < 1e-6);
    assert.ok(start.messageInterval > middle.messageInterval && middle.messageInterval > end.messageInterval);
    assert.ok(start.gapWidth > middle.gapWidth && middle.gapWidth > end.gapWidth);
    assert.ok(start.speedScale < middle.speedScale && middle.speedScale < end.speedScale);
  }
  for (const boundary of [60,120,180,240,300,360]) {
    const before = configAt(boundary - 0.001), after = configAt(boundary);
    assert.ok(Math.abs(before.messageInterval - after.messageInterval) < 0.001);
    assert.ok(Math.abs(before.speedScale - after.speedScale) < 0.001);
  }
});

test('first six pressure peaks have progressively denser threats and narrower reachable gaps', () => {
  const intervals = [3.4,3.1,2.8,2.4,2.15,1.9];
  const requirementIntervals = [2.2,2.15,2.1,2,1.95,1.9];
  const speedScales = [1.04,1.06,1.08,1.11,1.13,1.15];
  const homing = [1,1,1,1,2,2];
  for (let tier = 0; tier < 6; tier += 1) {
    const seconds = tier * 45 + 12;
    const config = configAt(seconds);
    assert.equal(config.messageInterval,intervals[tier]);
    assert.equal(config.requirementInterval,requirementIntervals[tier]);
    assert.equal(config.speedScale,speedScales[tier]);
    assert.equal(config.maxHoming,homing[tier]);
    assert.equal(config.maxThreats,7 + tier + (tier >= 2 ? 1 : 0));
    assert.equal(config.gapWidth,180 - tier * 4);
  }
});

test('first three hard minutes retain one lock and ample room, without density spikes', () => {
  let previous=configAt(0);
  for(let second=1;second<180;second++){
    const config=configAt(second);
    assert.equal(config.maxHoming,1);
    assert.ok(config.messageInterval>=2.4&&config.speedScale<=1.11&&config.gapWidth>=168&&config.maxThreats<=11);
    assert.ok(previous.messageInterval-config.messageInterval<=0.05);
    assert.ok(config.maxThreats-previous.maxThreats<=1);
    previous=config;
  }
});

test('pressure never retreats after the strengthened sixth tier, including its late handoff', () => {
  let previous = configAt(225 + HARD_RAMP_SECONDS);
  for (let seconds = 238; seconds <= 2400; seconds++) {
    const current = configAt(seconds);
    for (const key of ['messageInterval', 'requirementInterval', 'wallInterval', 'gapWidth']) {
      assert.ok(current[key] <= previous[key] + 1e-9, `${key} eased at hard second ${seconds}`);
    }
    for (const key of ['speedScale', 'maxThreats', 'maxHoming']) {
      assert.ok(current[key] >= previous[key], `${key} eased at hard second ${seconds}`);
    }
    previous = current;
  }
});

test('late tiers advance at 270, 300 and 330 seconds with the revised shared cap', () => {
  for (const [seconds, tier] of [[269.999, 6], [270, 7], [299.999, 7], [300, 8], [329.999, 8], [330, 9]]) {
    assert.equal(hardTierFor(seconds), tier);
  }
  for (const [seconds, cap] of [[90 + 12, 10], [225 + 12, 13], [270 + 12, 13], [300 + 12, 14], [330 + 12, 14], [360 + 12, 15], [420 + 12, 16]]) {
    assert.equal(configAt(seconds).maxThreats, cap);
  }
  const game = safeGame();
  game.wave = 7; game.waveTimer = 59.99;
  game.messageTimer = game.requirementTimer = game.wallTimer = game.skillTimer = 999;
  game.update(0.02);
  assert.equal(game.wave, 8);
  assert.equal(game.difficultyTier, 8);
  assert.equal(game.takeEvents().filter(event => event.type === 'difficulty-step').length, 1);
  game.update(0.02);
  assert.equal(game.takeEvents().filter(event => event.type === 'difficulty-step').length, 0);
});

test('a natural five-minute run never exceeds shared threats or concurrent locks', () => {
  const game=safeGame();let frames=0,peak=0;
  while(game.elapsed<300){
    game.update(1/60);game.takeEvents();frames++;
    const threats=game.bullets.filter(b=>b.kind!=='folder');
    peak=Math.max(peak,threats.length);
    assert.ok(threats.length<=game.config.maxThreats);
    const locks=threats.filter(b=>b.state==='homing').length;
    assert.ok(locks<=(game.wave<3?0:game.hardElapsed<180?1:2));
  }
  assert.ok(frames>=18000&&peak>0&&!game.gameOver);
});

test('tier notice occurs once without extra reward and pauses/tutorial do not advance pressure', () => {
  const game = safeGame();
  game.wave = 3; game.waveTimer = 44.99;
  game.messageTimer = game.requirementTimer = game.wallTimer = game.skillTimer = 999;
  game.bullets.length = 0;
  game.paused = true; game.update(0.02);
  assert.equal(game.waveTimer,44.99); assert.equal(game.takeEvents().length,0);
  game.paused = false; game.practiceProtected = true; game.update(0.02);
  assert.equal(game.waveTimer,44.99); assert.equal(game.takeEvents().length,0);
  game.practiceProtected = false; game.update(0.02);
  assert.deepEqual(game.takeEvents(),[{ type:'difficulty-step',tier:2 }]);
  assert.equal(game.bonusScore,0);
  game.update(0.02); assert.equal(game.takeEvents().length,0);
  game.waveTimer = 59.99; game.update(0.02);
  const events = game.takeEvents();
  assert.equal(events.filter(e => e.type === 'hard-step').length,1);
  assert.deepEqual(events.filter(e => e.type === 'difficulty-step'),[]);
  assert.equal(game.wave,4); assert.equal(game.difficultyTier,2);
  game.reset(); assert.equal(game.difficultyTier,0);
});

test('central update limits concurrent locks and admits another after an existing lock releases', () => {
  assert.equal(configAt(551.999).maxHoming, 2);
  assert.equal(configAt(552).maxHoming, 3);
  for (const [wave,time,cap] of [[3,12,1],[5,59,1],[6,12,2],[12,0,2],[12,11.95,2],[12,12,3],[60,12,3]]) {
    const game = safeGame(); game.wave = wave; game.waveTimer = time;
    game.bullets.length = 0;
    game.messageTimer = game.requirementTimer = game.wallTimer = game.skillTimer = 999;
    for (let i = 0; i < 6; i++) game.bullets.push(createMessage(game.player.x + 100 + i * 10,game.player.y,0,-10));
    game.update(0.01);
    assert.equal(game.bullets.filter(b => b.state === 'homing').length,cap);
    const first = game.bullets[0]; first.homingTime = 0;
    game.update(0.01); game.update(0.01);
    assert.equal(first.state,'cruise'); assert.equal(first.armed,false);
    assert.equal(game.bullets.filter(b => b.state === 'homing').length,cap);
    assert.ok(game.bullets[cap].state === 'homing');
  }
});

test('brief breathing slows new threats while existing bullets and fish timers keep moving', () => {
  const normal = safeGame(), breathing = safeGame();
  for (const [game,time] of [[normal,8],[breathing,41]]) {
    game.wave = 3; game.waveTimer = time; game.bullets.length = 0;
    game.bullets.push(createMessage(100,1000,0,-100));
    game.messageTimer = game.requirementTimer = 0.3;
    game.wallTimer = 0; game.skillTimer = 1;
    game.update(0.05);
  }
  assert.equal(normal.bullets[0].y,995); assert.equal(breathing.bullets[0].y,995);
  assert.ok(breathing.messageTimer > normal.messageTimer);
  assert.ok(breathing.requirementTimer > normal.requirementTimer);
  assert.equal(normal.skillTimer,breathing.skillTimer);
  assert.equal(normal.folderWalls.length,1); assert.equal(breathing.folderWalls.length,0);
  assert.equal(breathing.paused,false);
  for (const [seconds, expected] of [[294.99, false], [295, true], [299.99, true], [300, false], [324.99, false], [325, true]]) {
    breathing.wave = 3 + Math.floor(seconds / 60);
    breathing.waveTimer = seconds % 60;
    assert.equal(breathing.pressureBreathing, expected, `hard second ${seconds}`);
  }
});

test('an active collector can get five naturally spawned fish before 20 seconds', () => {
  const game = safeGame();
  while (game.elapsed < 20 && game.energy < 100) {
    for (const fish of game.skillOrbs) game.movePlayer(fish.x,fish.y);
    game.update(0.01); game.takeEvents();
  }
  assert.equal(game.energy,100);
  assert.ok(game.elapsed < 20);
});

test('side entry and fish spawning keep reaction/movement distance even at field corners', () => {
  for (const random of [() => 0,() => 0.5,() => 0.999]) {
    const game = new GameModel(random); game.reset();
    game.bullets.length = 0; game.movePlayer(34,130);
    game.skillTimer = game.requirementTimer = 0;
    game.update(0.01);
    const purple = game.bullets.find(b => b.kind === 'requirement');
    assert.ok(Math.hypot(purple.x - game.player.x,purple.y - game.player.y) > 235);
    const fish = game.skillOrbs[0];
    assert.ok(Math.hypot(fish.x - game.player.x,fish.y - game.player.y) >= 100);
    assert.ok(Math.hypot(fish.x - game.player.x,fish.y - game.player.y) < 300);
  }
});
