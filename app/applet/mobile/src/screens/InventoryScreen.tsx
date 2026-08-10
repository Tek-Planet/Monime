import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiService } from '../services/api';
import { InventoryItem } from '../types';

export const InventoryScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadInventory = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchInventory(business.id);
      setInventory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [business?.id]);

  const filteredItems = inventory.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Header title={t('nav.inventory')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search product or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Button
          title="+ Add Product"
          onPress={() => navigation.navigate('AddInventory')}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInventory} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isLowStock = item.stock_quantity <= (item.min_stock_level || 5);
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.categoryText}>{item.category || 'General Product'}</Text>
                </View>

                <Badge
                  label={isLowStock ? `Stock: ${item.stock_quantity}` : `Stock: ${item.stock_quantity}`}
                  variant={isLowStock ? 'danger' : 'success'}
                />
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.price}>{currency} {Number(item.unit_price).toLocaleString()}</Text>
                {item.sku && <Text style={styles.skuText}>SKU: {item.sku}</Text>}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No products in inventory.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  searchInput: { backgroundColor: '#FFFFFF' },
  addBtn: { marginBottom: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  categoryText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardBody: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  skuText: { fontSize: 12, color: '#94A3B8' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 14 },
});
