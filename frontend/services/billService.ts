// services/billService.ts — Bill API calls

import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Bill, CreateBillDto } from '@/types/bill.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const billService = {
  /**
   * GET /bills — Fetch all bills (with optional search/filter)
   */
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Bill>> => {
    const { data } = await api.get<PaginatedResponse<Bill>>(
      API_ENDPOINTS.BILLS,
      { params }
    );
    return data;
  },

  /**
   * GET /bills/:id — Fetch single bill
   */
  getById: async (id: number): Promise<Bill> => {
    const { data } = await api.get<Bill>(API_ENDPOINTS.BILL_BY_ID(id));
    return data;
  },

  /**
   * POST /bills — Create a new bill
   */
  create: async (dto: CreateBillDto): Promise<Bill> => {
    const { data } = await api.post<Bill>(API_ENDPOINTS.BILLS, dto);
    return data;
  },
};
