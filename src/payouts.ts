import type { PayoutFractions } from './types'

export type PayoutBreakdown = {
  pot: number
  buyIn: number
  paidCount: number
  lines: { label: string; amount: number; fraction: number }[]
}

export function computePayouts(
  paidCount: number,
  buyInDollars: number,
  fractions: PayoutFractions,
): PayoutBreakdown {
  const pot = Math.round(paidCount * buyInDollars * 100) / 100
  const lines = [
    { label: '1st', fraction: fractions.first, amount: round2(pot * fractions.first) },
    { label: '2nd', fraction: fractions.second, amount: round2(pot * fractions.second) },
    { label: '3rd', fraction: fractions.third, amount: round2(pot * fractions.third) },
    {
      label: 'The Shank (last)',
      fraction: fractions.shank,
      amount: round2(pot * fractions.shank),
    },
  ]
  const sum = round2(lines.reduce((a, l) => a + l.amount, 0))
  const drift = round2(pot - sum)
  if (drift !== 0 && lines[0]) {
    lines[0] = { ...lines[0], amount: round2(lines[0].amount + drift) }
  }
  return { pot, buyIn: buyInDollars, paidCount, lines }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
