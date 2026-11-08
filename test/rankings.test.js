import test from 'node:test';
import assert from 'node:assert';
import { rankingDeltas, clamp } from '../src/rankings.js';

const m = (round, teams, result) => ({ round, teams, result });

test('eight: champion, finalist, semifinal tier, others', () => {
  const matches = [
    m(3, [1, 2, 3, 4, 5, 6], [1, 2]),
    m(4, [1, 2], [1]),
    m(4, [1, 2], [1]),
  ];
  assert.deepStrictEqual(rankingDeltas(matches, [1, 2, 3, 4, 5, 6, 7, 8], 'eight'),
    { 1: 3, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1, 7: -2, 8: -2 });
});

test('twelve: bigger deltas, semifinal is round 5', () => {
  const matches = [m(5, [1, 2, 3, 4], [1, 2]), m(6, [1, 2], [2]), m(6, [1, 2], [2])];
  assert.deepStrictEqual(rankingDeltas(matches, [1, 2, 3, 4, 5], 'twelve'), { 1: 3, 2: 4, 3: 2, 4: 2, 5: -2 });
});

test('three: no tier, others get -1', () => {
  const matches = [m(1, [1, 2, 3], [1]), m(2, [2, 3], [2]), m(3, [1, 2], [2]), m(3, [1, 2], [2])];
  assert.deepStrictEqual(rankingDeltas(matches, [1, 2, 3], 'three'), { 1: 1, 2: 2, 3: -1 });
});

test('fourqc: every round 2 team is in the tier', () => {
  const matches = [m(1, [1, 2, 3, 4], [1]), m(2, [2, 3, 4], [3]), m(3, [1, 3], [1]), m(3, [1, 3], [1])];
  assert.deepStrictEqual(rankingDeltas(matches, [1, 2, 3, 4], 'fourqc'), { 1: 3, 2: 1, 3: 2, 4: 1 });
});

test('four: only round 2 winners are in the tier', () => {
  const matches = [
    m(1, [1, 2, 3, 4], [1]),
    m(2, [2, 3, 4], [3]),
    m(2, [2, 3, 4], [3]),
    m(3, [1, 3], [3]),
    m(3, [1, 3], [3]),
  ];
  assert.deepStrictEqual(rankingDeltas(matches, [1, 2, 3, 4], 'four'), { 1: 2, 2: -2, 3: 3, 4: -2 });
});

test('clamp keeps rankings in 0..100', () => {
  assert.strictEqual(clamp(-5), 0);
  assert.strictEqual(clamp(120), 100);
  assert.strictEqual(clamp(42), 42);
});
