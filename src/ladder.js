const TEAMS_PER_SEASON = 8;
const CAPACITY = { twelve: 12, nine: 9, eight: 8, six: 6, four: 4, fourqc: 4, three: 3 };

const ROUNDS_EIGHT = {
  1: { name: 'Round 1', format: 'cashout', advance: 1 },
  2: { name: 'Round 2', format: 'quickcash', advance: 1 },
  3: { name: 'Semifinal', format: 'cashout', advance: 2 },
  4: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};

// 4-team variant: cashout winner goes to a best-of-three final; the rest play quick cashes until someone has two wins.
const ROUNDS_FOUR = {
  1: { name: 'Cashout', format: 'cashout', advance: 1 },
  2: { name: 'Quick Cash Series', format: 'quickcash', advance: 1 },
  3: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
// 4-team single Quick Cash variant: cashout winner goes to the final; the other three play one Quick Cash whose winner joins them.
const ROUNDS_FOURQC = {
  1: { name: 'Cashout', format: 'cashout', advance: 1 },
  2: { name: 'Quick Cash', format: 'quickcash', advance: 1 },
  3: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
// 3-team variant: quick cash winner goes to the final; the two losers play a HEAD2HEAD for the other final spot.
const ROUNDS_THREE = {
  1: { name: 'Quick Cash', format: 'quickcash', advance: 1 },
  2: { name: 'HEAD2HEAD', format: 'quickcash', advance: 1 },
  3: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
const ROUNDS_SIX = {
  1: { name: 'Opening Quick Cash', format: 'quickcash', advance: 1 },
  2: { name: 'Losers Cashout', format: 'cashout', advance: 2 },
  3: { name: 'Semifinal', format: 'cashout', advance: 2 },
  4: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
// 9-team variant: round 1 and 2 quick cashes record the top two.
const ROUNDS_NINE = {
  1: { name: 'Quick Cash', format: 'quickcash', advance: 2 },
  2: { name: 'Second Chance Quick Cash', format: 'quickcash', advance: 2 },
  3: { name: 'Cashout', format: 'cashout', advance: 2 },
  4: { name: 'Semifinal', format: 'cashout', advance: 2 },
  5: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
// 12-team variant: round 3 records the top three of each cashout; 2nd and 3rd get a second chance in round 4.
const ROUNDS_TWELVE = {
  1: { name: 'Round 1', format: 'cashout', advance: 2 },
  2: { name: 'Quick Cash', format: 'quickcash', advance: 1 },
  3: { name: 'Round 3', format: 'cashout', advance: 3 },
  4: { name: 'Second Chance', format: 'cashout', advance: 2 },
  5: { name: 'Semifinal', format: 'cashout', advance: 2 },
  6: { name: 'Final (Best of 3)', format: 'final', advance: 1 },
};
const roundsFor = (format) => ({ four: ROUNDS_FOUR, fourqc: ROUNDS_FOURQC, three: ROUNDS_THREE, six: ROUNDS_SIX, nine: ROUNDS_NINE, twelve: ROUNDS_TWELVE }[format] || ROUNDS_EIGHT);
const finalRound = (format) => ({ four: 3, fourqc: 3, three: 3, nine: 5, twelve: 6 }[format] || 4);

function shuffle(items, rng = Math.random) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function split(ids, size) {
  const groups = [];
  for (let i = 0; i < ids.length; i += size) groups.push(ids.slice(i, i + size));
  return groups;
}

function seriesWinner(matches) {
  const wins = {};
  for (const match of matches) {
    if (match.result) wins[match.result[0]] = (wins[match.result[0]] || 0) + 1;
  }
  return Object.keys(wins).map(Number).find((team) => wins[team] >= 2);
}

// Initial draw: format-specific opening groups.
function drawRound1(teamIds, rng, format = 'eight') {
  if (teamIds.length !== CAPACITY[format]) {
    throw new Error(`Exactly ${CAPACITY[format]} teams are required`);
  }
  return split(shuffle(teamIds, rng), format === 'six' || format === 'nine' || format === 'three' ? 3 : 4);
}

/**
 * Validates an admin-submitted result. `order` lists team ids from 1st place
 * down, with as many entries as the round advances.
 */
function validateResult(match, order, format = 'eight') {
  const info = roundsFor(format)[match.round];
  if (!info) throw new Error('Unknown round');
  if (!Array.isArray(order) || order.length !== info.advance) {
    throw new Error(`Expected ${info.advance} placement(s) for ${info.name}`);
  }
  if (new Set(order).size !== order.length) throw new Error('Duplicate teams in result');
  for (const id of order) {
    if (!match.teams.includes(id)) throw new Error('Team does not belong to this match');
  }
  return order;
}

/**
 * Given all matches of a season (each {round, teams, result: ids[]|null}),
 * returns the next round to create, or null if nothing can be created yet.
 * Returns {round, groups} where groups are lists of team ids.
 */
function nextRoundFour(matches) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  if (maxRound === 1) {
    const m = current[0];
    return { round: 2, groups: [m.teams.filter((t) => !m.result.includes(t))] };
  }
  if (maxRound === 2) {
    const winner = seriesWinner(current);
    if (winner === undefined) return { round: 2, groups: [current[0].teams] };
    const r1 = matches.find((m) => m.round === 1);
    return { round: 3, groups: [[r1.result[0], winner]] };
  }
  if (maxRound === 3 && seriesWinner(current) === undefined && current.length < 3) {
    return { round: 3, groups: [current[0].teams] };
  }
  return null;
}

function nextRoundFourQc(matches) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  if (maxRound === 1) {
    const m = current[0];
    return { round: 2, groups: [m.teams.filter((t) => !m.result.includes(t))] };
  }
  if (maxRound === 2) {
    const r1 = matches.find((m) => m.round === 1);
    return { round: 3, groups: [[r1.result[0], current[0].result[0]]] };
  }
  if (seriesWinner(current) === undefined && current.length < 3) return { round: 3, groups: [current[0].teams] };
  return null;
}

function nextRoundThree(matches) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  if (maxRound === 1) {
    const m = current[0];
    return { round: 2, groups: [m.teams.filter((t) => !m.result.includes(t))] };
  }
  if (maxRound === 2) {
    const r1 = matches.find((m) => m.round === 1);
    return { round: 3, groups: [[r1.result[0], current[0].result[0]]] };
  }
  if (seriesWinner(current) === undefined && current.length < 3) return { round: 3, groups: [current[0].teams] };
  return null;
}

function nextRoundSix(matches) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  if (maxRound === 1) {
    const losers = current.flatMap((m) => m.teams.filter((t) => !m.result.includes(t)));
    return { round: 2, groups: [losers] };
  }
  if (maxRound === 2) {
    const openingWinners = matches.filter((m) => m.round === 1).map((m) => m.result[0]);
    return { round: 3, groups: [[...openingWinners, ...current[0].result]] };
  }
  if (maxRound === 3) {
    return { round: 4, groups: [current[0].result.slice(0, 2)] };
  }
  if (maxRound === 4 && seriesWinner(current) === undefined && current.length < 3) {
    return { round: 4, groups: [current[0].teams] };
  }
  return null;
}

function nextRoundNine(matches, rng) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  const results = (round) => matches.filter((m) => m.round === round).map((m) => m.result);
  if (maxRound === 1) {
    const losers = current.flatMap((m) => m.teams.filter((t) => !m.result.includes(t)));
    return { round: 2, groups: [losers] };
  }
  if (maxRound === 2) {
    const advancers = [...results(1).flat(), ...results(2).flat()];
    return { round: 3, groups: split(shuffle(advancers, rng), 4) };
  }
  if (maxRound === 3) return { round: 4, groups: [results(3).flat()] };
  if (maxRound === 4) return { round: 5, groups: [current[0].result.slice(0, 2)] };
  if (seriesWinner(current) === undefined && current.length < 3) return { round: 5, groups: [current[0].teams] };
  return null;
}

