// services/customerService.ts — Customer API calls

import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/customer.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const customerService = {
  getAll: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Customer>> => {
    const { data } = await api.get<PaginatedResponse<Customer>>(
      API_ENDPOINTS.CUSTOMERS,
      { params }
    );
    return data;
  },

  getById: async (id: number): Promise<Customer> => {
    const { data } = await api.get<Customer>(API_ENDPOINTS.CUSTOMER_BY_ID(id));
    return data;
  },

  create: async (dto: CreateCustomerDto): Promise<Customer> => {
    const { data } = await api.post<Customer>(API_ENDPOINTS.CUSTOMERS, dto);
    return data;
  },

  update: async (id: number, dto: UpdateCustomerDto): Promise<Customer> => {
    const { data } = await api.put<Customer>(
      API_ENDPOINTS.CUSTOMER_BY_ID(id),
      dto
    );
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.CUSTOMER_BY_ID(id));
  },
};
