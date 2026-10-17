import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerTrail, PLAYER_TRAIL } from '../assets/scripts/model/PlayerTrail.ts';
const pose = x => ({ x, y: 400 });

test('a fast swipe produces a connected distance-sampled trail anchored to the actual route', () => {
  const trail = new PlayerTrail();const start = pose(100);
  trail.advance(0,start);start.x=999;
  trail.advance(1/60,pose(240));
  const ribbon=trail.ribbon();assert.equal(ribbon[0].x,100);assert.equal(ribbon.at(-1).x,240);
  for(let i=1;i<ribbon.length;i++)assert.ok(Math.hypot(ribbon[i].x-ribbon[i-1].x,ribbon[i].y-ribbon[i-1].y)<=4);
  assert.equal(ribbon[0].radius,0);assert.equal(ribbon[0].alpha,0);
  assert.equal(ribbon.at(-1).radius,PLAYER_TRAIL.radius);assert.ok(ribbon.at(-1).alpha>=200);
});

test('trail has a fixed pool, freezes on pause and fades entirely after stopping', () => {
  const trail=new PlayerTrail();trail.advance(0,pose(100));
  for(let i=1;i<=60;i++)trail.advance(1/60,pose(100+i*4));
  assert.equal(trail.samples.length,PLAYER_TRAIL.capacity);
  assert.ok(trail.samples.some(s=>s.life>0));
  const frozen=JSON.stringify(trail.ribbon());
  for(let i=0;i<120;i++)trail.advance(0,pose(340));
  assert.equal(JSON.stringify(trail.ribbon()),frozen);
  for(let i=0;i<30;i++)trail.advance(1/60,pose(340));
  assert.ok(trail.samples.every(s=>s.life===0));assert.deepEqual(trail.ribbon(),[]);
});

test('restart and teleports clear old trails without drawing across the playfield', () => {
  const trail=new PlayerTrail();trail.advance(0,pose(100));trail.advance(0.03,pose(110));
  assert.ok(trail.samples.some(s=>s.life>0));
  trail.advance(0.03,pose(500));assert.ok(trail.samples.every(s=>s.life===0));
  trail.advance(0.03,pose(510));assert.equal(trail.ribbon()[0].x,500);
  trail.clear();assert.ok(trail.samples.every(s=>s.life===0));
});

test('curves and exact reversals stay finite, smooth and within the travelled route', () => {
  const trail=new PlayerTrail();trail.advance(0,pose(100));
  for(let x=104;x<=140;x+=4)trail.advance(1/60,pose(x));
  for(let y=404;y<=440;y+=4)trail.advance(1/60,{x:140,y});
  for(let y=436;y>=416;y-=4)trail.advance(1/60,{x:140,y});
  const points=trail.ribbon();assert.equal(points.at(-1).y,416);
  assert.ok(points.every(p=>Object.values(p).every(Number.isFinite)&&p.x>=100&&p.x<=140&&p.y>=400&&p.y<=440));
  assert.ok(points.some(p=>p.x<140&&p.y>400));
});

test('the ribbon remains bounded during long swipes and does not revive on stationary jitter', () => {
  const trail=new PlayerTrail();trail.advance(0,pose(100));
  for(let i=1;i<=80;i++)trail.advance(1/120,pose(100+i*10));
  const points=trail.ribbon();let length=0;
  for(let i=1;i<points.length;i++)length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
  assert.ok(length<=PLAYER_TRAIL.maxLength+0.001);
  for(let i=0;i<60;i++)trail.advance(1/60,pose(900+(i%2)*0.2));
  assert.deepEqual(trail.ribbon(),[]);
});
