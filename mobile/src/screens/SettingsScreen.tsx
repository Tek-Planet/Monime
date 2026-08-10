import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { usePinLock } from '../contexts/PinLockContext';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { supabase } from '../config/supabase';

export const SettingsScreen = () => {
  const { user, business, branches, selectedBranch, setSelectedBranch, signOut, refreshBusiness } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isPinEnabled, enablePin, disablePin } = usePinLock();
  const { colors, themeMode, setThemeMode } = useTheme();

  const [businessName, setBusinessName] = useState(business?.business_name || '');
  const [phone, setPhone] = useState(business?.phone || '');
  const [currency, setCurrency] = useState(business?.currency || 'SLL');
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveBusiness = async () => {
    if (!business?.id) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: businessName,
          phone,
          currency,
        })
        .eq('id', business.id);

      setSaving(false);
      if (error) throw error;

      await refreshBusiness();
      Alert.alert('Success', 'Business settings updated');
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to update settings');
    }
  };

  const handleTogglePin = async (value: boolean) => {
    if (value) {
      if (newPin.length !== 4) {
        Alert.alert('PIN Required', 'Please enter a 4-digit numeric PIN below before enabling security lock');
        return;
      }
      await enablePin(newPin);
      Alert.alert('PIN Enabled', 'App security PIN lock is now active');
    } else {
      await disablePin();
      setNewPin('');
      Alert.alert('PIN Disabled', 'App security PIN lock turned off');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.settings')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Info */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account Profile</Text>
          <Text style={[styles.userEmail, { color: colors.primary }]}>{user?.email}</Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>Owner / User Account</Text>
        </Card>

        {/* Theme Preferences */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>App Theme Mode</Text>
          <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 10 }]}>
            Select your preferred visual theme
          </Text>
          <View style={styles.rowSelector}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.cardBorder },
                  themeMode === mode ? { backgroundColor: colors.primary } : null,
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    themeMode === mode ? { color: '#FFFFFF' } : null,
                  ]}
                >
                  {mode === 'light' ? '☀️ Light' : mode === 'dark' ? '🌙 Dark' : '💻 System'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Business Settings */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Business Profile</Text>

          <Input
            label="Business Name"
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Input
            label="Business Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Default Currency Code (e.g. SLL, SLE, USD)"
            value={currency}
            onChangeText={setCurrency}
          />

          <Button
            title="Save Profile"
            onPress={handleSaveBusiness}
            loading={saving}
            style={styles.saveBtn}
          />
        </Card>

        {/* Branch Selection */}
        {branches.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Active Branch</Text>
            {branches.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.branchItem,
                  { backgroundColor: colors.cardBorder },
                  selectedBranch?.id === b.id ? { backgroundColor: colors.primary } : null,
                ]}
                onPress={() => setSelectedBranch(b)}
              >
                <Text
                  style={[
                    styles.branchName,
                    { color: colors.textPrimary },
                    selectedBranch?.id === b.id ? { color: '#FFFFFF' } : null,
                  ]}
                >
                  {b.name} {b.is_main ? '(Main Branch)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Language Selection */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>App Language</Text>
          <View style={styles.rowSelector}>
            {(['en', 'krio', 'fr'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.cardBorder },
                  language === lang ? { backgroundColor: colors.primary } : null,
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    language === lang ? { color: '#FFFFFF' } : null,
                  ]}
                >
                  {lang === 'en' ? 'English' : lang === 'krio' ? 'Krio' : 'Français'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Security PIN Lock */}
        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('settings.pinLock')}</Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>Require a 4-digit PIN to open app</Text>
            </View>
            <Switch
              value={isPinEnabled}
              onValueChange={handleTogglePin}
              trackColor={{ false: colors.cardBorder, true: colors.primary }}
            />
          </View>

          {!isPinEnabled && (
            <Input
              label="Set 4-Digit Security PIN"
              placeholder="1234"
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
            />
          )}
        </Card>

        {/* Sign Out */}
        <Button
          title={t('auth.logout')}
          variant="destructive"
          onPress={signOut}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  userEmail: { fontSize: 15, fontWeight: '700' },
  userRole: { fontSize: 12, marginTop: 2 },
  subText: { fontSize: 12 },
  saveBtn: { marginTop: 12 },
  branchItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 6 },
  branchName: { fontSize: 14, fontWeight: '600' },
  rowSelector: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  optionBtn: { flex: 0.31, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  optionText: { fontSize: 13, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { marginTop: 10, marginBottom: 30 },
});