function nextRoundTwelve(matches, rng) {
  const maxRound = Math.max(0, ...matches.map((m) => m.round));
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;
  const results = (round) => matches.filter((m) => m.round === round).map((m) => m.result);
  if (maxRound === 1) {
    const losers = current.flatMap((m) => m.teams.filter((t) => !m.result.includes(t)));
    return { round: 2, groups: split(shuffle(losers, rng), 3) };
  }
  if (maxRound === 2) {
    const advancers = [...results(1).flat(), ...results(2).flat()];
    return { round: 3, groups: split(shuffle(advancers, rng), 4) };
  }
  if (maxRound === 3) {
    return { round: 4, groups: [shuffle(results(3).flatMap((r) => r.slice(1)), rng)] };
  }
  if (maxRound === 4) {
    return { round: 5, groups: [[...results(3).map((r) => r[0]), ...results(4)[0]]] };
  }
  if (maxRound === 5) return { round: 6, groups: [current[0].result.slice(0, 2)] };
  if (seriesWinner(current) === undefined && current.length < 3) return { round: 6, groups: [current[0].teams] };
  return null;
}

function nextRound(matches, rng, format = 'eight') {
  if (format === 'twelve') return nextRoundTwelve(matches, rng);
  if (format === 'four') return nextRoundFour(matches);
  if (format === 'fourqc') return nextRoundFourQc(matches);
  if (format === 'three') return nextRoundThree(matches);
  if (format === 'six') return nextRoundSix(matches);
  if (format === 'nine') return nextRoundNine(matches, rng);
  const rounds = new Set(matches.map((m) => m.round));
  const maxRound = Math.max(0, ...rounds);
  if (maxRound === 0) return null;
  const current = matches.filter((m) => m.round === maxRound);
  if (current.some((m) => !m.result)) return null;

  if (maxRound === 1) {
    const loserSets = current.map((m) => m.teams.filter((t) => !m.result.includes(t)));
    const losers = loserSets.flat();
    // Reshuffle until no group is an unchanged copy of a round 1 losers set.
    let groups;
    do {
      groups = split(shuffle(losers, rng), 3);
    } while (groups.some((g) => loserSets.some((s) => s.length === g.length && g.every((t) => s.includes(t)))));
    return { round: 2, groups };
  }
  if (maxRound === 2) {
    const r1 = matches.filter((m) => m.round === 1).flatMap((m) => m.result);
    const r2 = current.flatMap((m) => m.result);
    return { round: 3, groups: [[...r1, ...r2]] };
  }
  if (maxRound === 4) {
    if (seriesWinner(current) === undefined && current.length < 3) return { round: 4, groups: [current[0].teams] };
    return null;
  }
  // maxRound === 3
  return { round: 4, groups: [current[0].result.slice(0, 2)] };
}

function champion(matches, format = 'eight') {
  return seriesWinner(matches.filter((m) => m.round === finalRound(format))) || null;
}

export {
  TEAMS_PER_SEASON,
  CAPACITY,
  ROUNDS_EIGHT,
  ROUNDS_FOUR,
  ROUNDS_FOURQC,
  ROUNDS_THREE,
  ROUNDS_SIX,
  ROUNDS_NINE,
  ROUNDS_TWELVE,
  roundsFor,
  finalRound,
  shuffle,
  drawRound1,
  validateResult,
  nextRound,
  champion,
};
