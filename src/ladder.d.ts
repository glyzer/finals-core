/** Season format; unknown values fall back to `'eight'`. */
export type Format = 'eight' | 'four' | 'fourqc' | 'three' | 'six' | 'nine' | 'twelve';
export type TeamId = number;
export type Rng = () => number;

/** One match of a season. `result` lists team ids from 1st place down, or null while unplayed. */
export interface Match {
  round: number;
  teams: TeamId[];
  result: TeamId[] | null;
}

export interface RoundInfo {
  name: string;
  format: 'cashout' | 'quickcash' | 'final';
  /** Number of placements a result records. */
  advance: number;
}
export type Rounds = Record<number, RoundInfo>;

/** The next round to create: one group of team ids per match. */
export interface NextRound {
  round: number;
  groups: TeamId[][];
}

export const TEAMS_PER_SEASON: 8;
export const CAPACITY: Record<Format, number>;
export const ROUNDS_EIGHT: Rounds;
export const ROUNDS_FOUR: Rounds;
export const ROUNDS_FOURQC: Rounds;
export const ROUNDS_THREE: Rounds;
export const ROUNDS_SIX: Rounds;
export const ROUNDS_NINE: Rounds;
export const ROUNDS_TWELVE: Rounds;

export function roundsFor(format?: Format | string): Rounds;
export function finalRound(format?: Format | string): number;
export function shuffle<T>(items: readonly T[], rng?: Rng): T[];
/** Throws unless `teamIds.length === CAPACITY[format]`. */
export function drawRound1(teamIds: readonly TeamId[], rng?: Rng, format?: Format): TeamId[][];
/** Returns `order` or throws with a message fit for an admin. */
export function validateResult(match: Match, order: TeamId[], format?: Format): TeamId[];
/** Null when nothing can be created yet (or the season is done). */
export function nextRound(matches: readonly Match[], rng?: Rng, format?: Format): NextRound | null;
export function champion(matches: readonly Match[], format?: Format): TeamId | null;
