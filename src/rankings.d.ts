import type { Format, Match, TeamId } from './ladder.js';

/** One ranking delta per team of a finished season, keyed by team id. */
export function rankingDeltas(matches: readonly Match[], teamIds: readonly TeamId[], format?: Format): Record<TeamId, number>;
/** Clamps a ranking to 0..100. */
export function clamp(n: number): number;
