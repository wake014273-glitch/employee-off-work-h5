import test from 'node:test';
import assert from 'node:assert/strict';
import { PortraitMotion } from '../assets/scripts/model/PortraitMotion.ts';

test('portrait ramps up over 0.3 seconds, relaxes over 0.5, and can reverse mid-transition', () => {
  const motion = new PortraitMotion();
  motion.advance(0, 0);
  motion.advance(1, 0.15); assert.equal(motion.pressure, 0.5);
  motion.advance(1, 0.15); assert.equal(motion.pressure, 1);
  motion.advance(2, 0.15); assert.equal(motion.pressure, 1.5);
  motion.advance(0, 0); assert.equal(motion.pressure, 1.5);
  motion.advance(0, 0.25); assert.equal(motion.pressure, 0.75);
  motion.advance(0, 0.25); assert.equal(motion.pressure, 0);
});

test('paused face is stable, a replay resets all motion, and a third hit caps expression at panic', () => {
  const motion = new PortraitMotion();
  motion.advance(2, 3.55);
  const sample = () => [motion.pressure, motion.clock, motion.breath, motion.blink, motion.glance, motion.tremble];
  const frozen = sample(); motion.advance(2, 0); assert.deepEqual(sample(), frozen);
  assert.ok(motion.blink > 0.99);
  motion.advance(3, 0); assert.equal(motion.workload, 2);
  motion.reset(); motion.advance(0, 0);
  assert.deepEqual(sample(), [0, 0, 0, 0, 0, 0]);
});

test('stress has an extra blink and bounded intermittent trembling, relaxed cat stays still', () => {
  const relaxed = new PortraitMotion(), anxious = new PortraitMotion();
  relaxed.advance(0, 3.82); anxious.advance(2, 3.82);
  assert.equal(relaxed.blink, 0); assert.ok(anxious.blink > 0.99);
  anxious.reset(); anxious.advance(2, 0.1);
  assert.ok(Math.abs(anxious.tremble) > 0); assert.ok(Math.abs(anxious.tremble) <= 0.55);
  anxious.advance(2, 0.4); assert.equal(anxious.tremble, 0);
  assert.equal(relaxed.tremble, 0);
});

test('worried and anxious gestures stay bounded, become faster, freeze and reset with frame playback', () => {
  const relaxed = new PortraitMotion(), worried = new PortraitMotion(), anxious = new PortraitMotion();
  let slowPeak = 0, fastPeak = 0, slowTurns = 0, fastTurns = 0, slowLast = 0, fastLast = 0;
  for (let i = 0; i < 1200; i++) {
    relaxed.advance(0, 1 / 120); worried.advance(1, 1 / 120); anxious.advance(2, 1 / 120);
    assert.ok(Math.abs(relaxed.roll) <= 1.2);
    assert.ok(Math.abs(worried.roll) <= 4 && Math.abs(worried.sway) <= 0.55 && Math.abs(worried.bob) <= 0.45);
    assert.ok(Math.abs(anxious.roll) <= 7.5 && Math.abs(anxious.sway) <= 1.32 && Math.abs(anxious.bob) <= 0.8);
    slowPeak = Math.max(slowPeak, Math.abs(worried.roll)); fastPeak = Math.max(fastPeak, Math.abs(anxious.roll));
    if (i && slowLast * worried.roll < 0) slowTurns++;
    if (i && fastLast * anxious.roll < 0) fastTurns++;
    slowLast = worried.roll; fastLast = anxious.roll;
    assert.ok(anxious.clipFrame >= 0 && anxious.clipFrame < 61);
  }
  assert.ok(fastPeak > slowPeak * 1.5 && fastTurns > slowTurns * 1.5);
  const sample = () => [anxious.roll, anxious.sway, anxious.bob, anxious.clipFrame, anxious.clock];
  const before = sample(); anxious.advance(2, 0); assert.deepEqual(sample(), before);
  anxious.advance(1, 0); assert.equal(anxious.clipFrame, 0);
  anxious.reset(); assert.deepEqual(sample(), [0, 0, 0, 0, 0]);
});
