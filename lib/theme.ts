import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useStoredString, writeStored } from './external-store'
import { THEME_KEY as KEY, THEME_QUERY as QUERY } from './theme-script'

export type ThemeChoice = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

// `choice` is what the user picked ('system' until they pick); `theme` is what is shown.
// First visit follows the browser/OS setting, and keeps following it until the user picks one.
export function useTheme() {
  const stored = useStoredString(KEY)
  const choice: ThemeChoice = stored === 'light' || stored === 'dark' ? stored : 'system'
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
  const theme: Theme = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice

  const setChoice = useCallback((next: ThemeChoice) => {
    writeStored(KEY, next === 'system' ? null : next)
  }, [])

  return { choice, theme, setChoice }
}

// Applies the theme to <html>. Rendered once in the layout.
export function useApplyTheme() {
  const { theme } = useTheme()
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B1020' : '#FAFAFC')
  }, [theme])
}
