import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, createFolderWall, FIELD_HEIGHT, FIELD_WIDTH } from '../assets/scripts/model/GameModel.ts';
import { ART_SCALE, DESIGN_HEIGHT, DESIGN_WIDTH, HUD_LAYOUT, HUD_SAFE_HEIGHT, PLAYER_BODY, PLAYER_ENERGY_BAR, playerEnergyBarPoint, SPRITE_SIZES, PAUSE_HIT_BOX, containsReferencePoint, viewportLayout, formatClock, HUD_BOTTOM, PLAYER_VISUAL_TOP, PLAYER_HUD_GAP, playerDragTop } from '../assets/scripts/model/GameLayout.ts';

test('portrait screens fill the viewport without stretching artwork or clipping the HUD', () => {
  for (const [width, height] of [[1080,2400], [390,844], [375,667], [430,932], [720,1800], [768,1024]]) {
    const layout = viewportLayout(width,height);
    assert.ok(Math.abs(DESIGN_WIDTH/layout.fieldHeight - width/height) < 1e-9);
    assert.ok(layout.backgroundWidth >= DESIGN_WIDTH && layout.backgroundHeight >= layout.fieldHeight);
    assert.ok(Math.abs(layout.backgroundWidth/layout.backgroundHeight - 1080/2400) < 1e-9);
    assert.ok(containsReferencePoint({x:67*ART_SCALE,y:layout.fieldHeight-309*ART_SCALE}, PAUSE_HIT_BOX,layout.fieldHeight));
    const game=new GameModel(); game.height=layout.fieldHeight;game.reset();
    assert.ok(game.player.y >= 90 && game.player.y < game.height-HUD_SAFE_HEIGHT);
  }
  assert.equal(SPRITE_SIZES.player.width,162);
  assert.equal(SPRITE_SIZES.player.height,162);
  assert.equal(new GameModel().player.radius,27);
});

test('five actual fish pickups fill energy once each, cap at five and reset on shield use', () => {
  const game=new GameModel();game.reset();game.bullets.length=0;
  game.messageTimer=game.requirementTimer=game.wallTimer=game.skillTimer=999;
  for(let count=1;count<=6;count++) {
    game.skillOrbs.push({kind:'skill',...game.player,alive:true,pulse:0});
    game.update(0.01);
    assert.equal(game.energy,Math.min(100,count*20));
  }
  assert.equal(game.activateShield(),true);
  assert.equal(game.energy,0);
  assert.equal(game.shieldTime,3);
});

test('upper boundary reserves space for the overhead energy capsule below the HUD on every screen', () => {
  for(const [width,height] of [[375,667],[390,844],[430,932],[360,900],[768,1024]]) {
    const game=new GameModel();game.height=viewportLayout(width,height).fieldHeight;
    game.movePlayer(360,99999);
    const bar = playerEnergyBarPoint(game.player);
    assert.ok(Math.abs(game.height-bar.y-PLAYER_ENERGY_BAR.height/2-HUD_BOTTOM-PLAYER_HUD_GAP)<1e-8);
    assert.ok(Math.abs(bar.y-PLAYER_ENERGY_BAR.height/2-game.player.y-PLAYER_VISUAL_TOP-PLAYER_ENERGY_BAR.headGap)<1e-8);
    assert.equal(PLAYER_ENERGY_BAR.width,72);
    assert.ok(PLAYER_ENERGY_BAR.width>PLAYER_BODY.radius*2);
    assert.ok(game.player.y<playerDragTop(game.height),'upper position also accepts a fresh drag');
  }
});

test('top messages and folder walls enter from beyond the screen with their shadows on every portrait aspect', () => {
  for (const [width, height] of [[375,667], [390,844], [430,932], [360,900], [768,1024]]) {
    const game = new GameModel(() => 0.5);
    game.height = viewportLayout(width, height).fieldHeight;
    game.reset(); game.bullets.length = 0; game.wave = 3;
    game.messageTimer = game.wallTimer = 0;
    game.requirementTimer = game.skillTimer = 999;
    game.update(0.01);
    const arrivals = game.bullets.filter(b => b.kind === 'message' || b.kind === 'folder');
    assert.ok(arrivals.some(b => b.kind === 'message') && arrivals.some(b => b.kind === 'folder'));
    for (const bullet of arrivals) {
      const size = SPRITE_SIZES[bullet.kind];
      const lowestPixel = bullet.y - Math.max(size.height / 2, size.height * (0.4 + 0.15 * 1.36));
      assert.ok(lowestPixel > game.height, 'body and soft shadow start beyond the top edge');
    }
    game.messageTimer = game.wallTimer = 999;
    for (let frame = 0; frame < 12; frame++) game.update(0.05);
    assert.ok(arrivals.every(b => b.alive && b.y < game.height && b.y > game.height - HUD_SAFE_HEIGHT),
      'arrivals traverse the office header before reaching the playable area');
  }
});

