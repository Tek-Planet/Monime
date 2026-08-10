import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const ApplyLoanScreen = ({ route, navigation }: any) => {
  const { business } = useAuth();
  const { colors, isDark } = useTheme();
  const credit = route.params?.credit;

  const currency = business?.currency || 'SLL';
  const maxAllowed = credit?.maxLoanAmount || 50000000;

  const [requestedAmount, setRequestedAmount] = useState(String(Math.round(maxAllowed * 0.5)));
  const [loanPurpose, setLoanPurpose] = useState('Stock Expansion & Inventory Restock');
  const [repaymentTermMonths, setRepaymentTermMonths] = useState('6');
  const [loading, setLoading] = useState(false);

  const handleApply = () => {
    const amountNum = Number(requestedAmount) || 0;
    if (amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid loan amount');
      return;
    }

    if (amountNum > maxAllowed) {
      Alert.alert('Limit Exceeded', `Your current credit rating allows up to ${currency} ${maxAllowed.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Loan Request Submitted', 'Your micro-loan application has been received. Our credit assessment team will review your account history.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }, 1200);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Apply for Micro-Loan</Text>

      <Card style={[styles.infoCard, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
        <Text style={styles.infoTitle}>Max Loan Limit Based on Credit Rating</Text>
        <Text style={styles.infoVal}>{currency} {maxAllowed.toLocaleString()}</Text>
        <Text style={styles.infoSub}>Pre-approved Rate: {credit?.recommendedInterestRate || 8.5}% p.a.</Text>
      </Card>

      <Card style={styles.card}>
        <Input
          label={`Requested Amount (${currency}) *`}
          keyboardType="numeric"
          value={requestedAmount}
          onChangeText={setRequestedAmount}
        />

        <Input
          label="Loan Purpose *"
          placeholder="e.g. Bulk Stock Purchase, Equipment Upgrade"
          value={loanPurpose}
          onChangeText={setLoanPurpose}
        />

        <Input
          label="Repayment Period (Months) *"
          keyboardType="numeric"
          value={repaymentTermMonths}
          onChangeText={setRepaymentTermMonths}
        />

        <Button
          title="Submit Application"
          variant="success"
          onPress={handleApply}
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
  infoCard: { padding: 16, marginBottom: 12 },
  infoTitle: { color: '#94A3B8', fontSize: 12, textTransform: 'uppercase' },
  infoVal: { color: '#38BDF8', fontSize: 22, fontWeight: '800', marginTop: 4 },
  infoSub: { color: '#4ADE80', fontSize: 12, marginTop: 4 },
  card: { padding: 16 },
  submitBtn: { marginTop: 16 },
});
