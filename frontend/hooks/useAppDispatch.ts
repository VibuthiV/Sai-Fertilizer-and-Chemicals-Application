// hooks/useAppDispatch.ts — Typed Redux dispatch hook

import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';

/**
 * Use this instead of plain `useDispatch` for correct TypeScript types.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
