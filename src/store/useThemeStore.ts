import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themes } from '../styles/themes';

export type ThemeKey = keyof typeof themes;

interface ThemeState {
  themeName: ThemeKey;
  setTheme: (themeName: ThemeKey) => void;
  applyTheme: (themeName: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeName: 'default',
      setTheme: (themeName) => {
        set({ themeName });
        get().applyTheme(themeName);
      },
      applyTheme: (themeName) => {
        const theme = themes[themeName];
        if (!theme) return;
        
        Object.entries(theme).forEach(([key, value]) => {
          if (key.startsWith('color')) {
            document.documentElement.style.setProperty(`--${key}`, value as string);
          }
        });
      },
    }),
    {
      name: 'entertainment-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.applyTheme(state.themeName);
        } else {
          // Default fallback
          const defaultThemeObj = themes['default'];
          Object.entries(defaultThemeObj).forEach(([key, value]) => {
            if (key.startsWith('color')) {
              document.documentElement.style.setProperty(`--${key}`, value as string);
            }
          });
        }
      },
    }
  )
);
