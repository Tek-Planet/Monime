import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export const LoginScreen = ({ navigation }: any) => {
  const { signIn } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#6E56CF' }]}>
      <View style={styles.headerBox}>
        <Text style={styles.logoText}>MiBuks Mobile</Text>
        <Text style={styles.subText}>{t('auth.welcome')}</Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{t('auth.login')}</Text>

        <Input
          label={t('auth.email')}
          placeholder="business@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label={t('auth.password')}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          title={t('auth.login')}
          onPress={handleLogin}
          loading={loading}
          style={styles.loginBtn}
        />

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.switchText, { color: colors.primary }]}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subText: {
    color: '#E0E7FF',
    fontSize: 16,
    marginTop: 6,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  loginBtn: {
    marginTop: 12,
  },
  switchBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
