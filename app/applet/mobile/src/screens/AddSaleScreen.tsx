import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Customer, InventoryItem } from '../types';

export const AddSaleScreen = ({ navigation }: any) => {
  const { user, business, selectedBranch } = useAuth();
  const { colors } = useTheme();

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
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Record New Sale</Text>

      {/* Customer Selection */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Customer</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.cardBorder },
            !selectedCustomer ? { backgroundColor: colors.primary } : null,
          ]}
          onPress={() => setSelectedCustomer(null)}
        >
          <Text style={[styles.chipText, { color: colors.textSecondary }, !selectedCustomer ? { color: '#FFFFFF' } : null]}>
            Walk-in Customer
          </Text>
        </TouchableOpacity>

        {customers.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[
              styles.chip,
              { backgroundColor: colors.cardBorder },
              selectedCustomer?.id === c.id ? { backgroundColor: colors.primary } : null,
            ]}
            onPress={() => setSelectedCustomer(c)}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }, selectedCustomer?.id === c.id ? { color: '#FFFFFF' } : null]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Catalog */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Select Products</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
        {inventory.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
            onPress={() => addToCart(item)}
          >
            <Text style={[styles.productName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.productPrice, { color: colors.prosperityGreen }]}>
              {currency} {Number(item.unit_price).toLocaleString()}
            </Text>
            <Text style={[styles.productStock, { color: colors.textMuted }]}>Stock: {item.stock_quantity}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cart Summary */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Order Items</Text>
      {cart.map((item) => (
        <Card key={item.product.id} style={styles.cartRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cartName, { color: colors.textPrimary }]}>{item.product.name}</Text>
            <Text style={[styles.cartPrice, { color: colors.textMuted }]}>
              {currency} {Number(item.product.unit_price).toLocaleString()} each
            </Text>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: colors.cardBorder }]}
              onPress={() => updateQuantity(item.product.id, -1)}
            >
              <Text style={[styles.qtyBtnText, { color: colors.textPrimary }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: colors.cardBorder }]}
              onPress={() => updateQuantity(item.product.id, 1)}
            >
              <Text style={[styles.qtyBtnText, { color: colors.textPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* Payment Method */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Payment Method</Text>
      <View style={styles.methodGrid}>
        {(['cash', 'mobile_money', 'bank_transfer', 'credit'] as const).map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.methodBtn,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              paymentMethod === method ? { backgroundColor: colors.primary, borderColor: colors.primary } : null,
            ]}
            onPress={() => setPaymentMethod(method)}
          >
            <Text
              style={[
                styles.methodText,
                { color: colors.textSecondary },
                paymentMethod === method ? { color: '#FFFFFF' } : null,
              ]}
            >
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
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total:</Text>
          <Text style={[styles.totalVal, { color: colors.prosperityGreen }]}>
            {currency} {totalAmount.toLocaleString()}
          </Text>
        </View>

        <Button
          title="Complete Sale"
          variant="success"
          onPress={handleSaveSale}
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
  sectionHeader: { fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  horizontalChips: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  productCard: { borderWidth: 1, padding: 12, borderRadius: 12, marginRight: 10, width: 130 },
  productName: { fontSize: 13, fontWeight: '700' },
  productPrice: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  productStock: { fontSize: 11, marginTop: 2 },
  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  cartName: { fontSize: 14, fontWeight: '700' },
  cartPrice: { fontSize: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '800' },
  qtyText: { fontSize: 14, fontWeight: '700', marginHorizontal: 12 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  methodBtn: { width: '48%', borderWidth: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  methodText: { fontSize: 12, fontWeight: '700' },
  totalCard: { marginTop: 16, padding: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalVal: { fontSize: 22, fontWeight: '800' },
  submitBtn: { marginTop: 4 },
});
