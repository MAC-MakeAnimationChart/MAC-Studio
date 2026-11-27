import { logoutApi, restoreSession, userKey } from './auth-api'
import { useStoredString, writeStored } from './external-store'
import { markSeen } from './storage-cleanup'
import { USER_KEY } from './storage-keys'

// Only a "logged in as" label is kept in this browser (the email, or the id when there is none).
// The real session is the backend's refresh cookie plus an access token held in memory
// (lib/api-client.ts); in mock mode (NEXT_PUBLIC_IS_MOCK) this label is the whole session and
// passwords are never stored or checked.
export function useUser(): string | null {
  return useStoredString(USER_KEY) || null
}

export function login(email: string) {
  markSeen(email) // starts the retention clock (lib/storage-cleanup.ts)
  writeStored(USER_KEY, email)
}

export function logout() {
  writeStored(USER_KEY, null)
  void logoutApi()
}

// On app start: ask the backend whether the refresh cookie still gives a session, and make the label
// match. An unreachable server changes nothing (an outage must not log people out).
export async function restoreLogin() {
  const r = await restoreSession()
  if (r.kind === 'user') login(userKey(r.user))
  else if (r.kind === 'none') writeStored(USER_KEY, null)
}
