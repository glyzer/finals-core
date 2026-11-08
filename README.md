# finals-core

Ladder, rankings and team builder for THE FINALS mini tournaments. Pure functions: no storage, HTTP or chat code, and zero runtime dependencies. ESM with TypeScript declarations; Node 22.12 or newer (CommonJS code can `require()` it).

## Install

Released as git tags; pin one:

```json
"dependencies": { "finals-core": "github:glyzer/finals-core#v1.0.0" }
```

## Modules

| Import | Exports |
|---|---|
| `finals-core/ladder` | `CAPACITY`, `ROUNDS_*`, `roundsFor`, `finalRound`, `shuffle`, `drawRound1`, `validateResult`, `nextRound`, `champion` |
| `finals-core/rankings` | `rankingDeltas`, `clamp` |
| `finals-core/teambuilder` | `buildTeams` |
| `finals-core` | everything above except `shuffle` |

Formats: `eight` (default), `four`, `fourqc`, `three`, `six`, `nine`, `twelve`. A match is `{ round, teams, result }`, where `result` lists team ids from 1st place down, or is `null` while unplayed. Functions that draw take an optional `rng` (`() => number`, defaults to `Math.random`).

```js
import { drawRound1, nextRound, champion } from 'finals-core/ladder';

const groups = drawRound1([1, 2, 3, 4, 5, 6, 7, 8]);   // round 1: two groups of 4
// ...record results, then:
const next = nextRound(matches);                         // { round, groups } or null
const winner = champion(matches);                        // team id or null
```

## Develop

`npm test` (Node's built-in test runner). Release: bump `version` in package.json, tag `vX.Y.Z`, push the tag.
