// Site theme. Dark is the default (OpenShaders is dark-first). The inline THEME_INIT_SCRIPT in
// __root.tsx applies the stored mode before paint; this store mirrors it for React.
import { createStore } from '@tanstack/store'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeState {
  mode: ThemeMode
  resolved: ResolvedTheme
}

export const themeStore = createStore<ThemeState>({ mode: 'dark', resolved: 'dark' })

function isMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto'
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'auto') return mode
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(mode: ThemeMode) {
  const resolved = resolve(mode)
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  if (mode === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  root.style.colorScheme = resolved
  themeStore.setState(() => ({ mode, resolved }))
}

export function setThemeMode(mode: ThemeMode) {
  window.localStorage.setItem('theme', mode)
  apply(mode)
}

export const NEXT_MODE: Record<ThemeMode, ThemeMode> = { dark: 'light', light: 'auto', auto: 'dark' }

/** Sync the store with the stored choice and follow the OS while in auto. Returns cleanup. */
export function connectTheme(): () => void {
  const stored = window.localStorage.getItem('theme')
  apply(isMode(stored) ? stored : 'dark')
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (themeStore.state.mode === 'auto') apply('auto')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
