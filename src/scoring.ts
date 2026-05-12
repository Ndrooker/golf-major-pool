import type { EspnCompetitor } from './api/espn'
import type { LeaderboardRow, PoolData, PoolEntry, ResolvedPick } from './types'
import { competitorToGolferState, parseScoreDisplay } from './api/espn'
import { normalizeName } from './normalize'

const WD_DQ_STROKES = 15

export function buildNameIndex(competitors: EspnCompetitor[]): Map<string, EspnCompetitor> {
  const map = new Map<string, EspnCompetitor>()
  for (const c of competitors) {
    const name = c.athlete?.displayName
    if (!name) continue
    map.set(normalizeName(name), c)
    const short = c.athlete?.shortName
    if (short) {
      const parts = short.split('.')
      if (parts.length >= 2) {
        const guess = `${parts[1].trim()} ${parts[0].trim()}`
        map.set(normalizeName(guess), c)
      }
    }
  }
  return map
}

function findCompetitor(
  pick: string,
  index: Map<string, EspnCompetitor>,
): EspnCompetitor | undefined {
  const key = normalizeName(pick)
  if (index.has(key)) return index.get(key)
  for (const [k, c] of index) {
    if (k.includes(key) || key.includes(k)) {
      const dn = normalizeName(c.athlete?.displayName ?? '')
      if (dn === key) return c
    }
  }
  return undefined
}

function madeCutScoreTosPar(competitors: EspnCompetitor[]): number | null {
  const vals: number[] = []
  for (const c of competitors) {
    const g = competitorToGolferState(c)
    if (!g || g.isCut || g.isWithdrawn || g.isDisqualified) continue
    if (g.scoreToPar != null) vals.push(g.scoreToPar)
  }
  if (vals.length === 0) return null
  return Math.max(...vals)
}

export function resolveEntry(
  entry: PoolEntry,
  index: Map<string, EspnCompetitor>,
  competitors: EspnCompetitor[],
): ResolvedPick[] {
  const worstMadeCut = madeCutScoreTosPar(competitors)
  const picks: ResolvedPick[] = []

  entry.picks.forEach((pickName, i) => {
    const tier = (i + 1) as 1 | 2 | 3 | 4 | 5
    const comp = findCompetitor(pickName, index)
    if (!comp) {
      picks.push({
        tier,
        pickName,
        matched: false,
        golfer: null,
        strokes: null,
        note: 'No ESPN match — check spelling vs leaderboard',
      })
      return
    }

    const golfer = competitorToGolferState(comp)
    if (!golfer) {
      picks.push({
        tier,
        pickName,
        matched: true,
        golfer: null,
        strokes: null,
        note: 'Missing athlete data',
      })
      return
    }

    let strokes: number | null = golfer.scoreToPar
    let note: string | undefined

    if (golfer.isWithdrawn || golfer.isDisqualified) {
      strokes = WD_DQ_STROKES
      note = golfer.isDisqualified ? 'DQ → +15' : 'WD → +15'
    } else if (golfer.isCut) {
      const base = golfer.scoreToPar ?? parseScoreDisplay(comp.score?.displayValue ?? '') ?? 0
      if (worstMadeCut != null) {
        strokes = worstMadeCut + 5
        note = `MC → worst made cut (${worstMadeCut}) + 5`
      } else {
        strokes = base
        note = 'MC (cut penalty pending field data)'
      }
    }

    if (strokes == null) {
      note = note ? `${note}; score TBD` : 'Score not available yet'
    }

    picks.push({
      tier,
      pickName,
      matched: true,
      golfer,
      strokes,
      note,
    })
  })

  return picks
}

export function buildLeaderboard(data: PoolData, competitors: EspnCompetitor[]): LeaderboardRow[] {
  const index = buildNameIndex(competitors)
  const rows: LeaderboardRow[] = data.entries.map((entry) => {
    const picks = resolveEntry(entry, index, competitors)
    const nums = picks.map((p) => p.strokes).filter((n): n is number => typeof n === 'number')
    const teamTotal = nums.length === picks.length ? nums.reduce((a, b) => a + b, 0) : null
    return { name: entry.name, picks, teamTotal, rank: null }
  })

  const sorted = [...rows].sort((a, b) => {
    if (a.teamTotal == null && b.teamTotal == null) return a.name.localeCompare(b.name)
    if (a.teamTotal == null) return 1
    if (b.teamTotal == null) return -1
    if (a.teamTotal !== b.teamTotal) return a.teamTotal - b.teamTotal
    return a.name.localeCompare(b.name)
  })

  sorted.forEach((row, i) => {
    if (i === 0) {
      row.rank = 1
      return
    }
    const prev = sorted[i - 1]
    const tied =
      row.teamTotal != null &&
      prev.teamTotal != null &&
      row.teamTotal === prev.teamTotal
    row.rank = tied ? prev.rank! : i + 1
  })

  const rankByName = new Map(sorted.map((r) => [r.name, r.rank!]))
  rows.forEach((r) => {
    r.rank = rankByName.get(r.name) ?? null
  })

  return rows.sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
}
