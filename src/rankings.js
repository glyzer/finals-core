import * as L from './ladder.js';

// champion, lost final, next tier; everyone else gets OTHER
const DELTAS = {
  four: [3, 2, 1],
  fourqc: [3, 2, 1],
  three: [2, 1, 0],
  six: [3, 2, 1],
  eight: [3, 2, 1],
  twelve: [4, 3, 2],
};
const OTHER = -2;
const OTHER_BY_FORMAT = { three: -1 };
const SEMIFINAL_ROUND = { six: 3, eight: 3, nine: 4, twelve: 5 };

// One non-stacking ranking delta per team of a finished season.
function rankingDeltas(matches, teamIds, format) {
  const [win, final, mid] = DELTAS[format] || DELTAS.eight;
  const champion = L.champion(matches, format);
  const finalists = new Set(matches.filter((m) => m.round === L.finalRound(format)).flatMap((m) => m.teams));
  const tier = new Set();
  if (format === 'four') {
    for (const m of matches) if (m.round === 2 && m.result) tier.add(m.result[0]);
  } else if (format === 'fourqc') {
    for (const m of matches) if (m.round === 2) m.teams.forEach((t) => tier.add(t));
  } else {
    for (const m of matches) if (m.round === SEMIFINAL_ROUND[format]) m.teams.forEach((t) => tier.add(t));
  }
  const deltas = {};
  for (const id of teamIds) {
    if (id === champion) deltas[id] = win;
    else if (finalists.has(id)) deltas[id] = final;
    else deltas[id] = tier.has(id) ? mid : (OTHER_BY_FORMAT[format] ?? OTHER);
  }
  return deltas;
}

const clamp = (n) => Math.min(100, Math.max(0, n));

export { rankingDeltas, clamp };
