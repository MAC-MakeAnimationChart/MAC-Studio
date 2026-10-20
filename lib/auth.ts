import { useStoredString, writeStored } from './external-store'

const USER_KEY = 'mac-studio:user'

// Placeholder session until a backend exists: only the email is kept, in this browser.
// Passwords are never stored or checked.
export function useUser(): string | null {
  return useStoredString(USER_KEY) || null
}

export function login(email: string) {
  writeStored(USER_KEY, email)
}

export function logout() {
  writeStored(USER_KEY, null)
}
