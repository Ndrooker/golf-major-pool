import type { PoolData, PoolEntry, PayoutFractions } from './types'

function csvUrl(sheetId: string, tab: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
}

/**
 * Minimal CSV row parser. Handles double-quote wrapping that Google Sheets
 * uses when a cell contains commas (rare here, but handles it).
 */
function parseCSVRow(line: string): string[] {
  const cells: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      i++
      let cell = ''
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cell += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          cell += line[i]
          i++
        }
      }
      cells.push(cell)
      if (line[i] === ',') i++
    } else {
      const next = line.indexOf(',', i)
      if (next === -1) {
        cells.push(line.slice(i))
        break
      }
      cells.push(line.slice(i, next))
      i = next + 1
    }
  }
  return cells
}

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseCSVRow)
}

function parseConfigTab(rows: string[][]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const row of rows) {
    const key = row[0]?.trim().toLowerCase()
    const val = row[1]?.trim() ?? ''
    if (key) map[key] = val
  }
  return map
}

function parseEntriesTab(rows: string[][]): PoolEntry[] {
  const entries: PoolEntry[] = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const name = row[0]?.trim()
    if (!name) continue
    const picks = [
      row[1]?.trim() || '',
      row[2]?.trim() || '',
      row[3]?.trim() || '',
      row[4]?.trim() || '',
      row[5]?.trim() || '',
    ] as [string, string, string, string, string]
    if (picks.some((p) => p === '')) continue
    entries.push({ name, picks })
  }
  return entries
}

export async function fetchPoolFromSheet(sheetId: string): Promise<PoolData> {
  const [configRes, entriesRes] = await Promise.all([
    fetch(csvUrl(sheetId, 'Config')),
    fetch(csvUrl(sheetId, 'Entries')),
  ])

  if (!configRes.ok) {
    throw new Error(`Failed to load Config tab (${configRes.status}). Is the sheet published?`)
  }
  if (!entriesRes.ok) {
    throw new Error(`Failed to load Entries tab (${entriesRes.status}). Is the sheet published?`)
  }

  const configText = await configRes.text()
  const entriesText = await entriesRes.text()

  const config = parseConfigTab(parseCSV(configText))
  const entries = parseEntriesTab(parseCSV(entriesText))

  if (entries.length === 0) {
    throw new Error('No valid entries found in the Entries tab (need Name + 5 picks per row)')
  }

  const fractions: PayoutFractions = {
    first: parseFloat(config['first']) || 0.5,
    second: parseFloat(config['second']) || 0.25,
    third: parseFloat(config['third']) || 0.15,
    shank: parseFloat(config['shank']) || 0.1,
  }

  const paidRaw = config['paidcount'] || config['paid'] || ''
  const paidCount = paidRaw ? parseInt(paidRaw, 10) : null

  return {
    title: config['title'] || 'Golf Major Pool',
    league: config['league'] || 'pga',
    eventId: config['eventid'] || null,
    buyInDollars: parseFloat(config['buyin']) || 15,
    payoutFractions: fractions,
    paidEntryCount: Number.isFinite(paidCount) && paidCount! > 0 ? paidCount : null,
    oddsSport: config['oddssport'] || null,
    submitUrl: config['submiturl'] || null,
    entries,
  }
}
