import { useState } from 'react'
import type { LeaderboardRow } from '../types'
import { formatRelativeToPar } from '../format'

type Props = {
  rows: LeaderboardRow[]
  worstRank: number
}

function strokeClass(n: number | null): string {
  if (n == null) return 'text-zinc-500'
  if (n < 0) return 'text-emerald-400'
  if (n > 0) return 'text-rose-400'
  return 'text-zinc-300'
}

export function LeaderboardTable({ rows, worstRank }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const toggle = (name: string) => {
    setOpen((o) => ({ ...o, [name]: !o[name] }))
  }

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
        Live standings
      </h2>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => {
          const isShank =
            rows.length > 1 && row.rank === worstRank && worstRank > 0
          const expanded = !!open[row.name]
          return (
            <li
              key={row.name}
              className={`overflow-hidden rounded-xl border ${
                isShank
                  ? 'border-amber-900/80 bg-amber-950/30'
                  : 'border-zinc-800 bg-zinc-900/40'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(row.name)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-zinc-800/50"
              >
                <span className="w-8 shrink-0 text-center font-mono text-lg font-semibold text-zinc-500">
                  {row.rank ?? '—'}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-zinc-100">
                  {row.name}
                  {isShank ? (
                    <span className="ml-2 text-xs font-normal text-amber-500/90">The Shank</span>
                  ) : null}
                </span>
                <span
                  className={`shrink-0 font-mono text-lg font-semibold ${strokeClass(row.teamTotal)}`}
                >
                  {row.teamTotal == null ? '—' : formatRelativeToPar(row.teamTotal)}
                </span>
                <span className="w-6 shrink-0 text-zinc-600">{expanded ? '▾' : '▸'}</span>
              </button>
              {expanded ? (
                <div className="border-t border-zinc-800/80 bg-black/20 px-3 py-2 pb-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-zinc-600">
                        <th className="py-1 font-normal">Tier</th>
                        <th className="py-1 font-normal">Pick</th>
                        <th className="py-1 text-right font-normal">Pool</th>
                        <th className="py-1 text-right font-normal">Live</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.picks.map((p) => (
                        <tr key={p.tier} className="border-t border-zinc-800/60 text-zinc-300">
                          <td className="py-1.5 pr-2 font-mono text-zinc-500">{p.tier}</td>
                          <td className="py-1.5">
                            <span className={p.matched ? '' : 'text-rose-400'}>{p.pickName}</span>
                            {p.golfer?.positionDisplay ? (
                              <span className="ml-1 text-zinc-600">
                                ({p.golfer.positionDisplay}
                                {p.golfer.thruDisplay ? ` · ${p.golfer.thruDisplay}` : ''})
                              </span>
                            ) : null}
                            {p.note ? (
                              <span className="mt-0.5 block text-[10px] leading-tight text-zinc-600">
                                {p.note}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-1.5 text-right font-mono">
                            {p.strokes == null ? (
                              '—'
                            ) : (
                              <span className={strokeClass(p.strokes)}>
                                {formatRelativeToPar(p.strokes)}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 text-right text-zinc-600">
                            {p.golfer?.scoreToPar == null
                              ? '—'
                              : formatRelativeToPar(p.golfer.scoreToPar)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
