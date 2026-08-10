import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { Customer } from '../types';

export const CreateInvoiceScreen = ({ navigation }: any) => {
  const { user, business } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(String(Math.floor(1000 + Math.random() * 9000)));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productName: string; quantity: number; unitPrice: number }>>([
    { productName: 'Consulting / Products', quantity: 1, unitPrice: 0 },
  ]);
  const [loading, setLoading] = useState(false);

  const currency = business?.currency || 'SLL';

  useEffect(() => {
    if (business?.id) {
      ApiService.fetchCustomers(business.id).then(setCustomers);
    }
  }, [business?.id]);

  const addItemRow = () => {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      Alert.alert('Customer Required', 'Please select a customer for this invoice');
      return;
    }

    if (totalAmount <= 0) {
      Alert.alert('Invalid Total', 'Invoice total must be greater than zero');
      return;
    }

    if (!user?.id || !business?.id) return;

    try {
      setLoading(true);
      await ApiService.createInvoice({
        userId: user.id,
        businessId: business.id,
        customerId: selectedCustomer.id,
        invoiceNumber,
        totalAmount,
        dueDate,
        notes,
        items,
      });

      setLoading(false);
      Alert.alert('Success', 'Invoice generated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to create invoice');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Invoice</Text>

      <Input
        label="Invoice Number"
        value={invoiceNumber}
        onChangeText={setInvoiceNumber}
      />

      {/* Select Customer */}
      <Text style={styles.sectionHeader}>Select Customer *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        {customers.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCustomer?.id === c.id ? styles.chipActive : null]}
            onPress={() => setSelectedCustomer(c)}
          >
            <Text style={[styles.chipText, selectedCustomer?.id === c.id ? styles.chipTextActive : null]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items List */}
      <Text style={styles.sectionHeader}>Invoice Line Items</Text>
      {items.map((item, idx) => (
        <Card key={idx} style={styles.itemCard}>
          <Input
            label="Item Description"
            placeholder="Product or service name"
            value={item.productName}
            onChangeText={(val) => updateItem(idx, 'productName', val)}
          />

          <View style={styles.row}>
            <View style={{ flex: 0.48 }}>
              <Input
                label="Quantity"
                keyboardType="numeric"
                value={String(item.quantity)}
                onChangeText={(val) => updateItem(idx, 'quantity', Number(val) || 1)}
              />
            </View>

            <View style={{ flex: 0.48 }}>
              <Input
                label={`Unit Price (${currency})`}
                keyboardType="numeric"
                value={String(item.unitPrice)}
                onChangeText={(val) => updateItem(idx, 'unitPrice', Number(val) || 0)}
              />
            </View>
          </View>
        </Card>
      ))}

      <Button
        title="+ Add Another Line Item"
        variant="outline"
        onPress={addItemRow}
        style={{ marginBottom: 12 }}
      />

      <Input
        label="Due Date (e.g. YYYY-MM-DD)"
        placeholder="2026-09-01"
        value={dueDate}
        onChangeText={setDueDate}
      />

      <Input
        label="Terms / Notes"
        placeholder="Payment due within 14 days..."
        value={notes}
        onChangeText={setNotes}
      />

      {/* Total & Submit */}
      <Card style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Invoice Total:</Text>
          <Text style={styles.totalVal}>{currency} {totalAmount.toLocaleString()}</Text>
        </View>

        <Button
          title="Save & Issue Invoice"
          onPress={handleCreateInvoice}
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
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#475569', marginTop: 14, marginBottom: 8 },
  horizontalChips: { flexDirection: 'row', marginBottom: 10 },
  chip: { backgroundColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#2563EB' },
  chipText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  itemCard: { padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCard: { marginTop: 16, padding: 16, backgroundColor: '#FFFFFF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#334155' },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#2563EB' },
  submitBtn: { backgroundColor: '#2563EB' },
});
