import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiService } from '../services/api';
import { Expense } from '../types';

export const ExpensesScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadExpenses = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const data = await ApiService.fetchExpenses(business.id);
      setExpenses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [business?.id]);

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const filteredExpenses = expenses.filter((e) =>
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      <Header title={t('nav.expenses')} />

      <View style={styles.topBar}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryVal}>{currency} {totalExpenseSum.toLocaleString()}</Text>
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              placeholder="Search expense category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
          <Button
            title="+ Expense"
            onPress={() => navigation.navigate('AddExpense')}
            style={styles.addBtn}
          />
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadExpenses} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.dateText}>📅 {item.expense_date}</Text>
              </View>
              <Text style={styles.amount}>{currency} {Number(item.amount).toLocaleString()}</Text>
            </View>

            {item.description && <Text style={styles.desc}>{item.description}</Text>}
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No expenses logged yet.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  summaryCard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', padding: 14 },
  summaryLabel: { fontSize: 12, color: '#991B1B', fontWeight: '700', textTransform: 'uppercase' },
  summaryVal: { fontSize: 22, fontWeight: '900', color: '#DC2626', marginTop: 2 },
  searchInput: { backgroundColor: '#FFFFFF' },
  addBtn: { backgroundColor: '#DC2626' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  dateText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  desc: { fontSize: 12, color: '#64748B', marginTop: 6, fontStyle: 'italic' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#64748B', fontSize: 14 },
});
