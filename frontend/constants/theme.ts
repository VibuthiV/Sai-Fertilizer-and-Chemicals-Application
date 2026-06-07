// constants/theme.ts — React Native Paper Theme Configuration

import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { COLORS } from './colors';

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primarySurface,
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondarySurface,
    error: COLORS.error,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceVariant,
    onPrimary: COLORS.white,
    onSecondary: COLORS.white,
    onBackground: COLORS.textPrimary,
    onSurface: COLORS.textPrimary,
    outline: COLORS.border,
  },
};
