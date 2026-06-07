// store/slices/productSlice.ts — Products Redux Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductState } from '@/types/product.types';

const initialState: ProductState = {
  items: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  totalCount: 0,
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchProductsSuccess(
      state,
      action: PayloadAction<{ items: Product[]; total: number }>
    ) {
      state.isLoading = false;
      state.items = action.payload.items;
      state.totalCount = action.payload.total;
    },
    fetchProductsFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
    },
    addProduct(state, action: PayloadAction<Product>) {
      state.items.unshift(action.payload);
      state.totalCount += 1;
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeProduct(state, action: PayloadAction<number>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      state.totalCount -= 1;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  setSelectedProduct,
  addProduct,
  updateProduct,
  removeProduct,
  clearError,
} = productSlice.actions;

export default productSlice.reducer;
