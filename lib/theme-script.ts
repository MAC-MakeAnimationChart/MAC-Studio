// Server-safe pieces of the theme setup (no React hooks), so the layout can import them.
export const THEME_KEY = 'mac-studio:theme'
export const THEME_QUERY = '(prefers-color-scheme: dark)'

// Runs in <head> before the first paint so the page never flashes the wrong theme.
// Keep in sync with useTheme in theme.ts.
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('${THEME_KEY}');var d=c==='dark'||(c!=='light'&&window.matchMedia('${THEME_QUERY}').matches);var e=document.documentElement;if(d)e.classList.add('dark');e.style.colorScheme=d?'dark':'light'}catch(_){}})()`