test('head and torso capsule matches the visible body and excludes the tail and atlas padding', () => {
  const game = new GameModel(); game.reset();
  const x = game.player.x + PLAYER_BODY.offsetX, y = game.player.y;
  // Exact contact against straight sides and both rounded caps.
  for (const point of [
    {x:x+27,y}, {x:x-27,y},
    {x,y:y+47.25}, {x,y:y-54},
  ]) assert.ok(Math.abs(game.playerClearance({...point,radius:0})) < 1e-9);
  assert.ok(game.playerClearance({x:x+26,y,radius:0}) < 0);
  assert.ok(game.playerClearance({x:x+28,y,radius:0}) > 0);
  assert.ok(game.playerClearance({x:game.player.x+48,y:y-18,radius:0}) > 0, 'tail is outside the body');
  assert.ok(game.playerClearance({x,y:y+60,radius:0}) > 0, 'ear tip / padding is outside the body');
  // Damage must use the same shape as the geometric boundary, including the upper body.
  game.bullets.length=0; game.messageTimer=game.requirementTimer=game.wallTimer=game.skillTimer=999;
  const bullet={kind:'message',x,y:y+47.25+5-0.1,radius:5,alive:true,grazed:false,update(){}};
  game.bullets.push(bullet); game.update(0.01);
  assert.equal(game.workload,1);
  game.workload=0;game.invulnerableTime=0;
  game.bullets.push({...bullet,y:y+47.25+5+0.1,alive:true}); game.update(0.01);
  assert.equal(game.workload,0);
  assert.equal(game.combo,1, 'near miss starts immediately outside the same body shape');
});

test('the approved portrait composition keeps its aspect and HUD fits the safe area', () => {
  assert.equal(DESIGN_WIDTH / DESIGN_HEIGHT, 1080 / 2400);
  assert.equal(FIELD_WIDTH, DESIGN_WIDTH);
  assert.equal(FIELD_HEIGHT, DESIGN_HEIGHT);
  for (const box of Object.values(HUD_LAYOUT)) {
    assert.ok(box.x >= 0 && box.x + box.width <= 1080);
    assert.ok((box.y + box.height) * ART_SCALE < HUD_SAFE_HEIGHT);
  }
  assert.equal(formatClock(155.9), '02:35');
  assert.equal(formatClock(3600), '60:00');
});

test('pause freezes the field, scoring, pickups, shield timer and movement; reset resumes', () => {
  const game = new GameModel(() => 0.5);
  game.reset();
  game.energy = 100;
  game.activateShield();
  game.update(0.02);
  game.takeEvents();
  game.paused = true;
  const before = JSON.stringify({ stats: game.stats(), player: game.player, bullets: game.bullets,
    shield: game.shieldTime, energy: game.energy, orbs: game.skillOrbs });
  for (let frame = 0; frame < 120; frame++) game.update(1 / 60);
  game.movePlayer(60, 900);
  assert.equal(game.activateShield(), false);
  assert.equal(game.hitPlayer(), false);
  assert.equal(JSON.stringify({ stats: game.stats(), player: game.player, bullets: game.bullets,
    shield: game.shieldTime, energy: game.energy, orbs: game.skillOrbs }), before);
  assert.deepEqual(game.takeEvents(), []);
  game.paused = false;
  game.update(0.02);
  assert.ok(game.elapsed > 0.02 && game.shieldTime < 2.98);
  game.paused = true;
  game.reset();
  assert.equal(game.paused, false);
});

test('folder artwork stays outside a reachable opening at every gap alignment', () => {
  const game = new GameModel();
  for (const gapWidth of [88, 124, 145, 160]) {
    for (const position of [0, 0.1, 0.5, 0.9, 1]) {
      const wall = createFolderWall(FIELD_WIDTH, position, gapWidth, 500, 0);
      const center = (wall.gapStart + wall.gapEnd) / 2;
      assert.ok(wall.orbs.every((orb) => Math.abs(orb.x - center) >= orb.radius + game.player.radius));
      assert.ok(wall.orbs.some((orb) => orb.x < center) && wall.orbs.some((orb) => orb.x > center));
    }
  }
});
