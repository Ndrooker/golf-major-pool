import { useMemo } from 'react'
import type { EspnCompetitor } from '../api/espn'
import { competitorToGolferState } from '../api/espn'
import { normalizeName, fuzzyNameMatch } from '../normalize'
import { formatRelativeToPar } from '../format'
import type { GolferState } from '../types'

type Props = {
  competitors: EspnCompetitor[]
  userPicks: string[]
  onRefresh: () => void
  updatedAt: Date | null
}

type SortableRow = {
  competitor: EspnCompetitor
  name: string
  golfer: GolferState | null
  score: number | null
  thruNum: number
}

function parseThru(thruDisplay: string | null | undefined): number {
  if (!thruDisplay) return 0
  const cleaned = thruDisplay.replace(/[^0-9]/g, '')
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : 0
}

function sortCompetitors(competitors: EspnCompetitor[]): SortableRow[] {
  const rows: SortableRow[] = []
  for (const c of competitors) {
    const name = c.athlete?.displayName ?? ''
    if (!name) continue
    const golfer = competitorToGolferState(c)
    const score = golfer?.scoreToPar ?? null
    const thruRaw = golfer?.thruDisplay ?? c.status?.displayThru ?? c.status?.thru?.toString() ?? null
    const thruNum = parseThru(thruRaw)
    rows.push({ competitor: c, name, golfer, score, thruNum })
  }

  rows.sort((a, b) => {
    const scoreA = a.score ?? 999
    const scoreB = b.score ?? 999
    if (scoreA !== scoreB) return scoreA - scoreB
    // Same score: prefer player who has played more holes
    if (a.thruNum !== b.thruNum) return b.thruNum - a.thruNum
    // Final tiebreaker: alphabetical
    return a.name.localeCompare(b.name)
  })

  return rows
}

function isUserPick(competitorName: string, userPicks: string[]): boolean {
  const normalized = normalizeName(competitorName)
  return userPicks.some((pick) => {
    const np = normalizeName(pick)
    return np === normalized || fuzzyNameMatch(np, normalized)
  })
}

export function TournamentLeaderboard({ competitors, userPicks, onRefresh, updatedAt }: Props) {
  const sorted = useMemo(() => sortCompetitors(competitors), [competitors])

  return (
    <section className="mt-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
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

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-500">
              <th className="px-3 py-2 font-medium">Pos</th>
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 text-right font-medium">Score</th>
              <th className="px-3 py-2 text-right font-medium">Thru</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const { competitor: c, name, golfer, score, thruNum } = row
              const picked = isUserPick(name, userPicks)
              const pos = c.status?.position?.displayName ?? '—'
              const thruDisplay = golfer?.thruDisplay ?? c.status?.displayValue ?? '—'

              return (
                <tr
                  key={c.id}
                  className={`border-t border-zinc-800/60 ${
                    picked
                      ? 'bg-emerald-950/30 border-l-2 border-l-emerald-500'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500">{pos}</td>
                  <td className={`px-3 py-2 ${picked ? 'font-semibold text-emerald-300' : 'text-zinc-200'}`}>
                    {name}
                    {picked ? (
                      <span className="ml-1.5 text-[10px] font-normal text-emerald-500/70">MY PICK</span>
                    ) : null}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${
                    score == null
                      ? 'text-zinc-500'
                      : score < 0
                        ? 'text-emerald-400'
                        : score > 0
                          ? 'text-rose-400'
                          : 'text-zinc-300'
                  }`}>
                    {score == null ? '—' : formatRelativeToPar(score)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-zinc-500">
                    {thruNum > 0 ? thruNum : thruDisplay}
                  </td>
                </tr>
              )
            })}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-600">
                  Tournament field not yet available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}
