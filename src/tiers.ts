import type { OddsGolfer } from './api/odds'
import type { EspnCompetitor } from './api/espn'

export type TierDef = {
  tier: 1 | 2 | 3 | 4 | 5
  label: string
  description: string
  golfers: TierGolfer[]
}

export type TierGolfer = {
  name: string
  oddsDisplay: string | null
  sortOrder: number | null
}

const TIER_RANGES: { tier: 1 | 2 | 3 | 4 | 5; label: string; description: string; maxOdds: number }[] = [
  { tier: 1, label: 'Tier 1', description: 'Favorites', maxOdds: 2000 },
  { tier: 2, label: 'Tier 2', description: 'Contenders', maxOdds: 4000 },
  { tier: 3, label: 'Tier 3', description: 'Mid-tier', maxOdds: 8000 },
  { tier: 4, label: 'Tier 4', description: 'Dark horses', maxOdds: 15000 },
  { tier: 5, label: 'Tier 5', description: 'Long shots', maxOdds: Infinity },
]

function formatOdds(odds: number): string {
  if (odds >= 0) return `+${odds}`
  return String(odds)
}

export function buildTiersFromOdds(golfers: OddsGolfer[]): TierDef[] {
  return TIER_RANGES.map(({ tier, label, description, maxOdds }) => {
    const prevMax = tier === 1 ? -Infinity : TIER_RANGES[tier - 2].maxOdds
    const inTier = golfers.filter((g) => g.avgOdds > prevMax && g.avgOdds <= maxOdds)
    return {
      tier,
      label,
      description,
      golfers: inTier.map((g) => ({
        name: g.name,
        oddsDisplay: formatOdds(g.avgOdds),
        sortOrder: null,
      })),
    }
  })
}

export function buildTiersFromEspn(competitors: EspnCompetitor[]): TierDef[] {
  const sorted = [...competitors]
    .filter((c) => c.athlete?.displayName)
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))

  const positionRanges: { tier: 1 | 2 | 3 | 4 | 5; label: string; description: string; start: number; end: number }[] = [
    { tier: 1, label: 'Tier 1', description: 'Favorites', start: 1, end: 10 },
    { tier: 2, label: 'Tier 2', description: 'Contenders', start: 11, end: 25 },
    { tier: 3, label: 'Tier 3', description: 'Mid-tier', start: 26, end: 50 },
    { tier: 4, label: 'Tier 4', description: 'Dark horses', start: 51, end: 80 },
    { tier: 5, label: 'Tier 5', description: 'Long shots', start: 81, end: 9999 },
  ]

  return positionRanges.map(({ tier, label, description, start, end }) => {
    const inTier = sorted.filter((c) => {
      const so = c.sortOrder ?? 999
      return so >= start && so <= end
    })
    return {
      tier,
      label,
      description,
      golfers: inTier.map((c) => ({
        name: c.athlete!.displayName,
        oddsDisplay: null,
        sortOrder: c.sortOrder ?? null,
      })),
    }
  })
}
