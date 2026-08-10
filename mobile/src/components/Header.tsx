import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePinLock } from '../contexts/PinLockContext';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { business, selectedBranch } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isPinEnabled, lockApp } = usePinLock();
  const { colors, isDark } = useTheme();

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('krio');
    else if (language === 'krio') setLanguage('fr');
    else setLanguage('en');
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <View>
        <Text style={[styles.businessName, { color: isDark ? '#94A3B8' : '#E0E7FF' }]}>
          {business?.business_name || 'MiBuks Mobile'}
        </Text>
        {selectedBranch && (
          <Text style={[styles.branchName, { color: isDark ? '#38BDF8' : '#FDE047' }]}>
            📍 {selectedBranch.name}
          </Text>
        )}
        <Text style={[styles.title, { color: colors.headerText }]}>{title}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>

        {isPinEnabled && (
          <TouchableOpacity style={styles.iconBtn} onPress={lockApp}>
            <Text style={{ fontSize: 16 }}>🔒</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  branchName: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 8,
  },
  langText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
});
