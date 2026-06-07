// store/slices/uiSlice.ts — UI State Redux Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UiState {
  isLoading: boolean;
  toasts: Toast[];
  networkError: string | null;
}

const initialState: UiState = {
  isLoading: false,
  toasts: [],
  networkError: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    showToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      const id = Date.now().toString();
      state.toasts.push({ id, ...action.payload });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setNetworkError(state, action: PayloadAction<string | null>) {
      state.networkError = action.payload;
    },
  },
});

export const { setGlobalLoading, showToast, removeToast, setNetworkError } =
  uiSlice.actions;

export default uiSlice.reducer;
