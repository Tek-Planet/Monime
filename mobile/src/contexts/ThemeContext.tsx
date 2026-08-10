import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  themeMode: ThemeMode;
  primary: string;
  primaryHover: string;
  secondary: string;
  fintechBlue: string;
  prosperityGreen: string;
  background: string;
  surface: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  headerBg: string;
  headerText: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
}

const lightColors: ThemeColors = {
  isDark: false,
  themeMode: 'light',
  primary: '#6E56CF', // MiBuks Brand Purple hsl(249 77% 62%)
  primaryHover: '#5B45BD',
  secondary: '#F59E0B', // MiBuks Brand Orange hsl(35 91% 60%)
  fintechBlue: '#2563EB',
  prosperityGreen: '#059669', // Prosperity Green hsl(160 84% 39%)
  background: '#F8FAFC', // slate-50 hsl(215 20% 98%)
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0', // slate-200 hsl(215 20% 91%)
  textPrimary: '#334155', // slate-700 hsl(215 25% 27%)
  textSecondary: '#64748B', // slate-500 hsl(215 16% 47%)
  textMuted: '#94A3B8',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputText: '#334155',
  inputPlaceholder: '#94A3B8',
  headerBg: '#6E56CF',
  headerText: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#6E56CF',
  tabBarInactive: '#64748B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#059669',
  info: '#2563EB',
};

const darkColors: ThemeColors = {
  isDark: true,
  themeMode: 'dark',
  primary: '#8B5CF6',
  primaryHover: '#7C3AED',
  secondary: '#F59E0B',
  fintechBlue: '#3B82F6',
  prosperityGreen: '#10B981',
  background: '#1E293B', // slate-800 hsl(215 28% 17%)
  surface: '#2B3544',
  cardBg: '#2D3748', // slate-700 hsl(215 25% 20%)
  cardBorder: '#334155',
  textPrimary: '#F8FAFC', // slate-50 hsl(215 20% 98%)
  textSecondary: '#94A3B8', // slate-400 hsl(215 13% 65%)
  textMuted: '#64748B',
  inputBg: '#1E293B',
  inputBorder: '#334155',
  inputText: '#F8FAFC',
  inputPlaceholder: '#64748B',
  headerBg: '#1E293B',
  headerText: '#F8FAFC',
  tabBarBg: '#1E293B',
  tabBarBorder: '#334155',
  tabBarActive: '#8B5CF6',
  tabBarInactive: '#94A3B8',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  setThemeMode: async () => {},
  colors: lightColors,
  isDark: false,
});

const THEME_STORAGE_KEY = '@mibuks_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((val) => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setThemeModeState(val as ThemeMode);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const activeIsDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const activeColors = activeIsDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        colors: activeColors,
        isDark: activeIsDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
