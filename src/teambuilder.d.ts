/** Any object with a numeric `ranking`; other fields are kept as-is. */
export interface Player {
  ranking: number;
}
export interface Team<P extends Player = Player> {
  players: P[];
  /** Sum of the players' rankings. */
  sum: number;
}

/** Splits players into teams of 3 with sums as even as possible; the best of `tries` random attempts. Expects a multiple of 3 players. */
export function buildTeams<P extends Player>(players: readonly P[], rng?: () => number, tries?: number): Team<P>[];
