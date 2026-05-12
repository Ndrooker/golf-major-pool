export type PayoutFractions = {
  first: number
  second: number
  third: number
  shank: number
}

export type PoolEntry = {
  name: string
  /** Five golfer display names, tier 1 (favorite) through tier 5 */
  picks: [string, string, string, string, string]
}

export type PoolData = {
  title: string
  /** ESPN league slug, e.g. `pga` */
  league: string
  /** Optional ESPN event id so the board tracks a specific tournament */
  eventId?: string | null
  buyInDollars: number
  payoutFractions: PayoutFractions
  /**
   * If set, overrides `entries.length` for pot math (e.g. some paid but not in JSON yet).
   * If null/undefined, uses number of entries in the file.
   */
  paidEntryCount?: number | null
  /** The Odds API sport key for this major (e.g. golf_us_open_winner) */
  oddsSport?: string | null
  /** Google Apps Script web app URL for pick submission */
  submitUrl?: string | null
  entries: PoolEntry[]
}

export type EspnAthleteRef = {
  id: string
  displayName: string
}

export type GolferState = {
  athlete: EspnAthleteRef
  scoreToPar: number | null
  positionDisplay: string | null
  thruDisplay: string | null
  statusDetail: string | null
  isWithdrawn: boolean
  isDisqualified: boolean
  isCut: boolean
}

export type ResolvedPick = {
  tier: 1 | 2 | 3 | 4 | 5
  pickName: string
  matched: boolean
  golfer: GolferState | null
  /** Strokes counted toward team total for this pick */
  strokes: number | null
  note?: string
}

export type LeaderboardRow = {
  name: string
  picks: ResolvedPick[]
  teamTotal: number | null
  rank: number | null
}
