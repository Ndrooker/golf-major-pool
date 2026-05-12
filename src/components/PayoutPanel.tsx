import { formatMoney } from '../format'
import type { PayoutBreakdown } from '../payouts'

type Props = {
  breakdown: PayoutBreakdown
}

export function PayoutPanel({ breakdown }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-400/90">
        Prize pool
      </h2>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
        {formatMoney(breakdown.pot)}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">
        {breakdown.paidCount} paid × {formatMoney(breakdown.buyIn)} buy-in (Venmo — not tracked here)
      </p>
      <ul className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
        {breakdown.lines.map((line) => (
          <li key={line.label} className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">
              {line.label}{' '}
              <span className="text-zinc-600">({Math.round(line.fraction * 100)}%)</span>
            </span>
            <span className="font-mono text-zinc-100">{formatMoney(line.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
