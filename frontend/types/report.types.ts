// types/report.types.ts

export interface DailySalesSummary {
  date: string;
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface WeeklySalesSummary {
  weekStart: string;
  weekEnd: string;
  totalSales: number;
  totalOrders: number;
  dailyBreakdown: DailySalesSummary[];
}

export interface MonthlySalesSummary {
  month: number;
  year: number;
  totalSales: number;
  totalOrders: number;
  weeklyBreakdown: WeeklySalesSummary[];
}

export interface YearlySalesSummary {
  year: number;
  totalSales: number;
  totalOrders: number;
  monthlyBreakdown: MonthlySalesSummary[];
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  unit: string;
}

export interface ReportSummary {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  topProducts: TopProduct[];
  totalProducts: number;
}

export interface TrendPoint {
  label: string;
  sales: number;
}

export interface TrendSummary {
  timeline: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalOrders: number;
  trend: TrendPoint[];
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
