// components/common/AppHeader.tsx — Reusable App Header

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export function AppHeader({ title, subtitle, showBack = false, rightAction }: AppHeaderProps) {
  const router = useRouter();

  return (
    <Appbar.Header style={styles.header}>
      {showBack && (
        <Appbar.BackAction
          onPress={() => router.back()}
          color={COLORS.white}
        />
      )}
      <Appbar.Content
        title={title}
        subtitle={subtitle}
        titleStyle={styles.title}
        subtitleStyle={styles.subtitle}
      />
      {rightAction && (
        <Appbar.Action
          icon={rightAction.icon}
          onPress={rightAction.onPress}
          iconColor={COLORS.white}
        />
      )}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    elevation: 4,
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
});
