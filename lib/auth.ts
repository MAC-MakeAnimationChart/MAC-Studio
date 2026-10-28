import { useStoredString, writeStored } from './external-store'
import { markSeen } from './storage-cleanup'
import { USER_KEY } from './storage-keys'

// Placeholder session until a backend exists: only the email is kept, in this browser.
// Passwords are never stored or checked.
export function useUser(): string | null {
  return useStoredString(USER_KEY) || null
}

export function login(email: string) {
  markSeen(email) // starts the retention clock (lib/storage-cleanup.ts)
  writeStored(USER_KEY, email)
}

export function logout() {
  writeStored(USER_KEY, null)
}
