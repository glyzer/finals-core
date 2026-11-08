import test from 'node:test';
import assert from 'node:assert';
import { buildTeams } from '../src/teambuilder.js';

// Deterministic rng (LCG) so runs are repeatable.
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const players = (rankings) => rankings.map((ranking, i) => ({ id: i + 1, ranking }));

// Smallest possible spread between team sums, by brute force over all splits into teams of 3.
function bestSpread(list) {
  let best = Infinity;
  const go = (rest, sums) => {
    if (!rest.length) return void (best = Math.min(best, Math.max(...sums) - Math.min(...sums)));
    const [first, ...others] = rest;
    for (let i = 0; i < others.length; i++) {
      for (let j = i + 1; j < others.length; j++) {
        const left = others.filter((_, k) => k !== i && k !== j);
        go(left, [...sums, first.ranking + others[i].ranking + others[j].ranking]);
      }
    }
  };
  go(list, []);
  return best;
}

test('every player lands in exactly one team of 3 and sums are correct', () => {
  const list = players([90, 80, 70, 60, 50, 40, 30, 20, 10]);
  const teams = buildTeams(list, seeded(1));
  assert.strictEqual(teams.length, 3);
  for (const t of teams) {
    assert.strictEqual(t.players.length, 3);
    assert.strictEqual(t.sum, t.players.reduce((a, p) => a + p.ranking, 0));
  }
  assert.deepStrictEqual(teams.flatMap((t) => t.players.map((p) => p.id)).sort((a, b) => a - b), list.map((p) => p.id));
});

test('keeps the extra fields of each player object', () => {
  const list = players([10, 20, 30]);
  const [team] = buildTeams(list, seeded(2));
  for (const p of team.players) assert.ok(list.includes(p));
});

test('finds the most even split', () => {
  for (const [seed, rankings] of [[3, [90, 80, 70, 30, 20, 10]], [4, [100, 95, 60, 55, 50, 45, 10, 5, 0]]]) {
    const list = players(rankings);
    const sums = buildTeams(list, seeded(seed)).map((t) => t.sum);
    assert.strictEqual(Math.max(...sums) - Math.min(...sums), bestSpread(list));
  }
});

test('the same seed gives the same teams', () => {
  const list = players([50, 40, 30, 20, 10, 0]);
  assert.deepStrictEqual(buildTeams(list, seeded(5)), buildTeams(list, seeded(5)));
});
