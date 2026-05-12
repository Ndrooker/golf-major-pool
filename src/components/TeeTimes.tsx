import type { EspnCompetitor } from '../api/espn'
import { normalizeName, fuzzyNameMatch } from '../normalize'

type Props = {
  userName: string
  userPicks: string[]
  competitors: EspnCompetitor[]
  allLineups: { name: string; picks: string[] }[]
}

function findCompetitorForPick(
  pickName: string,
  competitors: EspnCompetitor[],
): EspnCompetitor | undefined {
  const key = normalizeName(pickName)
  for (const c of competitors) {
    const name = c.athlete?.displayName
    if (!name) continue
    if (normalizeName(name) === key) return c
    if (fuzzyNameMatch(key, normalizeName(name))) return c
  }
  return undefined
}

export function TeeTimes({ userName, userPicks, competitors, allLineups }: Props) {
  return (
    <div className="mt-6 space-y-6">
      {/* User's picks with tee times */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
          {userName}'s Team
        </h2>
        <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Golfer</th>
                <th className="px-3 py-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {userPicks.map((pick, i) => {
                const comp = findCompetitorForPick(pick, competitors)
                const status = comp?.status?.displayValue ?? '—'
                return (
                  <tr key={i} className="border-t border-zinc-800/60">
                    <td className="px-3 py-2 text-zinc-500">T{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-zinc-200">{pick}</td>
                    <td className="px-3 py-2 text-right text-zinc-400">{status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* All lineups */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
          All Lineups ({allLineups.length} entries)
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
              {allLineups.map((e) => (
                <tr
                  key={e.name}
                  className={`border-t border-zinc-800/80 ${
                    e.name.toLowerCase() === userName.toLowerCase()
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
              {allLineups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-zinc-600">
                    No entries yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
