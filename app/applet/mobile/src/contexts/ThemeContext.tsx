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
  primary: '#6E56CF', // MiBuks Brand Purple
  primaryHover: '#5B45BD',
  secondary: '#F59E0B', // MiBuks Brand Orange
  fintechBlue: '#3B82F6',
  prosperityGreen: '#10B981',
  background: '#F8FAFC', // slate-50
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0', // slate-200
  textPrimary: '#0F172A', // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#64748B', // slate-500
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1', // slate-300
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  headerBg: '#6E56CF', // Primary Brand Purple Header
  headerText: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#6E56CF',
  tabBarInactive: '#64748B',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
};

const darkColors: ThemeColors = {
  isDark: true,
  themeMode: 'dark',
  primary: '#8B5CF6', // Lighter purple for dark contrast
  primaryHover: '#7C3AED',
  secondary: '#F59E0B',
  fintechBlue: '#60A5FA',
  prosperityGreen: '#34D399',
  background: '#0F172A', // slate-900
  surface: '#1E293B', // slate-800
  cardBg: '#1E293B', // slate-800
  cardBorder: '#334155', // slate-700
  textPrimary: '#F8FAFC', // slate-50
  textSecondary: '#CBD5E1', // slate-300
  textMuted: '#94A3B8', // slate-400
  inputBg: '#1E293B',
  inputBorder: '#334155',
  inputText: '#F8FAFC',
  inputPlaceholder: '#64748B',
  headerBg: '#0F172A', // slate-900
  headerText: '#F8FAFC',
  tabBarBg: '#0F172A',
  tabBarBorder: '#1E293B',
  tabBarActive: '#A78BFA',
  tabBarInactive: '#64748B',
  danger: '#F87171',
  warning: '#FBBF24',
  success: '#34D399',
  info: '#60A5FA',
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
