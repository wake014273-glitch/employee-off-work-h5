import test from 'node:test';
import assert from 'node:assert/strict';
import { GameModel, createMessage, createRequirement } from '../assets/scripts/model/GameModel.ts';
import { ResumeCountdown } from '../assets/scripts/model/GameExperience.ts';

const setup = () => {
  const game = new GameModel(); game.reset(); game.bullets.length = 0;
  game.messageTimer = game.requirementTimer = game.wallTimer = game.skillTimer = 999;
  return game;
};
const fish = game => ({kind:'skill',x:game.player.x,y:game.player.y,radius:17,alive:true,pulse:0});

test('full charge still consumes fish without extra energy or repeated charge gains', () => {
  const game = setup(); game.energy = 80;
  const first = fish(game), extra = fish(game); game.skillOrbs.push(first, extra);
  game.update(0.02);
  assert.equal(game.energy,100); assert.equal(first.alive,false); assert.equal(extra.alive,false);
  assert.deepEqual(game.skillOrbs,[]); assert.deepEqual(game.takeEvents().filter(e=>e.type==='pickup').map(e=>e.gained),[20,0]);
  const overflow=fish(game);game.skillOrbs.push(overflow);game.update(0.02);
  assert.equal(overflow.alive,false);assert.equal(game.energy,100);assert.equal(game.takeEvents()[0].gained,0);
  const protectedFish=fish(game);game.skillOrbs.push(protectedFish);game.activateShield(); game.takeEvents(); game.update(0.02);
  assert.equal(protectedFish.alive,true); assert.equal(game.energy,0);
  game.shieldTime = 0; game.update(0.02);
  assert.equal(protectedFish.alive,false); assert.equal(game.energy,20);
});

test('shield collision gives bounded block events without damage, bullet removal or risk rewards', () => {
  const game = setup(); game.shieldTime = 3;
  const bullet = createMessage(game.player.x,game.player.y,0,0); game.bullets.push(bullet);
  game.update(0.02);
  assert.equal(game.workload,0); assert.equal(bullet.alive,true);
  assert.equal(game.takeEvents().filter(e=>e.type==='shield-block').length,1);
  assert.equal(game.bonusScore,0); assert.equal(game.combo,0); assert.equal(game.invulnerableTime,0);
  for(let i=0;i<10;i++)game.update(0.02);
  assert.equal(game.takeEvents().filter(e=>e.type==='shield-block').length,0);
  game.paused = true; const shield = game.shieldTime; game.update(1);
  assert.equal(game.shieldTime,shield); assert.equal(game.takeEvents().length,0);
  game.paused = false; game.update(0.03);
  assert.equal(game.takeEvents().filter(e=>e.type==='shield-block').length,1);
  game.shieldTime = 0; game.update(0.02);
  const events=game.takeEvents(); assert.equal(events.filter(e=>e.type==='hit').length,1);
  assert.equal(events.filter(e=>e.type==='shield-block').length,0); assert.equal(game.workload,1);
});

test('shield block feedback requires a collision and reset clears its cooldown', () => {
  const game = setup(); game.shieldTime = 3;
  game.bullets.push(createMessage(game.player.x+100,game.player.y,0,0)); game.update(0.02);
  assert.equal(game.takeEvents().some(e=>e.type==='shield-block'),false);
  game.bullets[0].x=game.player.x;game.update(0.02);assert.equal(game.takeEvents()[0].type,'shield-block');
  game.reset();game.bullets.length=0;game.shieldTime=3;
  game.bullets.push(createMessage(game.player.x,game.player.y,0,0));game.update(0.02);
  assert.equal(game.takeEvents().some(e=>e.type==='shield-block'),true);
});

test('requirement cue starts on the actual immediate turn, then decays and freezes on pause', () => {
  const game=setup();const bullet=createRequirement(100,game.player.y+200,40,-80,()=>0.8);
  bullet.turnTimer=0.05;game.bullets.push(bullet);game.update(0.02);
  assert.equal(bullet.turnFlash,0);assert.equal(bullet.vx,40);assert.equal(bullet.vy,-80);
  game.update(0.04);assert.equal(bullet.turnFlash,0.26);assert.equal(bullet.turnDirection,1);
  assert.notEqual(bullet.vx,40);assert.ok(Math.abs(Math.hypot(bullet.vx,bullet.vy)-Math.hypot(40,-80))<1e-8);
  const snapshot={x:bullet.x,y:bullet.y,flash:bullet.turnFlash,timer:bullet.turnTimer};
  game.paused=true;game.update(1);assert.deepEqual({x:bullet.x,y:bullet.y,flash:bullet.turnFlash,timer:bullet.turnTimer},snapshot);
  game.paused=false;game.update(0.02);assert.ok(bullet.turnFlash<0.26);
  for(let i=0;i<20;i++)game.update(0.02);assert.equal(bullet.turnFlash,0);
});

test('resume countdown produces 3, 2, 1 and one completion, ignores hidden and invalid frames', () => {
  const countdown=new ResumeCountdown();assert.equal(countdown.advance(0.05),false);
  countdown.start();assert.equal(Math.ceil(countdown.remaining),3);
  for(const dt of [NaN,Infinity,-1,0])assert.equal(countdown.advance(dt),false);
  countdown.advance(10,false);assert.equal(countdown.remaining,3);
  const ticks=new Set();let completions=0;
  for(let i=0;i<185;i++){if(countdown.active)ticks.add(Math.ceil(countdown.remaining));if(countdown.advance(1/60))completions++;}
  assert.deepEqual([...ticks],[3,2,1]);assert.equal(completions,1);assert.equal(countdown.active,false);
  countdown.start();countdown.advance(120);assert.ok(countdown.remaining>=2.9);
  countdown.cancel();assert.equal(countdown.advance(0.1),false);assert.equal(countdown.active,false);
});

test('model resources, shield, attacks and score stay frozen throughout resume countdown', () => {
  const game=setup();game.shieldTime=2;game.energy=40;game.bullets.push(createMessage(80,800,20,-60));game.skillOrbs.push(fish(game));
  const countdown=new ResumeCountdown();countdown.start();game.paused=true;
  const snapshot=JSON.stringify({stats:game.stats(),shield:game.shieldTime,energy:game.energy,bullet:game.bullets[0],fish:game.skillOrbs[0]});
  for(let i=0;i<180;i++){countdown.advance(1/60);game.update(1/60);}
  assert.equal(JSON.stringify({stats:game.stats(),shield:game.shieldTime,energy:game.energy,bullet:game.bullets[0],fish:game.skillOrbs[0]}),snapshot);
  while(countdown.active)countdown.advance(1/60);
  game.paused=false;game.update(1/60);assert.ok(game.elapsed>0);assert.ok(game.shieldTime<2);
});
