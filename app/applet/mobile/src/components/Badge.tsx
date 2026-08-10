import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const { isDark } = useTheme();

  const getColors = () => {
    if (isDark) {
      switch (variant) {
        case 'success': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399' };
        case 'warning': return { bg: 'rgba(245, 158, 11, 0.2)', text: '#FBBF24' };
        case 'danger': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#F87171' };
        case 'info': return { bg: 'rgba(59, 130, 246, 0.2)', text: '#60A5FA' };
        default: return { bg: '#334155', text: '#E2E8F0' };
      }
    } else {
      switch (variant) {
        case 'success': return { bg: '#DCFCE7', text: '#15803D' };
        case 'warning': return { bg: '#FEF9C3', text: '#A16207' };
        case 'danger': return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'info': return { bg: '#E0F2FE', text: '#0369A1' };
        default: return { bg: '#F1F5F9', text: '#475569' };
      }
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
