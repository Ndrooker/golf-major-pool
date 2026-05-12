import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchEspnLeaderboard } from './api/espn'
import { LeaderboardTable } from './components/LeaderboardTable'
import { PayoutPanel } from './components/PayoutPanel'
import { computePayouts } from './payouts'
import { buildLeaderboard } from './scoring'
import { loadPoolData } from './loadPool'
import type { LeaderboardRow, PoolData } from './types'

const REFRESH_MS = 60_000

export default function App() {
  const [pool, setPool] = useState<PoolData | null>(null)
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [eventTitle, setEventTitle] = useState<string>('')
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
      const { event, competitors } = await fetchEspnLeaderboard(pool.league, pool.eventId)
      setEventTitle(event.name)
      setRows(buildLeaderboard(pool, competitors))
      setUpdatedAt(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ESPN data')
    } finally {
      setLoading(false)
    }
  }, [pool])

  useEffect(() => {
    void loadPool()
  }, [loadPool])

  useEffect(() => {
    if (!pool) return
    void refreshScores()
    const t = window.setInterval(() => void refreshScores(), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [pool, refreshScores])

  const paidCount = useMemo(() => {
    if (!pool) return 0
    const raw = paidOverride.trim()
    if (raw === '') {
      return pool.paidEntryCount ?? pool.entries.length
    }
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : pool.entries.length
  }, [pool, paidOverride])

  const payout = useMemo(() => {
    if (!pool) return null
    return computePayouts(paidCount, pool.buyInDollars, pool.payoutFractions)
  }, [pool, paidCount])

  return (
    <div className="pb-12 pt-6">
      <header className="border-b border-zinc-800 pb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-500/80">
          Major pool
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
          {pool?.title ?? 'Loading…'}
        </h1>
        {eventTitle ? (
          <p className="mt-2 text-sm text-zinc-400">
            ESPN: <span className="text-zinc-200">{eventTitle}</span>
            {pool?.eventId ? (
              <span className="ml-2 font-mono text-xs text-zinc-600">event {pool.eventId}</span>
            ) : null}
          </p>
        ) : null}
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
          <span className="text-xs text-zinc-600">Auto-refresh ~{REFRESH_MS / 1000}s</span>
        </div>
      </header>

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

      {pool && payout ? (
        <>
          <div className="mt-6">
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
                Leave blank to use file: {pool.paidEntryCount ?? pool.entries.length} (or override
                after Venmos roll in)
              </span>
            </div>
          </div>

          <div className="mt-5">
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

          <footer className="mt-10 text-center text-[11px] leading-relaxed text-zinc-600">
            Pool strokes use ESPN live data. WD/DQ picks count +15. MC uses worst made-cut score +5
            when the field is available. Edit <code className="text-zinc-500">public/pool-data.json</code>{' '}
            or set <code className="text-zinc-500">VITE_POOL_DATA_URL</code>. Optional:{' '}
            <code className="text-zinc-500">?pool=https://…/data.json</code> to load remote JSON
            without redeploying.
          </footer>
        </>
      ) : null}
    </div>
  )
}
