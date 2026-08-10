import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PinLockContextType {
  isPinEnabled: boolean;
  isLocked: boolean;
  savedPin: string | null;
  enablePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
}

const PinLockContext = createContext<PinLockContextType>({
  isPinEnabled: false,
  isLocked: false,
  savedPin: null,
  enablePin: async () => {},
  disablePin: async () => {},
  unlockApp: () => false,
  lockApp: () => {},
});

export const PinLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('mibuks_pin_enabled').then((enabled) => {
      if (enabled === 'true') {
        setIsPinEnabled(true);
        AsyncStorage.getItem('mibuks_user_pin').then((pin) => {
          if (pin) {
            setSavedPin(pin);
            setIsLocked(true);
          }
        });
      }
    });
  }, []);

  const enablePin = async (pin: string) => {
    await AsyncStorage.setItem('mibuks_pin_enabled', 'true');
    await AsyncStorage.setItem('mibuks_user_pin', pin);
    setSavedPin(pin);
    setIsPinEnabled(true);
  };

  const disablePin = async () => {
    await AsyncStorage.removeItem('mibuks_pin_enabled');
    await AsyncStorage.removeItem('mibuks_user_pin');
    setSavedPin(null);
    setIsPinEnabled(false);
    setIsLocked(false);
  };

  const unlockApp = (pin: string): boolean => {
    if (pin === savedPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (isPinEnabled && savedPin) {
      setIsLocked(true);
    }
  };

  return (
    <PinLockContext.Provider
      value={{
        isPinEnabled,
        isLocked,
        savedPin,
        enablePin,
        disablePin,
        unlockApp,
        lockApp,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
};

export const usePinLock = () => useContext(PinLockContext);
