import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';

export const AddInventoryScreen = ({ navigation }: any) => {
  const { business, selectedBranch } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [unitPrice, setUnitPrice] = useState('0');
  const [costPrice, setCostPrice] = useState('0');
  const [minStockLevel, setMinStockLevel] = useState('5');
  const [loading, setLoading] = useState(false);

  const currency = business?.currency || 'SLL';

  const handleSaveProduct = async () => {
    if (!name) {
      Alert.alert('Required', 'Product name is required');
      return;
    }

    if (!business?.id) return;

    try {
      setLoading(true);
      await ApiService.createInventoryItem({
        business_id: business.id,
        branch_id: selectedBranch?.id || undefined,
        name,
        category: category || 'General',
        sku,
        stock_quantity: Number(stockQuantity) || 0,
        unit_price: Number(unitPrice) || 0,
        cost_price: Number(costPrice) || 0,
        min_stock_level: Number(minStockLevel) || 5,
        is_active: true,
      });

      setLoading(false);
      Alert.alert('Success', 'Product added to inventory!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to create product');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Product</Text>

      <Card style={styles.card}>
        <Input
          label="Product Name *"
          placeholder="e.g. Palm Oil 5L"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Category"
          placeholder="e.g. Foodstuff, Beverages, Hardware"
          value={category}
          onChangeText={setCategory}
        />

        <Input
          label="SKU / Barcode"
          placeholder="e.g. PO-5001"
          value={sku}
          onChangeText={setSku}
        />

        <View style={styles.row}>
          <View style={{ flex: 0.48 }}>
            <Input
              label="Stock Quantity *"
              keyboardType="numeric"
              value={stockQuantity}
              onChangeText={setStockQuantity}
            />
          </View>

          <View style={{ flex: 0.48 }}>
            <Input
              label="Min Stock Alert"
              keyboardType="numeric"
              value={minStockLevel}
              onChangeText={setMinStockLevel}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 0.48 }}>
            <Input
              label={`Selling Price (${currency}) *`}
              keyboardType="numeric"
              value={unitPrice}
              onChangeText={setUnitPrice}
            />
          </View>

          <View style={{ flex: 0.48 }}>
            <Input
              label={`Cost Price (${currency})`}
              keyboardType="numeric"
              value={costPrice}
              onChangeText={setCostPrice}
            />
          </View>
        </View>

        <Button
          title="Save Product"
          variant="success"
          onPress={handleSaveProduct}
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
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  submitBtn: { marginTop: 16 },
});
