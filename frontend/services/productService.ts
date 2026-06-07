// services/productService.ts — Product API calls

import api from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Product, CreateProductDto, UpdateProductDto } from '@/types/product.types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const productService = {
  /**
   * GET /products — Fetch all products (with optional search/filter)
   */
  getAll: async (params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<PaginatedResponse<Product>>(
      API_ENDPOINTS.PRODUCTS,
      { params }
    );
    return data;
  },

  /**
   * GET /products/:id — Fetch single product
   */
  getById: async (id: number): Promise<Product> => {
    const { data } = await api.get<Product>(API_ENDPOINTS.PRODUCT_BY_ID(id));
    return data;
  },

  /**
   * POST /products — Create a new product
   */
  create: async (dto: CreateProductDto): Promise<Product> => {
    const { data } = await api.post<Product>(API_ENDPOINTS.PRODUCTS, dto);
    return data;
  },

  /**
   * PUT /products/:id — Update an existing product
   */
  update: async (id: number, dto: UpdateProductDto): Promise<Product> => {
    const { data } = await api.put<Product>(API_ENDPOINTS.PRODUCT_BY_ID(id), dto);
    return data;
  },

  /**
   * DELETE /products/:id — Soft-delete a product
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(API_ENDPOINTS.PRODUCT_BY_ID(id));
  },
};
