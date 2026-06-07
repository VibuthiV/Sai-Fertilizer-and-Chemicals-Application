// constants/api.ts — API endpoint constants

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  UPDATE_PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',

  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: number) => `/products/${id}`,

  // Bills
  BILLS: '/bills',
  BILL_BY_ID: (id: number) => `/bills/${id}`,
  BILL_PDF: (id: number) => `/bills/${id}/pdf`,

  // Reports
  REPORTS_DAILY: '/reports/daily',
  REPORTS_WEEKLY: '/reports/weekly',
  REPORTS_MONTHLY: '/reports/monthly',
  REPORTS_YEARLY: '/reports/yearly',
  REPORTS_SUMMARY: '/reports/summary',
  REPORTS_TREND: '/reports/trend',
} as const;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
