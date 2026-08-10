import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiService } from '../services/api';
import { Customer } from '../types';

export const CustomersScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadCustomers = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchCustomers(business.id);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [business?.id]);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <View style={styles.container}>
      <Header title={t('nav.customers')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search customer name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        <Button
          title="+ Add Customer"
          onPress={() => navigation.navigate('AddCustomer')}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCustomers} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                {item.phone && <Text style={styles.phone}>📞 {item.phone}</Text>}
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.balanceText}>
                Credit Balance: <Text style={styles.balanceVal}>{currency} {Number(item.current_balance || 0).toLocaleString()}</Text>
              </Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No customers registered yet.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  phone: { fontSize: 13, color: '#64748B', marginTop: 2 },
  cardBody: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  balanceText: { fontSize: 13, color: '#475569' },
  balanceVal: { fontWeight: '700', color: '#DC2626' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 14 },
});
