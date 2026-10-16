// theme.ts
import { vars } from "nativewind";

export interface ThemeFonts {
  heading: {
    family: string;
    weights: Record<string, string>;
  };
  body: {
    family: string;
    weights: Record<string, string>;
  };
  mono: {
    family: string;
    weights: Record<string, string>;
  };
}

export const themeFonts: ThemeFonts = {
  heading: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
  },
  body: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      normal: 'JetBrainsMono_400Regular',
      bold: 'JetBrainsMono_700Bold',
    },
  },
};

/**
 * Neo-brutalist palette. Values are space-separated RGB channels because
 * tailwind.config.js consumes them as `rgb(var(--token) / <alpha-value>)`.
 *
 * The app is deliberately light-only (see ThemeProvider) — the bright palette
 * is the brand. darkTheme exists so the shape is stable if that ever changes.
 */
export const lightTheme = vars({
  '--background': '250 245 233',        // cream
  '--foreground': '18 18 18',           // ink
  '--card': '255 255 255',              // white
  '--card-foreground': '18 18 18',
  '--popover': '255 255 255',
  '--popover-foreground': '18 18 18',
  '--primary': '255 214 0',             // yellow (#FFD600)
  '--primary-foreground': '18 18 18',
  '--secondary': '255 93 162',          // pink (#FF5DA2)
  '--secondary-foreground': '18 18 18',
  '--muted': '240 234 220',
  '--muted-foreground': '107 107 107',
  '--accent': '89 208 124',             // green (#59D07C)
  '--accent-foreground': '18 18 18',
  '--destructive': '229 72 77',
  '--destructive-foreground': '255 255 255',
  '--border': '18 18 18',               // heavy ink borders
  '--input': '18 18 18',
  '--ring': '18 18 18',
  '--chart-1': '255 93 162',
  '--chart-2': '255 197 61',
  '--chart-3': '78 168 255',
  '--chart-4': '89 208 124',
  '--chart-5': '155 140 255',
  '--radius': '4px',
});

export const darkTheme = vars({
  '--background': '18 18 18',
  '--foreground': '245 245 245',
  '--card': '28 28 28',
  '--card-foreground': '245 245 245',
  '--popover': '28 28 28',
  '--popover-foreground': '245 245 245',
  '--primary': '255 214 0',
  '--primary-foreground': '18 18 18',
  '--secondary': '255 93 162',
  '--secondary-foreground': '18 18 18',
  '--muted': '38 38 38',
  '--muted-foreground': '163 163 163',
  '--accent': '89 208 124',
  '--accent-foreground': '18 18 18',
  '--destructive': '229 72 77',
  '--destructive-foreground': '255 255 255',
  '--border': '245 245 245',
  '--input': '245 245 245',
  '--ring': '245 245 245',
  '--chart-1': '255 93 162',
  '--chart-2': '255 197 61',
  '--chart-3': '78 168 255',
  '--chart-4': '89 208 124',
  '--chart-5': '155 140 255',
  '--radius': '4px',
});
