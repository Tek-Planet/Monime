import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { usePinLock } from '../contexts/PinLockContext';

export const PinLockScreen = () => {
  const { unlockApp } = usePinLock();
  const [pin, setPin] = useState('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => {
          const success = unlockApp(newPin);
          if (!success) {
            Alert.alert('Incorrect PIN', 'Please try again');
            setPin('');
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔒 MiBuks Security</Text>
      <Text style={styles.title}>Enter Security PIN</Text>

      <View style={styles.pinDots}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              pin.length > index ? styles.dotFilled : null,
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', '⌫'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keyRow}>
            {row.map((key, kIdx) => (
              <TouchableOpacity
                key={kIdx}
                style={[styles.key, !key ? styles.keyEmpty : null]}
                disabled={!key}
                onPress={() => (key === '⌫' ? handleDelete() : handleKeyPress(key))}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    color: '#38BDF8',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
  },
  pinDots: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginHorizontal: 10,
  },
  dotFilled: {
    backgroundColor: '#38BDF8',
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyEmpty: {
    backgroundColor: 'transparent',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
});
