import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';

const CATEGORIES = ['Rent & Shop Utilities', 'Salaries & Staff Wages', 'Inventory Procurement', 'Transport & Logistics', 'Generator & Fuel', 'Taxes & Licenses', 'Miscellaneous'];

export const AddExpenseScreen = ({ navigation }: any) => {
  const { business, selectedBranch } = useAuth();
  const { colors } = useTheme();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const currency = business?.currency || 'SLL';

  const handleSaveExpense = async () => {
    const amountNum = Number(amount) || 0;
    if (amountNum <= 0) {
      Alert.alert('Required', 'Expense amount must be greater than zero');
      return;
    }

    if (!business?.id) return;

    try {
      setLoading(true);
      await ApiService.createExpense({
        business_id: business.id,
        branch_id: selectedBranch?.id || undefined,
        category,
        amount: amountNum,
        description,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
      });

      setLoading(false);
      Alert.alert('Success', 'Expense recorded!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to record expense');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Record Business Expense</Text>

      {/* Categories Horizontal Selector */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Expense Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              { backgroundColor: colors.cardBorder },
              category === cat ? { backgroundColor: colors.danger } : null,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }, category === cat ? { color: '#FFFFFF' } : null]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Card style={styles.card}>
        <Input
          label={`Amount (${currency}) *`}
          keyboardType="numeric"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
        />

        <Input
          label="Description / Purpose"
          placeholder="e.g. Purchased generator fuel for evening shift"
          value={description}
          onChangeText={setDescription}
        />

        <Button
          title="Save Expense"
          variant="destructive"
          onPress={handleSaveExpense}
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
  sectionHeader: { fontSize: 14, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  horizontalChips: { flexDirection: 'row', marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  card: { padding: 16 },
  submitBtn: { marginTop: 16 },
});
