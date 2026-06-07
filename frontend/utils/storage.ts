// utils/storage.ts — AsyncStorage helper with type safety

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEYS = ['authToken'];

export const storage = {
  /**
   * Store a value. Uses SecureStore for sensitive keys, AsyncStorage otherwise.
   */
  setItem: async (key: string, value: string): Promise<void> => {
    if (SECURE_KEYS.includes(key)) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  /**
   * Retrieve a value.
   */
  getItem: async (key: string): Promise<string | null> => {
    if (SECURE_KEYS.includes(key)) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  },

  /**
   * Remove a value.
   */
  removeItem: async (key: string): Promise<void> => {
    if (SECURE_KEYS.includes(key)) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  /**
   * Store an object as JSON.
   */
  setObject: async <T>(key: string, value: T): Promise<void> => {
    await storage.setItem(key, JSON.stringify(value));
  },

  /**
   * Retrieve and parse a JSON object.
   */
  getObject: async <T>(key: string): Promise<T | null> => {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Clear all AsyncStorage keys (does not clear SecureStore).
   */
  clearAll: async (): Promise<void> => {
    await AsyncStorage.clear();
  },
};
