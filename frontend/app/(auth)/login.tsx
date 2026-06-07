// app/(auth)/login.tsx — Admin Login Screen

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { COLORS } from '@/constants/colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });

  const validate = (): boolean => {
    const newErrors = { username: '', password: '' };
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    dispatch(loginStart());

    try {
      const response = await authService.login({ username, password });
      dispatch(loginSuccess(response));
      router.replace('/(dashboard)');
    } catch (error: any) {
      const message = error?.response?.data?.message || `Invalid credentials (${error.message || 'Network/Server Error'})`;
      dispatch(loginFailure(message));
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="sprout" size={42} color="#FFFFFF" />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            Sai Fertilizers
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Stock & Billing System
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Admin Login
          </Text>
          <Text variant="bodySmall" style={styles.cardSubtitle}>
            Sign in to manage your shop
          </Text>

          {/* Username */}
          <TextInput
            label="Username (Admin Name)"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            left={<TextInput.Icon icon="account" />}
            style={styles.input}
            error={!!errors.username}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />
          <HelperText type="error" visible={!!errors.username}>
            {errors.username}
          </HelperText>

          {/* Password */}
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            error={!!errors.password}
            outlineColor={COLORS.border}
            activeOutlineColor={COLORS.primary}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            labelStyle={styles.loginButtonLabel}
            buttonColor={COLORS.primary}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </View>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontWeight: '500',
  },
  input: {
    marginBottom: 2,
    backgroundColor: '#FFFFFF',
  },
  loginButton: {
    marginTop: 12,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 6,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 32,
    fontSize: 12,
    fontWeight: '500',
  },
});
