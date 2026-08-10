import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Supplier } from '../types';

export const SuppliersScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchSuppliers(business.id);
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [business?.id]);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.suppliers')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search supplier..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button
          title="+ Add Supplier"
          onPress={() => navigation.navigate('AddSupplier')}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={filteredSuppliers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSuppliers} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.phone && <Text style={[styles.subText, { color: colors.textSecondary }]}>📞 {item.phone}</Text>}
            {item.address && <Text style={[styles.subText, { color: colors.textSecondary }]}>📍 {item.address}</Text>}
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No suppliers registered yet.</Text>
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
  name: { fontSize: 16, fontWeight: '700' },
  subText: { fontSize: 13, marginTop: 4 },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
