import test from 'node:test';
import assert from 'node:assert';
import * as L from '../src/ladder.js';

const ids = [1, 2, 3, 4, 5, 6, 7, 8];

test('drawRound1 splits 8 teams into two unique groups of 4', () => {
  const g = L.drawRound1(ids);
  assert.deepStrictEqual(g.map((x) => x.length), [4, 4]);
  assert.deepStrictEqual(g.flat().sort((a, b) => a - b), ids);
  assert.throws(() => L.drawRound1([1, 2, 3]));
});

test('validateResult checks counts, duplicates, membership', () => {
  const m = { round: 3, teams: [1, 2, 3, 4] };
  assert.deepStrictEqual(L.validateResult(m, [2, 1]), [2, 1]);
  assert.throws(() => L.validateResult(m, [1]));
  assert.throws(() => L.validateResult(m, [1, 1]));
  assert.throws(() => L.validateResult(m, [1, 9]));
  assert.throws(() => L.validateResult({ round: 1, teams: [1, 2, 3, 4] }, [1, 2]));
});

test('full tournament flow', () => {
  const [a, b] = L.drawRound1(ids);
  const matches = [
    { round: 1, teams: a, result: null },
    { round: 1, teams: b, result: null },
  ];
  assert.strictEqual(L.nextRound(matches), null);
  matches[0].result = [a[0]];
  assert.strictEqual(L.nextRound(matches), null);
  matches[1].result = [b[1]];

  const r2 = L.nextRound(matches);
  assert.strictEqual(r2.round, 2);
  assert.deepStrictEqual(r2.groups.map((x) => x.length), [3, 3]);
  const losers = [...a.slice(1), ...b.filter((t) => t !== b[1])];
  assert.deepStrictEqual(r2.groups.flat().sort(), losers.sort());
  r2.groups.forEach((g) => matches.push({ round: 2, teams: g, result: null }));
  matches[2].result = [matches[2].teams[0]];
  matches[3].result = [matches[3].teams[2]];

  const r3 = L.nextRound(matches);
  assert.strictEqual(r3.round, 3);
  assert.strictEqual(r3.groups[0].length, 4);
  assert.deepStrictEqual(
    r3.groups[0].slice().sort(),
    [a[0], b[1], matches[2].result[0], matches[3].result[0]].sort()
  );
  matches.push({ round: 3, teams: r3.groups[0], result: [r3.groups[0][3], r3.groups[0][1]] });

  const r4 = L.nextRound(matches);
  assert.deepStrictEqual(r4, { round: 4, groups: [[r3.groups[0][3], r3.groups[0][1]]] });
  const [f1, f2] = r4.groups[0];
  matches.push({ round: 4, teams: r4.groups[0], result: [f2] });
  assert.strictEqual(L.champion(matches), null);
  assert.deepStrictEqual(L.nextRound(matches), { round: 4, groups: [r4.groups[0]] });
  matches.push({ round: 4, teams: r4.groups[0], result: [f1] });
  assert.deepStrictEqual(L.nextRound(matches), { round: 4, groups: [r4.groups[0]] });
  matches.push({ round: 4, teams: r4.groups[0], result: [f2] });
  assert.strictEqual(L.nextRound(matches), null);
  assert.strictEqual(L.champion(matches), f2);
});

