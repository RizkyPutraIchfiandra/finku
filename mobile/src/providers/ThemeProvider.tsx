// ThemeProvider.tsx
import { createContext, useContext, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { lightTheme } from '@/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextValue {
  isDark: boolean;
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colorScheme: 'light',
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // The app is deliberately light-only: the bright neo-brutalist palette is the brand.
  // Following the system dark scheme would repaint every screen near-black.
  const colorScheme: ThemeContextValue['colorScheme'] = 'light';
  const themeVars = lightTheme;

  // On web, RN Modal portals to document.body — outside any wrapper View —
  // so CSS variables set on a wrapper don't reach modal content. Apply them
  // to documentElement so they're globally available.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = document.documentElement;
    // themeVars may be a plain object of CSS vars or wrapped as { __cssVars: {...} }
    // by the browser-metro nativewind shim. Unwrap if needed.
    const vars: Record<string, string> =
      (themeVars as any).__cssVars ?? themeVars;
    const prev: Record<string, string> = {};
    for (const [key, value] of Object.entries(vars)) {
      prev[key] = root.style.getPropertyValue(key);
      root.style.setProperty(key, String(value));
    }
    root.classList.remove('light', 'dark');
    if (colorScheme) root.classList.add(colorScheme);

    return () => {
      for (const [key, value] of Object.entries(prev)) {
        if (value) root.style.setProperty(key, value);
        else root.style.removeProperty(key);
      }
    };
  }, [themeVars, colorScheme]);

  return (
    <ThemeContext.Provider value={{ isDark: false, colorScheme }}>
      <View style={[{ flex: 1 }, themeVars as any]}>{children}</View>
    </ThemeContext.Provider>
  );
}
