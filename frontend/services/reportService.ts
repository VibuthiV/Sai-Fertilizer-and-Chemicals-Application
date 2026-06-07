// services/reportService.ts — Reports API calls

import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import {
  DailySalesSummary,
  WeeklySalesSummary,
  MonthlySalesSummary,
  YearlySalesSummary,
  ReportSummary,
  TrendSummary,
} from '@/types/report.types';

export const reportService = {
  getDaily: async (date?: string): Promise<DailySalesSummary> => {
    const { data } = await api.get<DailySalesSummary>(
      API_ENDPOINTS.REPORTS_DAILY,
      { params: { date } }
    );
    return data;
  },

  getWeekly: async (startDate?: string): Promise<WeeklySalesSummary> => {
    const { data } = await api.get<WeeklySalesSummary>(
      API_ENDPOINTS.REPORTS_WEEKLY,
      { params: { startDate } }
    );
    return data;
  },

  getMonthly: async (month?: number, year?: number): Promise<MonthlySalesSummary> => {
    const { data } = await api.get<MonthlySalesSummary>(
      API_ENDPOINTS.REPORTS_MONTHLY,
      { params: { month, year } }
    );
    return data;
  },

  getYearly: async (year?: number): Promise<YearlySalesSummary> => {
    const { data } = await api.get<YearlySalesSummary>(
      API_ENDPOINTS.REPORTS_YEARLY,
      { params: { year } }
    );
    return data;
  },

  getSummary: async (): Promise<ReportSummary> => {
    const { data } = await api.get<ReportSummary>(API_ENDPOINTS.REPORTS_SUMMARY);
    return data;
  },

  getTrend: async (timeline: string): Promise<TrendSummary> => {
    const { data } = await api.get<TrendSummary>(API_ENDPOINTS.REPORTS_TREND, {
      params: { timeline },
    });
    return data;
  },
};
