import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { InventoryItem } from '../types';

export const InventoryScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.inventory')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search product or category..."
          value={searchQuery}
          onChangeText={setSearchQuery}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInventory} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isLowStock = item.stock_quantity <= (item.min_stock_level || 5);
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.categoryText, { color: colors.textSecondary }]}>{item.category || 'General Product'}</Text>
                </View>

                <Badge
                  label={`Stock: ${item.stock_quantity}`}
                  variant={isLowStock ? 'danger' : 'success'}
                />
              </View>

              <View style={[styles.cardBody, { borderTopColor: colors.cardBorder }]}>
                <Text style={[styles.price, { color: colors.prosperityGreen }]}>
                  {currency} {Number(item.unit_price).toLocaleString()}
                </Text>
                {item.sku && <Text style={[styles.skuText, { color: colors.textMuted }]}>SKU: {item.sku}</Text>}
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products in inventory.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  addBtn: { marginBottom: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontWeight: '700' },
  categoryText: { fontSize: 12, marginTop: 2 },
  cardBody: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 16, fontWeight: '800' },
  skuText: { fontSize: 12 },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
