import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiService } from '../services/api';
import { Invoice } from '../types';

export const InvoicesScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadInvoices = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchInvoices(business.id);
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [business?.id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      default: return 'info';
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('nav.invoices')} />

      <View style={styles.topBar}>
        <Button
          title="+ Create New Invoice"
          onPress={() => navigation.navigate('CreateInvoice')}
          style={styles.addBtn}
        />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoices} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.invNumber}>INV-{item.invoice_number}</Text>
                <Text style={styles.customerName}>{item.customer?.name || 'Customer'}</Text>
              </View>
              <Badge label={item.status} variant={getStatusVariant(item.status)} />
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.amount}>{currency} {Number(item.total_amount).toLocaleString()}</Text>
              <Text style={styles.dateText}>Issue Date: {item.invoice_date}</Text>
              {item.due_date && <Text style={styles.dateText}>Due Date: {item.due_date}</Text>}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No invoices issued yet.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  addBtn: { marginBottom: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invNumber: { fontSize: 13, fontWeight: '800', color: '#2563EB' },
  customerName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  cardBody: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  amount: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  dateText: { fontSize: 12, color: '#64748B' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 14 },
});
