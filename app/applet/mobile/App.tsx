import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { PinLockProvider } from './src/contexts/PinLockContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <PinLockProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </PinLockProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
