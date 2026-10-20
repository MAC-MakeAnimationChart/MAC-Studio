import { useSyncExternalStore } from 'react'

const EVENT = 'mac-studio:storage'

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('storage', cb)
    window.removeEventListener(EVENT, cb)
  }
}

export function notifyStorage() {
  window.dispatchEvent(new Event(EVENT))
}

// Reads a localStorage key as a raw string ('' on the server or when unavailable).
export function useStoredString(key: string | null): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!key) return ''
      try {
        return localStorage.getItem(key) ?? ''
      } catch {
        return ''
      }
    },
    () => '',
  )
}

export function writeStored(key: string, value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
    notifyStorage()
    return true
  } catch {
    return false
  }
}
