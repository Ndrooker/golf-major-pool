import type { PoolData } from './types'
import { fetchPoolFromSheet } from './sheets'

const FALLBACK_URL = '/pool-data.json'

const PLACEHOLDER_RE = /^replace|^your|^xxx|^placeholder|^todo/i

function isRealSheetId(id: string | undefined | null): id is string {
  if (!id) return false
  const trimmed = id.trim()
  if (trimmed.length < 10) return false
  if (PLACEHOLDER_RE.test(trimmed)) return false
  return true
}

function getSheetId(): string | null {
  const fromQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('sheet')
    : null
  const raw = fromQuery?.trim() || import.meta.env.VITE_SHEET_ID?.trim() || null
  return isRealSheetId(raw) ? raw : null
}

function getPoolJsonUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('pool')?.trim() || null
}

async function loadFromJson(url: string): Promise<PoolData> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load pool data (${res.status})`)
  const data = (await res.json()) as PoolData
  if (!data.entries?.length) throw new Error('Pool data has no entries')
  if (!data.league) throw new Error('Pool data missing league')
  return data
}

export async function loadPoolData(): Promise<PoolData> {
  const sheetId = getSheetId()
  if (sheetId) {
    try {
      return await fetchPoolFromSheet(sheetId)
    } catch (e) {
      console.warn('Sheet load failed, falling back to pool-data.json:', e)
    }
  }

  const jsonUrl = getPoolJsonUrl() || import.meta.env.VITE_POOL_DATA_URL?.trim() || FALLBACK_URL
  return loadFromJson(jsonUrl)
}
