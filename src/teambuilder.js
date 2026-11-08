const spread = (sums) => Math.max(...sums) - Math.min(...sums);
const sumSq = (sums) => sums.reduce((a, s) => a + s * s, 0);

function shuffle(list, rng) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Random start, then swap players between teams while the team sums get more even.
function attempt(players, rng) {
  const mixed = shuffle(players, rng);
  const teams = [];
  for (let i = 0; i < mixed.length; i += 3) teams.push(mixed.slice(i, i + 3));
  const sums = teams.map((t) => t.reduce((a, p) => a + p.ranking, 0));
  let improved = true;
  while (improved) {
    improved = false;
    for (let a = 0; a < teams.length; a++) {
      for (let b = a + 1; b < teams.length; b++) {
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const d = teams[b][j].ranking - teams[a][i].ranking;
            if (d === 0) continue;
            const before = sumSq([sums[a], sums[b]]);
            if (sumSq([sums[a] + d, sums[b] - d]) < before) {
              [teams[a][i], teams[b][j]] = [teams[b][j], teams[a][i]];
              sums[a] += d;
              sums[b] -= d;
              improved = true;
            }
          }
        }
      }
    }
  }
  return { teams, sums };
}

// Returns teams of 3 players; keeps the best of several random attempts.
function buildTeams(players, rng = Math.random, tries = 20) {
  let best = null;
  for (let i = 0; i < tries; i++) {
    const r = attempt(players, rng);
    const key = [spread(r.sums), sumSq(r.sums)];
    if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) best = { ...r, key };
  }
  return best.teams.map((players, i) => ({ players, sum: best.sums[i] }));
}

export { buildTeams };
