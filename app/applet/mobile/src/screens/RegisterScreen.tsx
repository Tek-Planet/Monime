import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export const RegisterScreen = ({ navigation }: any) => {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !businessName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, businessName);
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error.message);
    } else {
      Alert.alert('Account Created', 'Your account has been created successfully!');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#6E56CF' }]}>
      <View style={styles.headerBox}>
        <Text style={styles.logoText}>MiBuks Mobile</Text>
        <Text style={styles.subText}>Start managing your business today</Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>{t('auth.register')}</Text>

        <Input
          label="Full Name"
          placeholder="John Koroma"
          value={fullName}
          onChangeText={setFullName}
        />

        <Input
          label="Business Name *"
          placeholder="Salone General Traders"
          value={businessName}
          onChangeText={setBusinessName}
        />

        <Input
          label={t('auth.email') + ' *'}
          placeholder="business@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label={t('auth.password') + ' *'}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button
          title={t('auth.register')}
          onPress={handleRegister}
          loading={loading}
          style={styles.registerBtn}
        />

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.switchText, { color: colors.primary }]}>Already have an account? Sign In</Text>
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
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  subText: {
    color: '#E0E7FF',
    fontSize: 14,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  registerBtn: {
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
