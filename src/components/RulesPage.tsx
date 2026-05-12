export function RulesPage() {
  return (
    <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
      <section>
        <h2 className="text-lg font-semibold text-white">How it works</h2>
        <p className="mt-2">
          Pick <strong className="text-white">1 golfer from each of 5 tiers</strong> to build your
          5-man team. Tiers are based on pre-tournament betting odds — Tier 1 is the favorites,
          Tier 5 is the long shots. Everyone submits picks before Round 1 tee time.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Scoring</h2>
        <p className="mt-2">
          Your team score = the <strong className="text-white">sum of your 5 golfers' scores
          relative to par</strong> at the end of the tournament. Lowest combined score wins.
        </p>
        <ul className="mt-3 space-y-1.5 pl-4">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
            <span><strong className="text-zinc-100">Missed cut:</strong> Worst score among players who made the cut, +5 strokes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
            <span><strong className="text-zinc-100">Withdrawal / DQ:</strong> +15 strokes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-600" />
            <span><strong className="text-zinc-100">Tiebreaker:</strong> Best individual golfer finish, then Tier 5 pick score</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Payouts</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500">
                <th className="px-3 py-2 font-medium">Place</th>
                <th className="px-3 py-2 font-medium">% of pot</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-t border-zinc-800/60">
                <td className="px-3 py-2 font-medium text-emerald-400">1st</td>
                <td className="px-3 py-2">50%</td>
              </tr>
              <tr className="border-t border-zinc-800/60">
                <td className="px-3 py-2">2nd</td>
                <td className="px-3 py-2">25%</td>
              </tr>
              <tr className="border-t border-zinc-800/60">
                <td className="px-3 py-2">3rd</td>
                <td className="px-3 py-2">15%</td>
              </tr>
              <tr className="border-t border-zinc-800/60">
                <td className="px-3 py-2 font-medium text-amber-400">Last — "The Shank"</td>
                <td className="px-3 py-2">10%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Buy-in</h2>
        <p className="mt-2">
          <strong className="text-white">$15 per major.</strong> Venmo Nick to lock in your lineup.
          Picks lock at Round 1 tee time — no changes after that.
        </p>
        <p className="mt-2 text-zinc-500">
          Each major is standalone. Play one, two, or all of them — no season commitment.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Quick summary</h2>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-zinc-400">
          <li>Venmo Nick $15</li>
          <li>Pick 1 golfer from each tier (5 total)</li>
          <li>Submit before Round 1 tee time</li>
          <li>Watch the leaderboard all weekend</li>
          <li>Lowest team score wins the pot</li>
        </ol>
      </section>
    </div>
  )
}
