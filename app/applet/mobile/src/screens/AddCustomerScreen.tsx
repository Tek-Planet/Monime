import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';

export const AddCustomerScreen = ({ navigation }: any) => {
  const { business } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('1000000');
  const [loading, setLoading] = useState(false);

  const currency = business?.currency || 'SLL';

  const handleSaveCustomer = async () => {
    if (!name) {
      Alert.alert('Required', 'Customer name is required');
      return;
    }

    if (!business?.id) return;

    try {
      setLoading(true);
      await ApiService.createCustomer({
        business_id: business.id,
        name,
        phone,
        email,
        address,
        credit_limit: Number(creditLimit) || 0,
        current_balance: 0,
      });

      setLoading(false);
      Alert.alert('Success', 'Customer added successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to create customer');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Customer</Text>

      <Card style={styles.card}>
        <Input
          label="Full Name *"
          placeholder="e.g. Mariama Sesay"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Phone Number"
          placeholder="+232 76 123 456"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Input
          label="Email Address"
          placeholder="mariama@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Address / Location"
          placeholder="Kissy Road, Freetown"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label={`Credit Limit (${currency})`}
          keyboardType="numeric"
          value={creditLimit}
          onChangeText={setCreditLimit}
        />

        <Button
          title="Save Customer"
          onPress={handleSaveCustomer}
          loading={loading}
          style={styles.submitBtn}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F8FAFC' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  card: { padding: 16 },
  submitBtn: { marginTop: 16, backgroundColor: '#2563EB' },
});
