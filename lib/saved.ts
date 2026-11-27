import { useMemo } from 'react'
import { normalizeChart, type ChartSpec } from './chart-spec'
import type { Dataset } from './csv'
import { useStoredString, writeStored } from './external-store'
import { MEMBER_STORAGE_MB } from './limits'
import { SAVED_PREFIX } from './storage-keys'

export type { ChartSpec }

// A saved dataset is a "folder": the dataset plus the charts built from it.
export type SavedDataset = {
  id: string
  name: string
  date: string
  dataset: Dataset
  charts: ChartSpec[]
  // Where this folder lives on the backend (ids and revisions), once it has been synced
  // (lib/saved-sync.ts). Absent in mock mode and until the first successful sync.
  sync?: FolderSync
}

export type FolderSync = {
  datasetId: string
  datasetRevision: string
  charts: Record<string, { id: string; revision: string }> // by local chart id
}

export { FREE_UPLOAD_MB, MEMBER_UPLOAD_MB, MEMBER_STORAGE_MB } from './limits'
const MEMBER_STORAGE_BYTES = MEMBER_STORAGE_MB * 1024 * 1024

const keyFor = (email: string) => `${SAVED_PREFIX}${email}`

export const newId = () => Math.random().toString(36).slice(2, 9)

export function today() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`
}

export function useSaved(email: string | null): SavedDataset[] {
  const raw = useStoredString(email ? keyFor(email) : null)
  return useMemo(() => {
    try {
      const parsed = raw ? JSON.parse(raw) : []
      if (!Array.isArray(parsed)) return []
      // charts saved before an option existed get its default
      return (parsed as SavedDataset[]).map((f) => ({ ...f, charts: (f.charts ?? []).map(normalizeChart) }))
    } catch {
      return []
    }
  }, [raw])
}

// The current list, read outside React (for work that finishes after the screen has moved on).
export function readSaved(email: string): SavedDataset[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(keyFor(email)) ?? '[]')
    return Array.isArray(parsed) ? (parsed as SavedDataset[]) : []
  } catch {
    return []
  }
}

export function writeSaved(email: string, list: SavedDataset[]): boolean {
  return writeStored(keyFor(email), JSON.stringify(list))
}

export function sizeOf(list: SavedDataset[]): number {
  return new Blob([JSON.stringify(list)]).size
}

export function overStorageLimit(list: SavedDataset[]): boolean {
  return sizeOf(list) > MEMBER_STORAGE_BYTES
}

export function upsertSaved(list: SavedDataset[], entry: SavedDataset): SavedDataset[] {
  return [entry, ...list.filter((s) => s.id !== entry.id && s.name !== entry.name)]
}
