import type { PoolData } from './types'
import { fetchPoolFromSheet } from './sheets'

const FALLBACK_URL = '/pool-data.json'

function getSheetId(): string | null {
  const fromQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sheet')
    : null
  return (
    fromQuery?.trim() ||
    import.meta.env.VITE_SHEET_ID?.trim() ||
    null
  )
}

function getPoolJsonUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('pool')?.trim() || null
}

export async function loadPoolData(): Promise<PoolData> {
  const sheetId = getSheetId()
  if (sheetId) {
    return fetchPoolFromSheet(sheetId)
  }

  const jsonUrl = getPoolJsonUrl() || import.meta.env.VITE_POOL_DATA_URL?.trim() || FALLBACK_URL
  const res = await fetch(jsonUrl)
  if (!res.ok) throw new Error(`Could not load pool data (${res.status})`)
  const data = (await res.json()) as PoolData
  if (!data.entries?.length) throw new Error('Pool data has no entries')
  if (!data.league) throw new Error('Pool data missing league')
  return data
}
