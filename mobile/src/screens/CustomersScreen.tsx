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
import { Customer } from '../types';

export const CustomersScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.customers')} />

      <View style={styles.topBar}>
        <Input
          placeholder="Search customer name or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCustomers} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{item.name}</Text>
                {item.phone && <Text style={[styles.phone, { color: colors.textSecondary }]}>📞 {item.phone}</Text>}
              </View>
            </View>

            <View style={[styles.cardBody, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                Credit Balance:{' '}
                <Text style={[styles.balanceVal, { color: colors.danger }]}>
                  {currency} {Number(item.current_balance || 0).toLocaleString()}
                </Text>
              </Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No customers registered yet.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  phone: { fontSize: 13, marginTop: 2 },
  cardBody: { marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  balanceText: { fontSize: 13 },
  balanceVal: { fontWeight: '700' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
