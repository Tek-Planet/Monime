import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/api';
import { Customer, InventoryItem } from '../types';

export const AddSaleScreen = ({ navigation }: any) => {
  const { user, business, selectedBranch } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'bank_transfer' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Array<{ product: InventoryItem; quantity: number }>>([]);
  const [loading, setLoading] = useState(false);

  const currency = business?.currency || 'SLL';

  useEffect(() => {
    if (business?.id) {
      ApiService.fetchCustomers(business.id).then(setCustomers);
      ApiService.fetchInventory(business.id).then(setInventory);
    }
  }, [business?.id]);

  const addToCart = (product: InventoryItem) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        Alert.alert('Stock Limit', `Only ${product.stock_quantity} available in stock`);
        return;
      }
      setCart(cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as Array<{ product: InventoryItem; quantity: number }>
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.unit_price * item.quantity), 0);

  const handleSaveSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please select at least one product');
      return;
    }

    if (!user?.id || !business?.id) {
      Alert.alert('Error', 'Session invalid');
      return;
    }

    try {
      setLoading(true);
      await ApiService.createSale({
        userId: user.id,
        businessId: business.id,
        branchId: selectedBranch?.id,
        customerId: selectedCustomer?.id,
        totalAmount,
        paymentMethod,
        notes,
        items: cart.map((c) => ({
          productId: c.product.id,
          productName: c.product.name,
          quantity: c.quantity,
          unitPrice: c.product.unit_price,
        })),
      });

      setLoading(false);
      Alert.alert('Success', 'Sale recorded successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to record sale');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Record New Sale</Text>

      {/* Customer Selection */}
      <Text style={styles.sectionHeader}>Customer</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        <TouchableOpacity
          style={[styles.chip, !selectedCustomer ? styles.chipActive : null]}
          onPress={() => setSelectedCustomer(null)}
        >
          <Text style={[styles.chipText, !selectedCustomer ? styles.chipTextActive : null]}>Walk-in Customer</Text>
        </TouchableOpacity>

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

      {/* Product Catalog */}
      <Text style={styles.sectionHeader}>Select Products</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        {inventory.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.productCard}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>{currency} {Number(item.unit_price).toLocaleString()}</Text>
            <Text style={styles.productStock}>Stock: {item.stock_quantity}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cart Summary */}
      <Text style={styles.sectionHeader}>Order Items</Text>
      {cart.map((item) => (
        <Card key={item.product.id} style={styles.cartRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cartName}>{item.product.name}</Text>
            <Text style={styles.cartPrice}>{currency} {Number(item.product.unit_price).toLocaleString()} each</Text>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, -1)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* Payment Method */}
      <Text style={styles.sectionHeader}>Payment Method</Text>
      <View style={styles.methodGrid}>
        {(['cash', 'mobile_money', 'bank_transfer', 'credit'] as const).map((method) => (
          <TouchableOpacity
            key={method}
            style={[styles.methodBtn, paymentMethod === method ? styles.methodBtnActive : null]}
            onPress={() => setPaymentMethod(method)}
          >
            <Text style={[styles.methodText, paymentMethod === method ? styles.methodTextActive : null]}>
              {method.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Notes / Remarks (Optional)"
        placeholder="Customer receipt notes..."
        value={notes}
        onChangeText={setNotes}
      />

      {/* Total & Submit */}
      <Card style={styles.totalCard}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalVal}>{currency} {totalAmount.toLocaleString()}</Text>
        </View>

        <Button
          title="Complete Sale"
          onPress={handleSaveSale}
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
  productCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', padding: 12, borderRadius: 12, marginRight: 10, width: 130 },
  productName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  productPrice: { fontSize: 13, fontWeight: '800', color: '#16A34A', marginTop: 4 },
  productStock: { fontSize: 11, color: '#64748B', marginTop: 2 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  cartName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  cartPrice: { fontSize: 12, color: '#64748B' },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 6, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  qtyText: { fontSize: 14, fontWeight: '700', marginHorizontal: 12 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  methodBtn: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  methodBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  methodText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  methodTextActive: { color: '#FFFFFF' },
  totalCard: { marginTop: 16, padding: 16, backgroundColor: '#FFFFFF' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#334155' },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#16A34A' },
  submitBtn: { backgroundColor: '#16A34A' },
});
