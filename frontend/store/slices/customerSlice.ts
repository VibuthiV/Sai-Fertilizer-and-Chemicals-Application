// store/slices/customerSlice.ts — Customers Redux Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer, CustomerState } from '@/types/customer.types';

const initialState: CustomerState = {
  items: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  totalCount: 0,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    fetchCustomersStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchCustomersSuccess(
      state,
      action: PayloadAction<{ items: Customer[]; total: number }>
    ) {
      state.isLoading = false;
      state.items = action.payload.items;
      state.totalCount = action.payload.total;
    },
    fetchCustomersFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setSelectedCustomer(state, action: PayloadAction<Customer | null>) {
      state.selectedCustomer = action.payload;
    },
    addCustomer(state, action: PayloadAction<Customer>) {
      state.items.unshift(action.payload);
      state.totalCount += 1;
    },
    updateCustomer(state, action: PayloadAction<Customer>) {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeCustomer(state, action: PayloadAction<number>) {
      state.items = state.items.filter((c) => c.id !== action.payload);
      state.totalCount -= 1;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchCustomersStart,
  fetchCustomersSuccess,
  fetchCustomersFailure,
  setSelectedCustomer,
  addCustomer,
  updateCustomer,
  removeCustomer,
  clearError,
} = customerSlice.actions;

export default customerSlice.reducer;
