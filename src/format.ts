export function formatRelativeToPar(n: number): string {
  if (n === 0) return 'E'
  if (n > 0) return `+${n}`
  return String(n)
}

export function formatMoney(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}
