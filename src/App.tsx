import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchEspnLeaderboard, type EspnCompetitor } from './api/espn'
import { fetchOdds, type OddsGolfer } from './api/odds'
import { LeaderboardTable } from './components/LeaderboardTable'
import { PayoutPanel } from './components/PayoutPanel'
import { RulesPage } from './components/RulesPage'
import { TierList } from './components/TierList'
import { computePayouts } from './payouts'
import { buildLeaderboard } from './scoring'
import { buildTiersFromOdds, buildTiersFromEspn, type TierDef } from './tiers'
import { loadPoolData } from './loadPool'
import type { LeaderboardRow, PoolData } from './types'

type Tab = 'board' | 'tiers' | 'rules'

const REFRESH_MS = 60_000

export default function App() {
  const [tab, setTab] = useState<Tab>('tiers')
  const [pool, setPool] = useState<PoolData | null>(null)
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [competitors, setCompetitors] = useState<EspnCompetitor[]>([])
  const [oddsGolfers, setOddsGolfers] = useState<OddsGolfer[]>([])
  const [eventTitle, setEventTitle] = useState<string>('')
  const [eventState, setEventState] = useState<'pre' | 'in' | 'post'>('pre')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paidOverride, setPaidOverride] = useState<string>('')

  const loadPool = useCallback(async () => {
    try {
      const data = await loadPoolData()
      setPool(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pool data')
      setLoading(false)
    }
  }, [])

  const refreshScores = useCallback(async () => {
    if (!pool) return
    try {
      const { event, competitors: comps, eventState: state } = await fetchEspnLeaderboard(pool.league, pool.eventId)
      setEventTitle(event.name)
      setEventState(state)
      setCompetitors(comps)
      setRows(buildLeaderboard(pool, comps))
      setUpdatedAt(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ESPN data')
    } finally {
      setLoading(false)
    }
  }, [pool])

  const loadOdds = useCallback(async () => {
    if (!pool) return
    const apiKey = import.meta.env.VITE_ODDS_API_KEY?.trim()
    const sportKey = pool.oddsSport?.trim()
    if (!apiKey || !sportKey) return
    try {
      const golfers = await fetchOdds(sportKey, apiKey)
      setOddsGolfers(golfers)
    } catch (e) {
      console.warn('Odds fetch failed (will use ESPN fallback):', e)
    }
  }, [pool])

  useEffect(() => {
    void loadPool()
  }, [loadPool])

  useEffect(() => {
    if (!pool) return
    void refreshScores()
    void loadOdds()
    const t = window.setInterval(() => void refreshScores(), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [pool, refreshScores, loadOdds])

  const tiers: TierDef[] = useMemo(() => {
    if (oddsGolfers.length > 0) return buildTiersFromOdds(oddsGolfers)
    if (competitors.length > 0) return buildTiersFromEspn(competitors)
    return []
  }, [oddsGolfers, competitors])

  const paidCount = useMemo(() => {
    if (!pool) return 0
    const raw = paidOverride.trim()
    if (raw === '') return pool.paidEntryCount ?? pool.entries.length
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : pool.entries.length
  }, [pool, paidOverride])

  const payout = useMemo(() => {
    if (!pool) return null
    return computePayouts(paidCount, pool.buyInDollars, pool.payoutFractions)
  }, [pool, paidCount])

  const existingNames = useMemo(() => pool?.entries.map((e) => e.name) ?? [], [pool])

  const tournamentStarted = eventState === 'in' || eventState === 'post'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'tiers', label: tournamentStarted ? 'Live Standings' : 'Pick Your Team' },
    { id: 'board', label: 'Leaderboard' },
    { id: 'rules', label: 'Rules' },
  ]

  return (
    <div className="pb-12 pt-6">
      <header className="border-b border-zinc-800 pb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-500/80">
          Major pool
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
          {pool?.title ?? 'Loading…'}
        </h1>
        {eventTitle ? (
          <p className="mt-1 text-sm text-zinc-500">
            {eventTitle}
          </p>
        ) : null}
      </header>

      {/* Tab bar */}
      <nav className="mt-4 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition ${
              tab === t.id
                ? 'bg-emerald-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error ? (
        <div
          className="mt-4 rounded-lg border border-rose-900/80 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {loading && !pool ? (
        <p className="mt-8 text-center text-zinc-500">Loading pool…</p>
      ) : null}

      {/* Pick Your Team / Live Standings */}
      {tab === 'tiers' && pool ? (
        tournamentStarted && payout ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void refreshScores()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 active:bg-emerald-700"
              >
                Refresh scores
              </button>
              {updatedAt ? (
                <span className="text-xs text-zinc-500">
                  Updated {updatedAt.toLocaleTimeString()}
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <PayoutPanel breakdown={payout} />
            </div>

            <LeaderboardTable
              rows={rows}
              worstRank={rows.reduce((m, r) => Math.max(m, r.rank ?? 0), 0)}
            />
          </>
        ) : (
          <TierList
            tiers={tiers}
            submitUrl={pool.submitUrl ?? null}
            existingNames={existingNames}
          />
        )
      ) : null}

      {/* Leaderboard */}
      {tab === 'board' && pool && payout ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void refreshScores()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 active:bg-emerald-700"
            >
              Refresh scores
            </button>
            {updatedAt ? (
              <span className="text-xs text-zinc-500">
                Updated {updatedAt.toLocaleTimeString()}
              </span>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Paid spots (for pot math)
            </label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder={String(pool.paidEntryCount ?? pool.entries.length)}
                value={paidOverride}
                onChange={(e) => setPaidOverride(e.target.value)}
                className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-xs text-zinc-500">
                {pool.paidEntryCount ?? pool.entries.length} entries
              </span>
            </div>
          </div>

          <div className="mt-4">
            <PayoutPanel breakdown={payout} />
          </div>

          <LeaderboardTable
            rows={rows}
            worstRank={rows.reduce((m, r) => Math.max(m, r.rank ?? 0), 0)}
          />

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
              All lineups
            </h2>
            <div className="mt-2 overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full min-w-[32rem] text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
                    <th className="px-2 py-2 font-medium">Player</th>
                    <th className="px-2 py-2 font-medium">T1</th>
                    <th className="px-2 py-2 font-medium">T2</th>
                    <th className="px-2 py-2 font-medium">T3</th>
                    <th className="px-2 py-2 font-medium">T4</th>
                    <th className="px-2 py-2 font-medium">T5</th>
                  </tr>
                </thead>
                <tbody>
                  {pool.entries.map((e) => (
                    <tr key={e.name} className="border-t border-zinc-800/80">
                      <td className="px-2 py-2 font-medium text-zinc-200">{e.name}</td>
                      {e.picks.map((p, i) => (
                        <td key={i} className="max-w-[7rem] truncate px-2 py-2 text-zinc-400">
                          {p}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {/* Rules */}
      {tab === 'rules' ? <RulesPage /> : null}
    </div>
  )
}
