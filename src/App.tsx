import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchEspnLeaderboard, type EspnCompetitor } from './api/espn'
import { fetchOdds, type OddsGolfer } from './api/odds'
import { LeaderboardTable } from './components/LeaderboardTable'
import { PayoutPanel } from './components/PayoutPanel'
import { RulesPage } from './components/RulesPage'
import { TeeTimes } from './components/TeeTimes'
import { TierList } from './components/TierList'
import { WelcomePage } from './components/WelcomePage'
import { computePayouts } from './payouts'
import { buildLeaderboard } from './scoring'
import { buildTiersFromOdds, buildTiersFromEspn, type TierDef } from './tiers'
import { loadPoolData } from './loadPool'
import type { LeaderboardRow, PoolData } from './types'

const REFRESH_MS = 60_000
const LS_USER_KEY = 'golfpool_user'
const LS_SUBMITTED_KEY = 'golfpool_submitted'

type UserState = {
  firstName: string
  lastName: string
}

type SubmissionState = {
  name: string
  picks: string[]
}

function loadUserState(): UserState | null {
  try {
    const raw = localStorage.getItem(LS_USER_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as UserState
    if (data.firstName && data.lastName) return data
  } catch { /* ignore */ }
  return null
}

function loadSubmissionState(): SubmissionState | null {
  try {
    const raw = localStorage.getItem(LS_SUBMITTED_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SubmissionState
    if (data.name && data.picks?.length === 5) return data
  } catch { /* ignore */ }
  return null
}

export default function App() {
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

  // Onboarding / submission state
  const [userState, setUserState] = useState<UserState | null>(loadUserState)
  const [submission, setSubmission] = useState<SubmissionState | null>(loadSubmissionState)

  const hasSubmitted = submission !== null
  const tournamentStarted = eventState === 'in' || eventState === 'post'

  // Determine which "phase" the user is in
  type Phase = 'welcome' | 'picking' | 'submitted'
  const phase: Phase = hasSubmitted ? 'submitted' : userState ? 'picking' : 'welcome'

  // Tab logic depends on phase
  type Tab = 'standings' | 'lineups' | 'rules' | 'pick'
  const [tab, setTab] = useState<Tab>(phase === 'submitted' ? 'standings' : 'pick')

  // Update tab when phase changes
  useEffect(() => {
    if (phase === 'submitted' && tab === 'pick') {
      setTab('standings')
    }
  }, [phase, tab])

  const tabs = useMemo((): { id: Tab; label: string }[] => {
    if (phase === 'submitted') {
      return [
        { id: 'standings', label: tournamentStarted ? 'Live Standings' : 'Tee Times' },
        { id: 'lineups', label: 'All Lineups' },
        { id: 'rules', label: 'Rules' },
      ]
    }
    if (phase === 'picking') {
      return [
        { id: 'pick', label: 'Pick Your Team' },
        { id: 'rules', label: 'Rules' },
      ]
    }
    return []
  }, [phase, tournamentStarted])

  // Data loading
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

  // Handlers
  const handleOnboardingComplete = (firstName: string, lastName: string) => {
    const state: UserState = { firstName, lastName }
    localStorage.setItem(LS_USER_KEY, JSON.stringify(state))
    setUserState(state)
    setTab('pick')
  }

  const handleReturningUser = (name: string, picks: string[]) => {
    const sub: SubmissionState = { name, picks }
    localStorage.setItem(LS_SUBMITTED_KEY, JSON.stringify(sub))
    const parts = name.split(' ')
    const user: UserState = { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '' }
    localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
    setUserState(user)
    setSubmission(sub)
    setTab('standings')
  }

  const handleSubmissionComplete = (name: string, picks: string[]) => {
    const state: SubmissionState = { name, picks }
    localStorage.setItem(LS_SUBMITTED_KEY, JSON.stringify(state))
    setSubmission(state)
    setTab('standings')
  }

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
          <p className="mt-1 text-sm text-zinc-500">{eventTitle}</p>
        ) : null}
      </header>

      {/* Tab bar (hidden during welcome phase) */}
      {tabs.length > 0 ? (
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
      ) : null}

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

      {/* Welcome / Onboarding */}
      {phase === 'welcome' && pool ? (
        <WelcomePage
          poolTitle={pool.title}
          existingEntries={pool.entries.map((e) => ({ name: e.name, picks: [...e.picks] }))}
          onContinue={handleOnboardingComplete}
          onReturningUser={handleReturningUser}
        />
      ) : null}

      {/* Pick Your Team */}
      {phase === 'picking' && tab === 'pick' && pool ? (
        <TierList
          tiers={tiers}
          submitUrl={pool.submitUrl ?? null}
          existingNames={existingNames}
          prefillFirstName={userState!.firstName}
          prefillLastName={userState!.lastName}
          onSubmitted={handleSubmissionComplete}
        />
      ) : null}

      {/* Post-submission: Standings / Tee Times */}
      {phase === 'submitted' && tab === 'standings' && pool ? (
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
          <TeeTimes
            userName={submission!.name}
            userPicks={submission!.picks}
            competitors={competitors}
            allLineups={pool.entries.map((e) => ({ name: e.name, picks: [...e.picks] }))}
          />
        )
      ) : null}

      {/* All Lineups tab (post-submission only) */}
      {phase === 'submitted' && tab === 'lineups' && pool ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
            All Lineups ({pool.entries.length} entries)
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
                  <tr
                    key={e.name}
                    className={`border-t border-zinc-800/80 ${
                      submission && e.name.toLowerCase() === submission.name.toLowerCase()
                        ? 'bg-emerald-950/20'
                        : ''
                    }`}
                  >
                    <td className="px-2 py-2 font-medium text-zinc-200">{e.name}</td>
                    {e.picks.map((p, i) => (
                      <td key={i} className="max-w-[7rem] truncate px-2 py-2 text-zinc-400">
                        {p}
                      </td>
                    ))}
                  </tr>
                ))}
                {pool.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-zinc-600">
                      No entries yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {payout ? (
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
                  {pool.paidEntryCount ?? pool.entries.length} entries
                </span>
              </div>
              <div className="mt-3">
                <PayoutPanel breakdown={payout} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Rules */}
      {tab === 'rules' && phase !== 'welcome' ? <RulesPage /> : null}
    </div>
  )
}
