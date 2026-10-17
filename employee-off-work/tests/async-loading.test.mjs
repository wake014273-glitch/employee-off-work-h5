import test from 'node:test';
import assert from 'node:assert/strict';
import { LoadingProgress, retryLoad, loadingBarGeometry } from '../assets/scripts/model/AsyncLoading.ts';
import { FISH_CONTOUR } from '../scripts/startup-screen.mjs';

test('the fill edge is covered by the opaque fish body across every track row at every percentage', () => {
  const inside=(x,y)=>{
    let hit=false;
    FISH_CONTOUR.forEach(([ax,ay],i)=>{const [bx,by]=FISH_CONTOUR[(i+FISH_CONTOUR.length-1)%FISH_CONTOUR.length];
      if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;});
    return hit;
  };
  for(let percent=0;percent<=100;percent++){
    const bar=loadingBarGeometry(percent/100),edge=129+bar.fillPixels;
    for(let y=2027;y<=2107;y++)assert.ok(inside(edge-bar.fishLeft+420,y),`${percent}% at row ${y}`);
    assert.ok(bar.fillPixels>=0&&bar.fillPixels<=827);
  }
  assert.deepEqual(loadingBarGeometry(NaN),loadingBarGeometry(0));
  assert.deepEqual(loadingBarGeometry(-1),loadingBarGeometry(0));
  assert.deepEqual(loadingBarGeometry(2),loadingBarGeometry(1));
});

test('resource loader recovers a transient failure with one completed result', async () => {
  let attempts = 0; const retries = [];
  const value = await retryLoad(done => {
    if (++attempts === 1) done(new Error('network disconnected'));
    else done(null, { ready: true });
  }, { label: 'art', timeoutMs: 100, delayMs: 0, onRetry: n => retries.push(n) });
  assert.deepEqual(value, { ready: true }); assert.equal(attempts, 2); assert.deepEqual(retries, [2]);
});

test('a missing callback times out and its late completion cannot replace a successful retry', async () => {
  let first; let attempts = 0;
  const value = await retryLoad(done => {
    if (++attempts === 1) first = done;
    else { first(null, { stale: true }); done(null, { fresh: true }); }
  }, { label: 'bundle', timeoutMs: 10, delayMs: 0 });
  assert.deepEqual(value, { fresh: true }); assert.equal(attempts, 2);
});

test('permanent errors stop after bounded attempts, including synchronous platform exceptions', async () => {
  let attempts = 0;
  await assert.rejects(retryLoad(() => { attempts++; throw new Error('platform failed'); },
    { label: 'bundle', attempts: 3, timeoutMs: 100, delayMs: 0 }), /platform failed/);
  assert.equal(attempts, 3);
});

test('empty successful callbacks are treated as errors instead of leaving startup pending', async () => {
  await assert.rejects(retryLoad(done => done(null), { label: 'image', attempts: 1, timeoutMs: 100 }), /未返回资源/);
});

test('displayed progress never invents work or retreats across a cached handoff', () => {
  const progress = new LoadingProgress();
  progress.report(0.7);
  for (let i=0;i<10;i++) progress.advance(1/60);
  assert.ok(progress.value>0 && progress.value<0.7);
  const handoff = progress.value;
  progress.reset(handoff); progress.report(0.7); progress.report(0.2); progress.report(NaN);
  assert.equal(progress.value,handoff); assert.equal(progress.target,0.7);
  for(let i=0;i<120;i++)progress.advance(1/60);
  assert.equal(progress.value,0.7);
  progress.report(1); progress.advance(Infinity); assert.equal(progress.value,0.7);
  for(let i=0;i<60;i++)progress.advance(1/60);
  assert.equal(progress.value,1);
});

test('an invalidated loader never starts another request after its in-flight failure', async () => {
  let current=true,attempts=0,complete;
  const loading=retryLoad(done=>{attempts++;complete=done;}, {label:'destroyed scene',isCurrent:()=>current,delayMs:0});
  current=false; complete(new Error('scene changed'));
  await assert.rejects(loading,/scene changed/);assert.equal(attempts,1);
});
