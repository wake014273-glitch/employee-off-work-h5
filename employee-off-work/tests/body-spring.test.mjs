import test from 'node:test';
import assert from 'node:assert/strict';
import { BodySpring, BODY_SPRING, bodySpringWeight } from '../assets/scripts/model/BodySpring.ts';

test('feet remain anchored, the torso bends continuously and the face moves as a unit', () => {
  assert.equal(bodySpringWeight(-54), 0);
  assert.equal(bodySpringWeight(-42), 0);
  assert.ok(bodySpringWeight(-10) > 0 && bodySpringWeight(-10) < 1);
  assert.equal(bodySpringWeight(28), 1);
  assert.equal(bodySpringWeight(51), 1);
  let previous = 0;
  for (let y = -72; y <= 72; y++) {
    const weight = bodySpringWeight(y);
    assert.ok(weight >= previous && weight <= 1);
    assert.ok(weight - previous < 0.03);
    previous = weight;
  }
});

test('a drag pulls the head behind the feet; release rebounds and settles', () => {
  const spring = new BodySpring(), root = { x: 360, y: 350 };
  spring.reset(root);
  for (let i = 0; i < 20; i++) { root.x += 5; spring.advance(1 / 60, root); }
  assert.ok(spring.x < -8);
  assert.equal(root.x, 460);
  let rebound = false;
  for (let i = 0; i < 180; i++) { spring.advance(1 / 60, root); rebound ||= spring.x > 0.1; }
  assert.ok(rebound);
  assert.equal(spring.x, 0);
  assert.equal(spring.y, 0);
});

test('both directions of motion drive inertia, pauses freeze it, resets clear it', () => {
  const spring = new BodySpring(), root = { x: 360, y: 350 };
  spring.reset(root);
  for (let i = 0; i < 15; i++) { root.x -= 4; root.y += 2; spring.advance(1 / 60, root); }
  assert.ok(spring.x > 5 && spring.y < -3);
  const snapshot = { x: spring.x, y: spring.y };
  for (const dt of [0, -1, NaN, Infinity]) spring.advance(dt, root);
  assert.deepEqual({ x: spring.x, y: spring.y }, snapshot);
  for (let i = 0; i < 15; i++) { root.x += 4; spring.advance(1 / 60, root); }
  assert.ok(spring.x < -5);
  spring.reset({ x: 50, y: 800 });
  assert.equal(spring.x, 0); assert.equal(spring.y, 0);
  spring.advance(1 / 60, { x: 50, y: 800 });
  assert.equal(spring.x, 0); assert.equal(spring.y, 0);
});

test('vertical strokes visibly stretch and compress the torso, then rebound without horizontal drift', () => {
  for (const direction of [-1, 1]) {
    const spring = new BodySpring(), root = { x: 360, y: 650 };
    spring.reset(root);
    for (let i = 0; i < 18; i++) { root.y += direction * 3; spring.advance(1 / 60, root); }
    assert.equal(spring.x, 0);
    assert.ok(spring.y * direction < -16);
    // Every torso row remains ordered even at maximum compression.
    let previous = -Infinity;
    for (let y = -72; y <= 72; y++) {
      const deformed = y + spring.y * bodySpringWeight(y);
      assert.ok(deformed > previous);
      previous = deformed;
    }
    let rebound = false;
    for (let i = 0; i < 180; i++) {
      spring.advance(1 / 60, root);
      rebound ||= spring.y * direction > 1;
    }
    assert.ok(rebound);
    assert.equal(spring.x, 0); assert.equal(spring.y, 0);
    assert.equal(root.y, 650 + direction * 54);
  }
});

test('the same movement stays comparable at 30, 60 and 120 FPS', () => {
  const values = [30, 60, 120].map(fps => {
    const spring = new BodySpring(), root = { x: 0, y: 0 };
    spring.reset(root);
    for (let i = 0; i < fps / 2; i++) { root.x += 240 / fps; spring.advance(1 / fps, root); }
    return spring.x;
  });
  assert.ok(Math.max(...values) - Math.min(...values) < 0.25, values.join(', '));
});

test('large strokes, rapid reversals and frame stalls remain finite and bounded', () => {
  const spring = new BodySpring(), root = { x: 0, y: 0 };
  spring.reset(root);
  for (let i = 0; i < 10000; i++) {
    root.x = i % 2 ? 34 : 686; root.y = i % 3 ? 90 : 1250;
    spring.advance(i % 7 ? 1 / 60 : 2, root);
    assert.ok(Number.isFinite(spring.x) && Number.isFinite(spring.y));
    assert.ok(Math.abs(spring.x) <= BODY_SPRING.maxX && Math.abs(spring.y) <= BODY_SPRING.maxY);
  }
});
