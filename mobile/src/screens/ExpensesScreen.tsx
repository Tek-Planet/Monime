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
import { Expense } from '../types';

export const ExpensesScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('nav.expenses')} />

      <View style={styles.topBar}>
        <Card style={[styles.summaryCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA' }]}>
          <Text style={[styles.summaryLabel, { color: isDark ? '#F87171' : '#991B1B' }]}>Total Expenses</Text>
          <Text style={[styles.summaryVal, { color: colors.danger }]}>{currency} {totalExpenseSum.toLocaleString()}</Text>
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              placeholder="Search expense category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Button
            title="+ Expense"
            variant="destructive"
            onPress={() => navigation.navigate('AddExpense')}
            style={styles.addBtn}
          />
        </View>
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadExpenses} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.category, { color: colors.textPrimary }]}>{item.category}</Text>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>📅 {item.expense_date}</Text>
              </View>
              <Text style={[styles.amount, { color: colors.danger }]}>{currency} {Number(item.amount).toLocaleString()}</Text>
            </View>

            {item.description && <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text>}
          </Card>
        )}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses logged yet.</Text>
          </Card>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  summaryCard: { padding: 14 },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  summaryVal: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  addBtn: { height: 46 },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 15, fontWeight: '700' },
  dateText: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});
