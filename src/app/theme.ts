export type ThemePref = 'light' | 'dark' | 'system'

export const resolveTheme = (pref: ThemePref): 'light' | 'dark' =>
  pref === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : pref

/** Aplica el tema al <html>: data-theme (tokens CSS) + color-scheme (controles nativos). */
export function applyTheme(pref: ThemePref): void {
  const t = resolveTheme(pref)
  document.documentElement.dataset.theme = t
  document.documentElement.style.colorScheme = t
}
