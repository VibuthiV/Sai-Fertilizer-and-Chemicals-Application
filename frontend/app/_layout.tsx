// app/_layout.tsx — Root layout for Expo Router
// Wraps entire app with Redux Provider and React Native Paper Provider

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider as ReduxProvider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '@/store';
import { appTheme } from '@/constants/theme';

// Prevent splash screen from auto-hiding before assets are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once layout is mounted
    SplashScreen.hideAsync();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={appTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(dashboard)" />
        </Stack>
      </PaperProvider>
    </ReduxProvider>
  );
}
