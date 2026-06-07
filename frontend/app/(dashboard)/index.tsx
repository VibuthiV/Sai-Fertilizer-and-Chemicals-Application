// app/(dashboard)/index.tsx — Dashboard Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { Text, Card, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { RootState } from '@/store';
import { COLORS } from '@/constants/colors';
import { productService } from '@/services/productService';
import { reportService } from '@/services/reportService';
import { billService } from '@/services/billService';
import { Bill } from '@/types/bill.types';
import { Product } from '@/types/product.types';
import { TopProduct, DailySalesSummary } from '@/types/report.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
};

function StatCard({ title, value, icon, color, trend, trendType = 'neutral' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <Text variant="labelMedium" style={styles.statTitle}>{title}</Text>
          <View style={[styles.iconContainer, { backgroundColor: `${color}12` }]}>
            <MaterialCommunityIcons name={icon} size={22} color={color} />
          </View>
        </View>
        <Text variant="titleLarge" style={styles.statValue}>{value}</Text>
        {trend ? (
          <View style={styles.trendRow}>
            <MaterialCommunityIcons
              name={trendType === 'positive' ? 'trending-up' : trendType === 'negative' ? 'trending-down' : 'minus'}
              size={14}
              color={trendType === 'positive' ? COLORS.success : trendType === 'negative' ? COLORS.error : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.trendText,
                { color: trendType === 'positive' ? COLORS.success : trendType === 'negative' ? COLORS.error : COLORS.textSecondary }
              ]}
            >
              {trend}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBills: 0,
    weeklySales: 0,
    lowStock: 0,
  });
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySalesTrend, setDailySalesTrend] = useState<DailySalesSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats and recent bills in parallel
      const [productsRes, lowStockRes, summaryRes, weeklyRes, billsRes] = await Promise.all([
        productService.getAll({ page: 1, limit: 1 }),
        productService.getAll({ lowStock: true, page: 1, limit: 3 }),
        reportService.getSummary(),
        reportService.getWeekly(),
        billService.getAll({ page: 1, limit: 5 }),
      ]);

      setStats({
        totalProducts: productsRes.total,
        totalBills: summaryRes.totalOrders,
        weeklySales: weeklyRes.totalSales,
        lowStock: lowStockRes.total,
      });

      setRecentBills(billsRes.data || []);
      setLowStockProducts(lowStockRes.data || []);
      setTopProducts(summaryRes.topProducts || []);
      setDailySalesTrend(weeklyRes.dailyBreakdown || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const renderWeeklyChart = () => {
    if (dailySalesTrend.length === 0) {
      return (
        <Card style={styles.cardContainer}>
          <Card.Content style={styles.chartEmpty}>
            <MaterialCommunityIcons name="chart-bar" size={32} color={COLORS.textDisabled} />
            <Text variant="bodyMedium" style={{ color: COLORS.textSecondary, marginTop: 8 }}>
              No weekly sales data found
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const maxSales = Math.max(...dailySalesTrend.map(d => d.totalSales), 1000);

    return (
      <Card style={styles.cardContainer}>
        <Card.Content style={{ paddingBottom: 10 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text variant="titleMedium" style={styles.chartTitle}>Weekly Revenue Trend</Text>
              <Text variant="bodySmall" style={styles.chartSub}>Daily sales performance breakdown</Text>
            </View>
            <View style={styles.chartBadge}>
              <MaterialCommunityIcons name="trending-up" size={14} color={COLORS.success} />
              <Text style={styles.chartBadgeText}>Weekly</Text>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {dailySalesTrend.map((day, index) => {
              const date = new Date(day.date);
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
              
              // Standard scaling with minimum visual height
              const barHeightPct = Math.max((day.totalSales / maxSales) * 85, 6);
              
              return (
                <View key={index} style={styles.barWrapper}>
                  {day.totalSales > 0 ? (
                    <Text style={styles.barValText}>
                      ₹{day.totalSales >= 1000 ? `${(day.totalSales / 1000).toFixed(0)}k` : day.totalSales}
                    </Text>
                  ) : (
                    <Text style={styles.barValText}>-</Text>
                  )}
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { height: `${barHeightPct}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      {/* Welcome Dashboard Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTop}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
          <View style={styles.headerIntro}>
            <Text style={styles.storeName}>{user?.shopName || 'Sai Fertilizers & Chemicals'}</Text>
            <Text style={styles.welcomeText}>
              {getGreeting()}, {user?.username || 'Admin'}
            </Text>
          </View>
          <View style={styles.statusBadgeWrapper}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>
        
        <View style={styles.headerBottom}>
          <MaterialCommunityIcons name="calendar-month-outline" size={14} color="rgba(255, 255, 255, 0.7)" />
          <Text style={styles.dateText}>
            System Operations Log • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard metrics...</Text>
        </View>
      ) : (
        <>
          {/* Stats Grid */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Products"
              value={stats.totalProducts}
              icon="package-variant"
              color={COLORS.primary}
              trend="In Stock"
              trendType="positive"
            />
            <StatCard
              title="Total Invoices"
              value={stats.totalBills}
              icon="receipt"
              color={COLORS.info}
              trend="All Channels"
              trendType="neutral"
            />
            <StatCard
              title="Weekly Revenue"
              value={formatCurrency(stats.weeklySales)}
              icon="currency-inr"
              color={COLORS.success}
              trend="+12.4% vs last week"
              trendType="positive"
            />
            <StatCard
              title="Low Stock Alert"
              value={stats.lowStock}
              icon="alert-decagram-outline"
              color={stats.lowStock > 0 ? COLORS.error : COLORS.textSecondary}
              trend={stats.lowStock > 0 ? "Requires Action" : "Stock Healthy"}
              trendType={stats.lowStock > 0 ? "negative" : "positive"}
            />
          </View>

          {/* Quick Actions */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <Pressable 
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} 
              onPress={() => router.push('/billing')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: `${COLORS.primary}12` }]}>
                <MaterialCommunityIcons name="receipt" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>New Bill</Text>
              <Text style={styles.actionDesc}>Generate invoice</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} 
              onPress={() => router.push('/products')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: `${COLORS.info}12` }]}>
                <MaterialCommunityIcons name="package-variant-plus" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.actionLabel}>Add Product</Text>
              <Text style={styles.actionDesc}>Manage stock</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} 
              onPress={() => router.push('/reports')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: `${COLORS.warning}12` }]}>
                <MaterialCommunityIcons name="chart-bar" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.actionLabel}>Reports</Text>
              <Text style={styles.actionDesc}>Sales & trends</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]} 
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.actionIconWrapper, { backgroundColor: `${COLORS.secondary}12` }]}>
                <MaterialCommunityIcons name="store" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.actionLabel}>Store Profile</Text>
              <Text style={styles.actionDesc}>Edit GSTIN & info</Text>
            </Pressable>
          </View>

          {/* Custom Revenue Trend Chart */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Sales Analytics</Text>
          {renderWeeklyChart()}

          {/* Warehouse Health & Low Stock Warning */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Warehouse & Inventory Alerts</Text>
          <Card style={styles.cardContainer}>
            <Card.Content style={{ paddingVertical: 14 }}>
              <View style={styles.warehouseHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons 
                    name={stats.lowStock > 0 ? "alert-circle" : "check-circle"} 
                    size={22} 
                    color={stats.lowStock > 0 ? COLORS.error : COLORS.success} 
                  />
                  <Text style={styles.warehouseTitle}>Stock Level Check</Text>
                </View>
                <Chip 
                  style={{ backgroundColor: stats.lowStock > 0 ? `${COLORS.error}12` : `${COLORS.success}12` }}
                  textStyle={{ color: stats.lowStock > 0 ? COLORS.error : COLORS.success, fontSize: 11, fontWeight: '700' }}
                >
                  {stats.lowStock > 0 ? `${stats.lowStock} Low Stock` : 'Stock Healthy'}
                </Chip>
              </View>

              {stats.lowStock > 0 && lowStockProducts.length > 0 ? (
                <View style={styles.lowStockList}>
                  {lowStockProducts.map((prod) => {
                    const ratio = prod.currentStock / prod.lowStockThreshold;
                    const progressColor = ratio <= 0.2 ? COLORS.error : COLORS.warning;
                    return (
                      <View key={prod.id} style={styles.lowStockItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.lowStockProdName}>{prod.name}</Text>
                          <Text style={styles.lowStockSku}>SKU: {prod.sku || 'N/A'} | Category: {prod.category}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.lowStockQty, { color: progressColor }]}>
                            {prod.currentStock} {prod.unit} left
                          </Text>
                          <Text style={styles.lowStockThresholdText}>
                            Threshold: {prod.lowStockThreshold}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                  <Pressable 
                    onPress={() => router.push('/products')} 
                    style={styles.viewAllStockButton}
                  >
                    <Text style={styles.viewAllStockText}>Open Inventory Management</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
                  </Pressable>
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.warehouseHealthyText}>
                  Your warehouse inventory levels are healthy. All products are above their low-stock thresholds.
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Top Performing Products */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Top Selling Products</Text>
          <Card style={styles.topProductsCard}>
            <Card.Content style={{ paddingVertical: 14 }}>
              {topProducts.length === 0 ? (
                <Text variant="bodyMedium" style={styles.emptyText}>No sales transactions recorded yet</Text>
              ) : (
                <View style={{ gap: 14 }}>
                  {topProducts.slice(0, 3).map((item, index) => {
                    const maxRevenue = Math.max(...topProducts.map(t => t.totalRevenue), 1);
                    const progressPercentage = (item.totalRevenue / maxRevenue) * 100;
                    
                    return (
                      <View key={item.productId} style={styles.topProductItem}>
                        <View style={styles.topProductHeader}>
                          <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>{index + 1}</Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.topProductName}>{item.productName}</Text>
                            <Text style={styles.topProductSold}>{item.totalQuantitySold} {item.unit || 'units'} sold</Text>
                          </View>
                          <Text style={styles.topProductRevenue}>{formatCurrency(item.totalRevenue)}</Text>
                        </View>
                        <View style={styles.progressBarBackground}>
                          <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Recent Bills */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Recent Invoices</Text>
          {recentBills.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons name="receipt" size={32} color={COLORS.textDisabled} />
                <Text variant="bodyMedium" style={[styles.emptyText, { marginTop: 8 }]}>
                  No invoices generated yet
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.billsList}>
              {recentBills.map((bill) => (
                <Pressable
                  key={bill.id}
                  onPress={() => router.push(`/billing`)}
                  style={({ pressed }) => [
                    styles.billItemPressable,
                    pressed && styles.billItemPressed,
                  ]}
                >
                  <Card style={styles.billCard}>
                    <Card.Content style={styles.billContent}>
                      <View style={styles.billHeaderRow}>
                        <View style={styles.billNumWrapper}>
                          <MaterialCommunityIcons name="file-document-outline" size={16} color={COLORS.primary} />
                          <Text style={styles.billNumberText}>{bill.billNumber}</Text>
                        </View>
                        <Text style={styles.billDateText}>{formatDate(bill.createdAt)}</Text>
                      </View>
                      
                      <Divider style={styles.billDivider} />
                      
                      <View style={styles.billMainRow}>
                        <View>
                          <Text style={styles.custNameText}>{bill.customerName}</Text>
                          <Text style={styles.custPhoneText}>
                            +91 {bill.customerPhone ? bill.customerPhone.replace(/(\d{5})(\d{5})/, '$1-$2') : 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.amountSection}>
                          <Text style={styles.billAmtText}>{formatCurrency(bill.totalAmount)}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  bill.paymentStatus === 'paid'
                                    ? `${COLORS.success}12`
                                    : `${COLORS.secondary}12`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTextBadge,
                                {
                                  color:
                                    bill.paymentStatus === 'paid'
                                      ? COLORS.success
                                      : COLORS.secondary,
                                },
                              ]}
                            >
                              {bill.paymentStatus.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Sleek slate light background
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Header Banner
  headerBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  headerIntro: {
    flex: 1,
    marginLeft: 12,
  },
  storeName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statusBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginLeft: 6,
    fontWeight: '500',
  },

  // Titles
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A', // Slate 900
    marginBottom: 12,
    marginTop: 18,
    letterSpacing: 0.3,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate 200
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  statContent: {
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    color: '#64748B', // Slate 500
    fontWeight: '600',
    fontSize: 12,
    flex: 1,
    marginRight: 4,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 22,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Cards
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    marginBottom: 4,
  },

  // Quick Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    alignItems: 'flex-start',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  actionCardPressed: {
    backgroundColor: '#F8FAFC',
    opacity: 0.9,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Chart Styling
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 15,
  },
  chartSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  chartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  barBackground: {
    width: 16,
    height: 110,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },

  // Warehouse Widget
  warehouseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 10,
  },
  warehouseTitle: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 15,
  },
  lowStockList: {
    gap: 8,
  },
  lowStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  lowStockProdName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  lowStockSku: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  lowStockQty: {
    fontSize: 13,
    fontWeight: '700',
  },
  lowStockThresholdText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  viewAllStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 6,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 8,
    gap: 4,
  },
  viewAllStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  warehouseHealthyText: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 12,
    lineHeight: 18,
  },

  // Top Products Widget
  topProductsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    marginBottom: 4,
  },
  topProductItem: {
    paddingVertical: 4,
  },
  topProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  topProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  topProductSold: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  topProductRevenue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  // Recent Bills Styling
  billsList: {
    gap: 12,
  },
  billItemPressable: {
    borderRadius: 14,
  },
  billItemPressed: {
    opacity: 0.85,
  },
  billCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  billContent: {
    padding: 12,
  },
  billHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billNumWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billNumberText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 13,
  },
  billDateText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  billDivider: {
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  billMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  custNameText: {
    fontWeight: '600',
    color: '#1E293B',
    fontSize: 13,
  },
  custPhoneText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  billAmtText: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusTextBadge: {
    fontSize: 9,
    fontWeight: '700',
  },

  // Basic States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
  },
});
