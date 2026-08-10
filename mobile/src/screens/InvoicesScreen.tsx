import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { Invoice } from '../types';

export const InvoicesScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadInvoices} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.invNumber, { color: colors.primary }]}>INV-{item.invoice_number}</Text>
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>{item.customer?.name || 'Customer'}</Text>
              </View>
              <Badge label={item.status} variant={getStatusVariant(item.status)} />
            </View>

            <View style={[styles.cardBody, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.amount, { color: colors.textPrimary }]}>
                {currency} {Number(item.total_amount).toLocaleString()}
              </Text>
              <Text style={[styles.dateText, { color: colors.textMuted }]}>Issue Date: {item.invoice_date}</Text>
              {item.due_date && <Text style={[styles.dateText, { color: colors.textMuted }]}>Due Date: {item.due_date}</Text>}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No invoices issued yet.</Text>
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
  invNumber: { fontSize: 13, fontWeight: '800' },
  customerName: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  cardBody: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  amount: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  dateText: { fontSize: 12 },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
