import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getColors = () => {
    switch (variant) {
      case 'success': return { bg: '#DCFCE7', text: '#15803D' };
      case 'warning': return { bg: '#FEF9C3', text: '#A16207' };
      case 'danger': return { bg: '#FEE2E2', text: '#B91C1C' };
      case 'info': return { bg: '#E0F2FE', text: '#0369A1' };
      default: return { bg: '#F1F5F9', text: '#475569' };
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
