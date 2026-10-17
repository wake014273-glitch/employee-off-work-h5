import test from 'node:test';
import assert from 'node:assert/strict';
import { LoadingProgress, retryLoad } from '../assets/scripts/model/AsyncLoading.ts';

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
