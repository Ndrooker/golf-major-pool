import { useEffect, useState } from 'react'
import type { TierDef } from '../tiers'
import { submitPicks } from '../api/submitPicks'

type Props = {
  tiers: TierDef[]
  submitUrl: string | null
  existingNames: string[]
}

const TIER_COLORS: Record<number, string> = {
  1: 'border-emerald-700 bg-emerald-950/40',
  2: 'border-sky-800 bg-sky-950/30',
  3: 'border-zinc-700 bg-zinc-900/50',
  4: 'border-amber-900/60 bg-amber-950/20',
  5: 'border-zinc-800 bg-zinc-900/30',
}

const TIER_HEADER_COLORS: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-sky-400',
  3: 'text-zinc-300',
  4: 'text-amber-400',
  5: 'text-zinc-500',
}

export function TierList({ tiers, submitUrl, existingNames }: Props) {
  const [selections, setSelections] = useState<Record<number, string>>({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [savedName, setSavedName] = useState('')
  const [savedPicks, setSavedPicks] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('golfpool_submitted')
      if (stored) {
        const data = JSON.parse(stored) as { name: string; picks: string[] }
        if (data.name && data.picks?.length === 5) {
          setSavedName(data.name)
          setSavedPicks(data.picks)
          setSubmitted(true)
        }
      }
    } catch { /* ignore corrupt localStorage */ }
  }, [])

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
  const allPicked = [1, 2, 3, 4, 5].every((t) => selections[t])
  const canSubmit = fullName !== '' && firstName.trim() !== '' && lastName.trim() !== '' && allPicked && !submitting && !submitted

  const handleSelect = (tier: number, golferName: string) => {
    if (submitted) return
    setSelections((s) => ({ ...s, [tier]: golferName }))
  }

  const handleSubmit = async () => {
    if (!fullName || !allPicked || !submitUrl) return

    if (existingNames.some((n) => n.toLowerCase() === fullName.toLowerCase())) {
      setError(`"${fullName}" already has a lineup submitted. Use a different name or contact Nick.`)
      return
    }

    setSubmitting(true)
    setError(null)

    const picks = [1, 2, 3, 4, 5].map((t) => selections[t])
    const result = await submitPicks(submitUrl, fullName, picks)

    setSubmitting(false)
    if (result.ok) {
      setSavedName(fullName)
      setSavedPicks(picks)
      localStorage.setItem('golfpool_submitted', JSON.stringify({ name: fullName, picks }))
      setSubmitted(true)
    } else {
      setError(result.error ?? 'Submission failed — try again.')
    }
  }

  return (
    <div className="mt-6">
      {/* Sticky submission bar */}
      <div className="sticky top-0 z-10 rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-sm">
        {submitted ? (
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-400">Lineup locked!</p>
            <p className="mt-1 text-xs text-zinc-500">
              {savedName}'s picks are in. Check the Leaderboard tab once the tournament starts.
            </p>
            {savedPicks.length > 0 ? (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px]">
                {savedPicks.map((p, i) => (
                  <span
                    key={i}
                    className="rounded border border-emerald-800 bg-emerald-950/50 px-1.5 py-0.5 text-emerald-300"
                  >
                    T{i + 1}: {p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitted}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitted}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit || !submitUrl}
                className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? 'Submitting…' : 'Submit Lineup'}
              </button>
            </div>
            {/* Pick summary */}
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              {[1, 2, 3, 4, 5].map((t) => (
                <span
                  key={t}
                  className={`rounded px-1.5 py-0.5 ${
                    selections[t]
                      ? 'border border-emerald-800 bg-emerald-950/50 text-emerald-300'
                      : 'border border-zinc-800 text-zinc-600'
                  }`}
                >
                  T{t}: {selections[t] ?? '—'}
                </span>
              ))}
            </div>
            {!submitUrl ? (
              <p className="mt-2 text-xs text-amber-500/80">
                Submissions not yet open (submitUrl not configured).
              </p>
            ) : null}
          </>
        )}
        {error ? (
          <p className="mt-2 text-xs text-rose-400">{error}</p>
        ) : null}
      </div>

      {/* Tier sections */}
      <div className="mt-4 space-y-4">
        {tiers.map((tierDef) => (
          <section
            key={tierDef.tier}
            className={`overflow-hidden rounded-xl border ${TIER_COLORS[tierDef.tier]}`}
          >
            <header className="flex items-center justify-between px-4 py-3">
              <div>
                <h3 className={`text-sm font-semibold ${TIER_HEADER_COLORS[tierDef.tier]}`}>
                  {tierDef.label} — {tierDef.description}
                </h3>
                <p className="text-xs text-zinc-600">{tierDef.golfers.length} golfers</p>
              </div>
              {selections[tierDef.tier] ? (
                <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  {selections[tierDef.tier]}
                </span>
              ) : null}
            </header>
            <ul className="divide-y divide-zinc-800/60">
              {tierDef.golfers.map((g) => {
                const selected = selections[tierDef.tier] === g.name
                return (
                  <li key={g.name}>
                    <button
                      type="button"
                      onClick={() => handleSelect(tierDef.tier, g.name)}
                      disabled={submitted}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                        selected
                          ? 'bg-emerald-950/40'
                          : 'hover:bg-zinc-800/40'
                      } disabled:cursor-default`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                          selected
                            ? 'border-emerald-500 bg-emerald-600 text-white'
                            : 'border-zinc-700 text-zinc-600'
                        }`}
                      >
                        {selected ? '✓' : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
                        {g.name}
                      </span>
                      {g.oddsDisplay ? (
                        <span className="shrink-0 font-mono text-xs text-zinc-500">
                          {g.oddsDisplay}
                        </span>
                      ) : g.sortOrder ? (
                        <span className="shrink-0 font-mono text-xs text-zinc-600">
                          #{g.sortOrder}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
              {tierDef.golfers.length === 0 ? (
                <li className="px-4 py-3 text-xs text-zinc-600">
                  No golfers in this tier yet.
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
