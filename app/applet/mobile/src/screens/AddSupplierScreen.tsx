import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';

export const AddSupplierScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveSupplier = async () => {
    if (!name) {
      Alert.alert('Required', 'Supplier name is required');
      return;
    }

    if (!business?.id) return;

    try {
      setLoading(true);
      await ApiService.createSupplier({
        business_id: business.id,
        name,
        phone,
        email,
        address,
        notes,
      });

      setLoading(false);
      Alert.alert('Success', 'Supplier saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to save supplier');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Supplier</Text>

      <Card style={styles.card}>
        <Input
          label="Supplier / Company Name *"
          placeholder="e.g. Freetown Wholesalers"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Phone Number"
          placeholder="+232 78 900 111"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Input
          label="Email Address"
          placeholder="sales@wholesaler.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Address / Depot"
          placeholder="Cline Town Depot"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Supply Categories / Notes"
          placeholder="Supplies rice, sugar, vegetable oil"
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Save Supplier"
          onPress={handleSaveSupplier}
          loading={loading}
          style={styles.submitBtn}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  card: { padding: 16 },
  submitBtn: { marginTop: 16 },
});
