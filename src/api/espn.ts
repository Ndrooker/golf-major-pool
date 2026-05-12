import type { GolferState } from '../types'

const ESPN_BASE =
  'https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard'

export type EspnLeaderboardPayload = {
  events?: EspnEvent[]
}

export type EspnEvent = {
  id: string
  name: string
  shortName?: string
  competitions?: EspnCompetition[]
}

export type EspnCompetition = {
  competitors?: EspnCompetitor[]
}

export type EspnCompetitor = {
  id: string
  athlete?: {
    id: string
    displayName: string
    shortName?: string
  }
  status?: {
    displayValue?: string
    thru?: string
    displayThru?: string
    position?: { displayName?: string }
    type?: { name?: string; completed?: boolean }
  }
  score?: {
    displayValue?: string
    value?: number
  }
  statistics?: { name?: string; value?: number; displayValue?: string }[]
}

export async function fetchEspnLeaderboard(
  league: string,
  eventId?: string | null,
): Promise<{ event: EspnEvent; competitors: EspnCompetitor[] }> {
  const params = new URLSearchParams({ league })
  if (eventId) params.set('event', String(eventId))
  const url = `${ESPN_BASE}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN request failed (${res.status})`)
  const data = (await res.json()) as EspnLeaderboardPayload
  const event = data.events?.[0]
  if (!event) throw new Error('No tournament data from ESPN')
  const competitors = event.competitions?.[0]?.competitors ?? []
  return { event, competitors }
}

export function competitorToGolferState(c: EspnCompetitor): GolferState | null {
  const athlete = c.athlete
  if (!athlete?.id || !athlete.displayName) return null

  const typeName = c.status?.type?.name ?? ''
  const isWithdrawn =
    typeName === 'STATUS_WITHDRAWN' ||
    typeName === 'STATUS_WD' ||
    /\bWD\b/i.test(c.status?.displayValue ?? '')
  const isDisqualified =
    typeName === 'STATUS_DISQUALIFIED' ||
    typeName === 'STATUS_DQ' ||
    /\bDQ\b/i.test(c.status?.displayValue ?? '')
  const isCut =
    typeName === 'STATUS_CUT' ||
    /\bMC\b/i.test(c.status?.displayValue ?? '') ||
    /\bCUT\b/i.test(c.status?.displayValue ?? '')

  const scoreToPar = extractScoreToPar(c)

  return {
    athlete: { id: athlete.id, displayName: athlete.displayName },
    scoreToPar,
    positionDisplay: c.status?.position?.displayName ?? null,
    thruDisplay:
      c.status?.displayThru ?? (c.status?.thru != null ? String(c.status.thru) : null),
    statusDetail: c.status?.displayValue ?? null,
    isWithdrawn,
    isDisqualified,
    isCut,
  }
}

function extractScoreToPar(c: EspnCompetitor): number | null {
  const fromStats = c.statistics?.find((s) => s.name === 'scoreToPar')
  if (fromStats && typeof fromStats.value === 'number' && !Number.isNaN(fromStats.value)) {
    return fromStats.value
  }
  const dv = c.score?.displayValue
  if (dv != null && dv !== '') return parseScoreDisplay(dv)
  return null
}

/** Parses ESPN-style relative score: E, -3, +12 */
export function parseScoreDisplay(display: string): number | null {
  const t = display.trim().toUpperCase()
  if (t === 'E' || t === 'EVEN') return 0
  const m = t.match(/^([+-]?\d+)/)
  if (!m) return null
  return Number(m[1])
}
