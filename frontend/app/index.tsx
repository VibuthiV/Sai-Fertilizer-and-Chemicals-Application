// app/index.tsx — Entry point
// Redirects to login or dashboard based on auth state

import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function Index() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
