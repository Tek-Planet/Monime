import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { CreditScoreResult } from '../types';

export const CreditScreen = ({ navigation }: any) => {
  const { business } = useAuth();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const [credit, setCredit] = useState<CreditScoreResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currency = business?.currency || 'SLL';

  const loadCreditScore = async () => {
    if (!business?.id) return;
    try {
      setRefreshing(true);
      const res = await ApiService.calculateCreditScore(business.id);
      setCredit(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCreditScore();
  }, [business?.id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('credit.score')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCreditScore} tintColor={colors.primary} />}
      >
        {/* Main Score Hero Card */}
        {credit && (
          <Card style={[styles.heroCard, { backgroundColor: isDark ? '#1E293B' : '#0F172A' }]}>
            <Text style={styles.heroSub}>Business Credit Rating</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreVal}>{credit.score}</Text>
              <Text style={styles.maxScore}>/ 850</Text>
            </View>

            <View style={{ marginVertical: 8 }}>
              <Badge label={credit.rating} variant={credit.score >= 680 ? 'success' : 'warning'} />
            </View>

            <View style={styles.loanBox}>
              <Text style={styles.loanLabel}>{t('credit.maxLoan')}</Text>
              <Text style={styles.loanVal}>{currency} {credit.maxLoanAmount.toLocaleString()}</Text>
              <Text style={styles.rateText}>Interest Rate: {credit.recommendedInterestRate}% p.a.</Text>
            </View>

            <Button
              title="Apply for Micro Loan"
              onPress={() => navigation.navigate('ApplyLoan', { credit })}
              style={styles.applyBtn}
            />
          </Card>
        )}

        {/* 6 Credit Indices Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Credit Assessment Indices</Text>

        {credit && (
          <>
            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>1. Repayment History</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.repaymentHistory.score} / {credit.indices.repaymentHistory.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.repaymentHistory.detail}</Text>
            </Card>

            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>2. Transaction Volume</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.transactionVolume.score} / {credit.indices.transactionVolume.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.transactionVolume.detail}</Text>
            </Card>

            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>3. Business Longevity</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.businessAge.score} / {credit.indices.businessAge.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.businessAge.detail}</Text>
            </Card>

            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>4. Inventory Valuation</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.inventoryValuation.score} / {credit.indices.inventoryValuation.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.inventoryValuation.detail}</Text>
            </Card>

            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>5. Expense Ratio</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.expenseRatio.score} / {credit.indices.expenseRatio.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.expenseRatio.detail}</Text>
            </Card>

            <Card style={styles.indexCard}>
              <View style={styles.indexHeader}>
                <Text style={[styles.indexTitle, { color: colors.textPrimary }]}>6. Customer Retention</Text>
                <Text style={[styles.indexScore, { color: colors.primary }]}>
                  {credit.indices.customerRetention.score} / {credit.indices.customerRetention.maxScore}
                </Text>
              </View>
              <Text style={[styles.indexDetail, { color: colors.textSecondary }]}>{credit.indices.customerRetention.detail}</Text>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  heroCard: { padding: 20, alignItems: 'center' },
  heroSub: { color: '#94A3B8', fontSize: 13, textTransform: 'uppercase', fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 6 },
  scoreVal: { color: '#38BDF8', fontSize: 42, fontWeight: '900' },
  maxScore: { color: '#64748B', fontSize: 18, marginLeft: 6, fontWeight: '700' },
  loanBox: { backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginVertical: 12 },
  loanLabel: { color: '#CBD5E1', fontSize: 12 },
  loanVal: { color: '#4ADE80', fontSize: 20, fontWeight: '800', marginTop: 2 },
  rateText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  applyBtn: { width: '100%', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  indexCard: { padding: 14, marginBottom: 8 },
  indexHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indexTitle: { fontSize: 14, fontWeight: '700' },
  indexScore: { fontSize: 14, fontWeight: '800' },
  indexDetail: { fontSize: 12, marginTop: 4 },
});