test('four-team variant: cashout winner to best-of-three final', () => {
  const [g] = L.drawRound1([1, 2, 3, 4], undefined, 'four');
  assert.strictEqual(g.length, 4);
  assert.throws(() => L.drawRound1(ids, undefined, 'four'));
  const matches = [{ round: 1, teams: g, result: null }];
  assert.strictEqual(L.nextRound(matches, undefined, 'four'), null);
  matches[0].result = [g[0]];
  const s1 = L.nextRound(matches, undefined, 'four');
  assert.deepStrictEqual(s1, { round: 2, groups: [g.slice(1)] });
  const [a, b, c] = g.slice(1);
  const play = (winner) => {
    matches.push({ round: 2, teams: g.slice(1), result: [winner] });
    return L.nextRound(matches, undefined, 'four');
  };
  assert.strictEqual(play(a).round, 2);
  assert.strictEqual(play(b).round, 2);
  assert.strictEqual(play(c).round, 2); // 1-1-1 keeps going
  const fin = play(b);
  assert.deepStrictEqual(fin, { round: 3, groups: [[g[0], b]] });
  matches.push({ round: 3, teams: fin.groups[0], result: [g[0]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'four').round, 3);
  assert.strictEqual(L.champion(matches, 'four'), null);
  matches.push({ round: 3, teams: fin.groups[0], result: [b] });
  assert.strictEqual(L.nextRound(matches, undefined, 'four').round, 3);
  assert.strictEqual(L.champion(matches, 'four'), null);
  matches.push({ round: 3, teams: fin.groups[0], result: [b] });
  assert.strictEqual(L.nextRound(matches, undefined, 'four'), null);
  assert.strictEqual(L.champion(matches, 'four'), b);
  const sweep = [
    { round: 3, teams: fin.groups[0], result: [g[0]] },
    { round: 3, teams: fin.groups[0], result: [g[0]] },
  ];
  assert.strictEqual(L.nextRound(sweep, undefined, 'four'), null);
  assert.strictEqual(L.champion(sweep, 'four'), g[0]);
  assert.throws(() => L.validateResult({ round: 3, teams: [1, 2] }, [1, 2], 'four'));
});

test('four-team single quick cash variant: one quick cash, winner joins cashout winner in final', () => {
  const [g] = L.drawRound1([1, 2, 3, 4], undefined, 'fourqc');
  const matches = [{ round: 1, teams: g, result: [g[0]] }];
  const qc = L.nextRound(matches, undefined, 'fourqc');
  assert.deepStrictEqual(qc, { round: 2, groups: [g.slice(1)] });
  matches.push({ round: 2, teams: g.slice(1), result: [g[2]] });
  const fin = L.nextRound(matches, undefined, 'fourqc');
  assert.deepStrictEqual(fin, { round: 3, groups: [[g[0], g[2]]] });
  matches.push({ round: 3, teams: fin.groups[0], result: [g[2]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'fourqc').round, 3);
  matches.push({ round: 3, teams: fin.groups[0], result: [g[2]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'fourqc'), null);
  assert.strictEqual(L.champion(matches, 'fourqc'), g[2]);
  assert.throws(() => L.validateResult({ round: 2, teams: g.slice(1) }, [g[1], g[2]], 'fourqc'));
});

test('three-team variant: quick cash, head2head of the losers, best-of-three final', () => {
  const [g] = L.drawRound1([1, 2, 3], undefined, 'three');
  assert.strictEqual(g.length, 3);
  assert.throws(() => L.drawRound1([1, 2, 3, 4], undefined, 'three'));
  const matches = [{ round: 1, teams: g, result: null }];
  assert.strictEqual(L.nextRound(matches, undefined, 'three'), null);
  matches[0].result = [g[1]];
  const h2h = L.nextRound(matches, undefined, 'three');
  assert.deepStrictEqual(h2h, { round: 2, groups: [[g[0], g[2]]] });
  matches.push({ round: 2, teams: h2h.groups[0], result: [g[2]] });
  const fin = L.nextRound(matches, undefined, 'three');
  assert.deepStrictEqual(fin, { round: 3, groups: [[g[1], g[2]]] });
  matches.push({ round: 3, teams: fin.groups[0], result: [g[2]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'three').round, 3);
  matches.push({ round: 3, teams: fin.groups[0], result: [g[1]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'three').round, 3);
  assert.strictEqual(L.champion(matches, 'three'), null);
  matches.push({ round: 3, teams: fin.groups[0], result: [g[1]] });
  assert.strictEqual(L.nextRound(matches, undefined, 'three'), null);
  assert.strictEqual(L.champion(matches, 'three'), g[1]);
  assert.throws(() => L.validateResult({ round: 2, teams: [g[0], g[2]] }, [g[0], g[2]], 'three'));
});

test('six-team variant: two opening quick cashes, losers cashout, semifinal, best-of-three final', () => {
  const six = [1, 2, 3, 4, 5, 6];
  const groups = L.drawRound1(six, undefined, 'six');
  assert.deepStrictEqual(groups.map((g) => g.length), [3, 3]);
  assert.deepStrictEqual(groups.flat().sort((a, b) => a - b), six);
  assert.throws(() => L.drawRound1(ids, undefined, 'six'));
  assert.deepStrictEqual(L.roundsFor('six')[1], { name: 'Opening Quick Cash', format: 'quickcash', advance: 1 });
  assert.throws(() => L.validateResult({ round: 2, teams: [1, 2, 3, 4] }, [1], 'six'));

  const matches = groups.map((teams) => ({ round: 1, teams, result: null }));
  assert.strictEqual(L.nextRound(matches, undefined, 'six'), null);
  matches[0].result = [groups[0][0]];
  matches[1].result = [groups[1][1]];
  const cash = L.nextRound(matches, undefined, 'six');
  const losers = groups.flatMap((g, i) => g.filter((t) => t !== matches[i].result[0]));
  assert.deepStrictEqual(cash, { round: 2, groups: [losers] });
  matches.push({ round: 2, teams: cash.groups[0], result: [losers[1], losers[3]] });

  const semifinal = L.nextRound(matches, undefined, 'six');
  assert.deepStrictEqual(semifinal, {
    round: 3,
    groups: [[groups[0][0], groups[1][1], losers[1], losers[3]]],
  });
  matches.push({ round: 3, teams: semifinal.groups[0], result: [semifinal.groups[0][3], semifinal.groups[0][0]] });
  const final = L.nextRound(matches, undefined, 'six');
  assert.deepStrictEqual(final, { round: 4, groups: [[semifinal.groups[0][3], semifinal.groups[0][0]]] });
  const [champion, runnerUp] = final.groups[0];
  matches.push({ round: 4, teams: final.groups[0], result: [runnerUp] });
  assert.strictEqual(L.champion(matches, 'six'), null);
  assert.deepStrictEqual(L.nextRound(matches, undefined, 'six'), final);
  matches.push({ round: 4, teams: final.groups[0], result: [champion] });
  assert.deepStrictEqual(L.nextRound(matches, undefined, 'six'), final);
  matches.push({ round: 4, teams: final.groups[0], result: [champion] });
  assert.strictEqual(L.nextRound(matches, undefined, 'six'), null);
  assert.strictEqual(L.champion(matches, 'six'), champion);
});

test('nine-team variant: quick cashes, second chance, two cashouts, semifinal, best-of-three final', () => {
  const nine = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  assert.throws(() => L.drawRound1(ids, undefined, 'nine'));
  const g = L.drawRound1(nine, undefined, 'nine');
  assert.deepStrictEqual(g.map((x) => x.length), [3, 3, 3]);
  assert.deepStrictEqual(g.flat().sort((a, b) => a - b), nine);
  assert.strictEqual(L.roundsFor('nine')[1].advance, 2);
  assert.strictEqual(L.finalRound('nine'), 5);
  const matches = g.map((teams) => ({ round: 1, teams, result: null }));
  assert.strictEqual(L.nextRound(matches, undefined, 'nine'), null);
  matches.forEach((m) => { m.result = m.teams.slice(0, 2); });
  const second = L.nextRound(matches, undefined, 'nine');
  assert.deepStrictEqual(second, { round: 2, groups: [g.map((x) => x[2])] });
  matches.push({ round: 2, teams: second.groups[0], result: second.groups[0].slice(0, 2) });
  const cash = L.nextRound(matches, undefined, 'nine');
  assert.deepStrictEqual(cash.groups.map((x) => x.length), [4, 4]);
  assert.strictEqual(new Set(cash.groups.flat()).size, 8);
  cash.groups.forEach((teams) => matches.push({ round: 3, teams, result: teams.slice(0, 2) }));
  const semi = L.nextRound(matches, undefined, 'nine');
  assert.deepStrictEqual(semi.groups[0], cash.groups.flatMap((x) => x.slice(0, 2)));
  matches.push({ round: 4, teams: semi.groups[0], result: semi.groups[0].slice(0, 2) });
  const final = L.nextRound(matches, undefined, 'nine');
  assert.deepStrictEqual(final, { round: 5, groups: [semi.groups[0].slice(0, 2)] });
  const [champion, other] = final.groups[0];
  matches.push({ round: 5, teams: final.groups[0], result: [champion] });
  matches.push({ round: 5, teams: final.groups[0], result: [other] });
  assert.deepStrictEqual(L.nextRound(matches, undefined, 'nine'), final);
  matches.push({ round: 5, teams: final.groups[0], result: [champion] });
  assert.strictEqual(L.nextRound(matches, undefined, 'nine'), null);
  assert.strictEqual(L.champion(matches, 'nine'), champion);
});

test('twelve-team flow', () => {  const twelve = Array.from({ length: 12 }, (_, i) => i + 1);
  const groups = L.drawRound1(twelve, Math.random, 'twelve');
  assert.deepStrictEqual(groups.map((g) => g.length), [4, 4, 4]);
  assert.throws(() => L.drawRound1(ids, Math.random, 'twelve'));
  assert.strictEqual(L.finalRound('twelve'), 6);
  const matches = groups.map((teams) => ({ round: 1, teams, result: null }));
  const finish = (round, take) => matches.filter((m) => m.round === round).forEach((m) => { m.result = m.teams.slice(0, take); });
  const advance = (round) => {
    const n = L.nextRound(matches, Math.random, 'twelve');
    assert.strictEqual(n.round, round);
    n.groups.forEach((teams) => matches.push({ round, teams, result: null }));
    return n.groups;
  };
  assert.strictEqual(L.nextRound(matches, Math.random, 'twelve'), null);
  finish(1, 2);
  const r2 = advance(2);
  assert.deepStrictEqual(r2.map((g) => g.length), [3, 3]);
  assert.strictEqual(new Set(r2.flat()).size, 6);
  finish(2, 1);
  const r3 = advance(3);
  assert.deepStrictEqual(r3.map((g) => g.length), [4, 4]);
  assert.strictEqual(new Set(r3.flat()).size, 8);
  finish(3, 3);
  const r4 = advance(4);
  const r3m = matches.filter((m) => m.round === 3);
  assert.deepStrictEqual(r4[0].slice().sort(), r3m.flatMap((m) => m.result.slice(1)).sort());
  finish(4, 2);
  const r5 = advance(5);
  assert.deepStrictEqual(r5[0].slice().sort(), [...r3m.map((m) => m.result[0]), ...matches.find((m) => m.round === 4).result].sort());
  finish(5, 2);
  const r6 = advance(6);
  assert.deepStrictEqual(r6[0], matches.find((m) => m.round === 5).result);
  const [a, b] = r6[0];
  matches.find((m) => m.round === 6).result = [a];
  assert.strictEqual(L.champion(matches, 'twelve'), null);
  advance(6);
  matches.filter((m) => m.round === 6)[1].result = [a];
  assert.strictEqual(L.champion(matches, 'twelve'), a);
  assert.strictEqual(L.nextRound(matches, Math.random, 'twelve'), null);
  assert.ok(b);
});

test('twelve-team validateResult needs three placements in round 3', () => {
  const m = { round: 3, teams: [1, 2, 3, 4] };
  assert.deepStrictEqual(L.validateResult(m, [3, 1, 2], 'twelve'), [3, 1, 2]);
  assert.throws(() => L.validateResult(m, [3, 1], 'twelve'));
});