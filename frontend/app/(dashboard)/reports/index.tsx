// app/(dashboard)/reports/index.tsx — Reports Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';
import { reportService } from '@/services/reportService';
import { ReportSummary, TrendSummary } from '@/types/report.types';

const PRODUCT_COLORS = [
  '#1B5E20', // Deep Green
  '#FF8F00', // Deep Amber / Gold
  '#0288D1', // Slate Blue
  '#7B1FA2', // Rich Purple
  '#D84315', // Rust Orange
];

const TIMELINES = [
  { value: 'this_week', label: 'This Week', icon: 'calendar-today' },
  { value: 'last_week', label: 'Last Week', icon: 'calendar-arrow-left' },
  { value: 'this_month', label: 'This Month', icon: 'calendar-month' },
  { value: 'last_month', label: 'Last Month', icon: 'calendar-month-outline' },
  { value: 'this_year', label: 'This Year', icon: 'calendar-clock' },
  { value: 'last_year', label: 'Last Year', icon: 'calendar-refresh' },
];

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState<ReportSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendSummary | null>(null);
  const [activeTimeline, setActiveTimeline] = useState('this_week');
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const fetchData = async (timeline = activeTimeline) => {
    try {
      setLoading(true);
      const [sumRes, trendRes] = await Promise.all([
        reportService.getSummary(),
        reportService.getTrend(timeline),
      ]);
      setSummaryData(sumRes);
      setTrendData(trendRes);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTimeline]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(activeTimeline);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const shortenValue = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
  };

  // Chart scaling calculations
  const salesValues = trendData?.trend.map((t) => t.sales) || [];
  const maxSales = Math.max(...salesValues, 1000); // division by zero safety
  const gridLines = [1, 0.75, 0.5, 0.25];

  // Top products sum
  const totalRevenueSum =
    summaryData?.topProducts.reduce(
      (sum, p) => sum + parseFloat(p.totalRevenue.toString()),
      0
    ) || 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* 1. Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.sumCard}>
          <View style={styles.sumCardContent}>
            <View style={styles.sumHeader}>
              <Text variant="labelMedium" style={styles.sumLabel}>Total Products</Text>
              <View style={[styles.iconContainer, { backgroundColor: `${COLORS.primary}12` }]}>
                <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.primary} />
              </View>
            </View>
            <Text variant="titleLarge" style={styles.sumValue}>
              {summaryData?.totalProducts ?? '—'}
            </Text>
          </View>
        </View>

        <View style={styles.sumCard}>
          <View style={styles.sumCardContent}>
            <View style={styles.sumHeader}>
              <Text variant="labelMedium" style={styles.sumLabel}>Total Invoices</Text>
              <View style={[styles.iconContainer, { backgroundColor: `${COLORS.info}12` }]}>
                <MaterialCommunityIcons name="receipt" size={20} color={COLORS.info} />
              </View>
            </View>
            <Text variant="titleLarge" style={styles.sumValue}>
              {summaryData?.totalOrders ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Sales Trend Graph Card (Large & Enhanced) */}
      <Card style={styles.trendCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Sales Trend Analysis</Text>
            <Text variant="bodySmall" style={{ color: COLORS.textSecondary, marginTop: -4 }}>
              Interactive revenue breakdown for active period
            </Text>
          </View>
          <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color={COLORS.primary} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.innerLoadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              {/* Grid lines behind bars */}
              <View style={StyleSheet.absoluteFill}>
                {gridLines.map((ratio, idx) => (
                  <View key={idx} style={[styles.gridLine, { top: `${(1 - ratio) * 100}%` }]}>
                    <Text style={styles.gridLineText}>{shortenValue(maxSales * ratio)}</Text>
                  </View>
                ))}
              </View>

              {/* Columns and Labels */}
              <View style={styles.barsContainer}>
                {trendData?.trend.map((point, idx) => {
                  const barHeightPercent = (point.sales / maxSales) * 82; // cap height to leave space for values
                  const isActive = activeBar === idx;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => setActiveBar(idx)}
                      style={styles.barWrapper}
                    >
                      <View style={styles.barOuter}>
                        {point.sales > 0 && (
                          <Text style={[styles.barValText, isActive && styles.activeBarValText]}>
                            {shortenValue(point.sales)}
                          </Text>
                        )}
                        <View
                          style={[
                            styles.barInner,
                            {
                              height: `${Math.max(barHeightPercent, 4)}%`,
                              backgroundColor: isActive ? COLORS.secondary : COLORS.primary,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isActive && styles.activeBarLabel]}>
                        {point.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Selected bar information details display */}
        <View style={[styles.activeBarInfo, activeBar !== null && { borderColor: COLORS.secondary, borderWidth: 1, backgroundColor: COLORS.secondarySurface }]}>
          {activeBar !== null && trendData && trendData.trend[activeBar] ? (
            <View style={styles.selectedPointRow}>
              <MaterialCommunityIcons name="calendar-check" size={16} color={COLORS.secondary} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: COLORS.textPrimary }}>
                {trendData.trend[activeBar].label} Sales:
              </Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: COLORS.secondary }}>
                {formatCurrency(trendData.trend[activeBar].sales)}
              </Text>
            </View>
          ) : (
            <Text style={styles.chartInstructions}>
              Tap any column in the trend chart above to inspect values
            </Text>
          )}
        </View>

        <Divider style={{ marginVertical: 14, backgroundColor: COLORS.divider }} />

        {/* Dynamic Summary for the Timeline */}
        <View style={styles.timelineSummaryRow}>
          <View style={styles.timelineSummaryCol}>
            <Text style={styles.timelineSummaryLabel}>Total Period Revenue</Text>
            <Text style={styles.timelineSummaryVal}>
              {trendData ? formatCurrency(trendData.totalSales) : '₹0'}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.timelineSummaryCol}>
            <Text style={styles.timelineSummaryLabel}>Total Invoices Issued</Text>
            <Text style={styles.timelineSummaryVal}>
              {trendData ? trendData.totalOrders : '0'}
            </Text>
          </View>
        </View>

        <Divider style={{ marginVertical: 12, backgroundColor: COLORS.divider }} />

        {/* Redesigned Timeline switcher button row directly below */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineRow}
          style={{ marginTop: 4 }}
        >
          {TIMELINES.map((t) => {
            const isSelected = activeTimeline === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  setActiveTimeline(t.value);
                  setActiveBar(null);
                }}
                style={[styles.timelinePill, isSelected && styles.timelinePillActive]}
              >
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.timelinePillText, isSelected && styles.timelinePillTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Card>

      {/* 3. Top Products Card */}
      <Card style={styles.topProductsCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Top Products Analysis</Text>
            <Text variant="bodySmall" style={{ color: COLORS.textSecondary, marginTop: -4 }}>
              Distribution by total revenue contribution share
            </Text>
          </View>
          <MaterialCommunityIcons name="chart-pie" size={24} color={COLORS.secondary} />
        </View>

        {loading && !refreshing ? (
          <View style={styles.innerLoadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : !summaryData || summaryData.topProducts.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyText}>No product sales recorded yet</Text>
          </View>
        ) : (
          <View>
            {/* Horizontal linear distribution bar */}
            <View style={styles.stackedBarContainer}>
              {summaryData.topProducts.map((prod, idx) => {
                const pct = (parseFloat(prod.totalRevenue.toString()) / totalRevenueSum) * 100;
                if (pct <= 0) return null;
                return (
                  <View
                    key={prod.productId}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
                      height: '100%',
                    }}
                  />
                );
              })}
            </View>

            {/* Legend lists */}
            <View style={styles.legendContainer}>
              {summaryData.topProducts.map((prod, idx) => {
                const pct =
                  totalRevenueSum > 0
                    ? (parseFloat(prod.totalRevenue.toString()) / totalRevenueSum) * 100
                    : 0;
                const color = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
                return (
                  <View key={prod.productId} style={styles.legendItem}>
                    <View style={styles.legendItemLeft}>
                      <View style={[styles.colorIndicator, { backgroundColor: color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.legendName} numberOfLines={1}>
                          {prod.productName}
                        </Text>
                        <Text style={styles.legendQty}>
                          {prod.totalQuantitySold} {prod.unit}(s) sold
                        </Text>
                      </View>
                    </View>
                    <View style={styles.legendItemRight}>
                      <Text style={styles.legendRev}>
                        {formatCurrency(parseFloat(prod.totalRevenue.toString()))}
                      </Text>
                      <Text style={styles.legendPct}>{pct.toFixed(0)}% share</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  sumCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  sumCardContent: {
    padding: 12,
  },
  sumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sumLabel: { color: '#64748B', fontWeight: '600', fontSize: 12, flex: 1 },
  sumValue: { fontWeight: '800', color: '#0F172A', fontSize: 22 },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: 16 },
  trendCard: { borderRadius: 12, padding: 16, backgroundColor: '#FFFFFF', elevation: 2, marginBottom: 16 },

  chartWrapper: {
    backgroundColor: '#FAFAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 12,
    marginBottom: 14,
  },
  chartContainer: {
    height: 240, // Enlarged graph height from 180 to 240
    position: 'relative',
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    borderStyle: 'dashed',
    height: 1,
  },
  gridLineText: {
    position: 'absolute',
    top: -14,
    left: 0,
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingLeft: 36,
    height: '100%',
    zIndex: 2,
  },
  barWrapper: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barOuter: { height: '85%', width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barValText: { fontSize: 8, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4, textAlign: 'center' },
  activeBarValText: { color: COLORS.secondary },
  barInner: {
    width: 16, // Slightly wider bars for visual appeal
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  barLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 8, fontWeight: '700', textAlign: 'center' },
  activeBarLabel: { color: COLORS.secondary, fontWeight: 'bold' },

  activeBarInfo: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  selectedPointRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartInstructions: { fontSize: 11, color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  timelineSummaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 4 },
  timelineSummaryCol: { alignItems: 'center', flex: 1 },
  timelineSummaryLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  timelineSummaryVal: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
  verticalDivider: { width: 1, height: 32, backgroundColor: '#EAEAEA' },

  timelineRow: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  timelinePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 105,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 1,
  },
  timelinePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelinePillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  timelinePillTextActive: {
    color: '#FFFFFF',
  },

  topProductsCard: { borderRadius: 12, padding: 16, backgroundColor: '#FFFFFF', elevation: 2, marginBottom: 16 },
  stackedBarContainer: {
    flexDirection: 'row',
    height: 20, // Slightly taller stacked bar
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  legendContainer: { gap: 10, marginTop: 6 },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  legendItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  colorIndicator: { width: 14, height: 14, borderRadius: 7 },
  legendName: { fontWeight: '700', color: COLORS.textPrimary, fontSize: 13 },
  legendQty: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  legendItemRight: { alignItems: 'flex-end' },
  legendRev: { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: 13 },
  legendPct: { fontSize: 10, color: COLORS.textSecondary, marginTop: 1 },

  innerLoadingContainer: { height: 260, justifyContent: 'center', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary },
  emptyProducts: { padding: 32, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary },
});
