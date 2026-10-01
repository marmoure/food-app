export const THEME_KEY = 'cube-kitchen:theme';
export const THEMES = [
  { id: 'system', name: 'System', description: 'Follow your device' },
  { id: 'light', name: 'Sage', description: 'Light & fresh' },
  { id: 'sand', name: 'Sand', description: 'Light & warm' },
  { id: 'dark', name: 'Forest', description: 'Dark & leafy' },
  { id: 'midnight', name: 'Midnight', description: 'Dark & cool' },
] as const;
export type Theme = (typeof THEMES)[number]['id'];

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.find((theme) => theme.id === saved)?.id ?? 'system';
  } catch {
    return 'system';
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The choice still works for this session when browser storage is unavailable.
  }
}

export function applyTheme(theme: Theme) {
  const resolved =
    theme === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.dataset.theme = resolved;
  const color = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
}
