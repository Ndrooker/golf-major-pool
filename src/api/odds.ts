export type OddsGolfer = {
  name: string
  avgOdds: number
}

export type OddsResponse = {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  bookmakers: {
    key: string
    title: string
    markets: {
      key: string
      outcomes: { name: string; price: number }[]
    }[]
  }[]
}[]

export async function fetchOdds(
  sportKey: string,
  apiKey: string,
): Promise<OddsGolfer[]> {
  const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds?regions=us&markets=outrights&oddsFormat=american&apiKey=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Odds API request failed (${res.status})`)
  }
  const data = (await res.json()) as OddsResponse
  if (!data.length) return []

  const event = data[0]
  const playerOdds = new Map<string, number[]>()

  for (const book of event.bookmakers) {
    const market = book.markets.find((m) => m.key === 'outrights')
    if (!market) continue
    for (const outcome of market.outcomes) {
      const existing = playerOdds.get(outcome.name) ?? []
      existing.push(outcome.price)
      playerOdds.set(outcome.name, existing)
    }
  }

  const golfers: OddsGolfer[] = []
  for (const [name, prices] of playerOdds) {
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    golfers.push({ name, avgOdds: avg })
  }

  golfers.sort((a, b) => a.avgOdds - b.avgOdds)
  return golfers
}
