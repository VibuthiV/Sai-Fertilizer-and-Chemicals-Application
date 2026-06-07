// hooks/useAuth.ts — Auth state hook

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from './useAppDispatch';
import { logout } from '@/store/slices/authSlice';
import { storage } from '@/utils/storage';
import { useRouter } from 'expo-router';

/**
 * Convenience hook for accessing auth state and actions.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useSelector((state: RootState) => state.auth);

  const signOut = async () => {
    await storage.removeItem('authToken');
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    signOut,
  };
};
