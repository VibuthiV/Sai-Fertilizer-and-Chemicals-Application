// app/(dashboard)/profile/index.tsx — Profile & Settings Screen

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, List, Divider, Button, Avatar, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout, setUser } from '@/store/slices/authSlice';
import { storage } from '@/utils/storage';
import { COLORS } from '@/constants/colors';
import { authService } from '@/services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // Profile Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [shopName, setShopName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      setAdminName(user.adminName || 'Admin User');
      setShopName(user.shopName || 'Sai Fertilizers & Chemicals');
      setContactPhone(user.contactPhone || '+91 98765 43210');
      setAddress(user.address || 'NH Road, Shop No. 12, Main Market');
      setGstin(user.gstin || '33AAAAA1111A1Z1');
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await storage.removeItem('authToken');
            dispatch(logout());
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!adminName.trim()) {
      Alert.alert('Validation Error', 'Admin Name is required');
      return;
    }
    if (!shopName.trim()) {
      Alert.alert('Validation Error', 'Shop Name is required');
      return;
    }
    if (!contactPhone.trim()) {
      Alert.alert('Validation Error', 'Contact Phone is required');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Validation Error', 'Shop Address is required');
      return;
    }
    if (!gstin.trim()) {
      Alert.alert('Validation Error', 'GSTIN is required');
      return;
    }

    try {
      setProfileSaving(true);
      const updatedUser = await authService.updateProfile({
        adminName: adminName.trim(),
        shopName: shopName.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        gstin: gstin.trim(),
      });

      // Update in Redux store
      dispatch(setUser(updatedUser));
      setIsEditing(false);
      Alert.alert('Success', 'Profile details updated successfully');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      const msg = err?.response?.data?.message || 'Failed to save profile changes';
      Alert.alert('Error', msg);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setAdminName(user.adminName || 'Admin User');
      setShopName(user.shopName || 'Sai Fertilizers & Chemicals');
      setContactPhone(user.contactPhone || '+91 98765 43210');
      setAddress(user.address || 'NH Road, Shop No. 12, Main Market');
      setGstin(user.gstin || '33AAAAA1111A1Z1');
    }
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Validation Error', 'Current password is required');
      return;
    }
    if (!newPassword) {
      Alert.alert('Validation Error', 'New password is required');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation Error', 'New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    try {
      setPasswordSaving(true);
      await authService.changePassword({
        oldPassword,
        newPassword,
      });

      // Clear fields on success
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      Alert.alert('Success', 'Password updated successfully');
    } catch (err: any) {
      console.error('Error changing password:', err);
      const msg = err?.response?.data?.message || 'Failed to update password';
      Alert.alert('Error', msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'AD';
    const split = nameStr.split(' ');
    if (split.length >= 2) {
      return (split[0][0] + split[1][0]).toUpperCase();
    }
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar.Text
          size={80}
          label={getInitials(user?.adminName || user?.username || 'Admin')}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.adminName || 'Admin User'}
        </Text>
        <Text variant="bodyMedium" style={styles.role}>
          Shop Owner & Administrator
        </Text>
      </View>

      {/* Shop Info Card */}
      <Card style={styles.card}>
        <Card.Title
          title={isEditing ? 'Edit Profile & Store Details' : 'Store Profile Info'}
          titleVariant="titleMedium"
          left={(props) => <List.Icon {...props} icon="storefront" color={COLORS.primary} />}
        />
        <Divider />
        <Card.Content style={{ paddingTop: 12 }}>
          {isEditing ? (
            <View style={styles.formContainer}>
              <TextInput
                label="Owner / Administrator Name"
                value={adminName}
                onChangeText={setAdminName}
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />
              <TextInput
                label="Shop Name"
                value={shopName}
                onChangeText={setShopName}
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />
              <TextInput
                label="Contact Number"
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />
              <TextInput
                label="Shop Address"
                value={address}
                onChangeText={setAddress}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />
              <TextInput
                label="GSTIN Identification"
                value={gstin}
                onChangeText={setGstin}
                autoCapitalize="characters"
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  style={styles.actionBtn}
                  textColor={COLORS.textSecondary}
                  disabled={profileSaving}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={styles.actionBtn}
                  buttonColor={COLORS.primary}
                  loading={profileSaving}
                  disabled={profileSaving}
                >
                  Save Details
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <List.Item
                title="Admin Name"
                description={user?.adminName || 'Admin User'}
                left={(props) => <List.Icon {...props} icon="account" />}
                style={styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="Shop Name"
                description={user?.shopName || 'Sai Fertilizers & Chemicals'}
                left={(props) => <List.Icon {...props} icon="store" />}
                style={styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="Contact Mobile"
                description={user?.contactPhone || '+91 98765 43210'}
                left={(props) => <List.Icon {...props} icon="phone" />}
                style={styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="Store Address"
                description={user?.address || 'NH Road, Shop No. 12, Main Market'}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
                style={styles.listItem}
              />
              <Divider style={styles.listDivider} />
              <List.Item
                title="GSTIN Number"
                description={user?.gstin || '33AAAAA1111A1Z1'}
                left={(props) => <List.Icon {...props} icon="card-account-details-outline" />}
                style={styles.listItem}
              />
              
              <Button
                mode="contained"
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
                buttonColor={COLORS.primary}
                icon="pencil"
              >
                Edit Store Details
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Change Password Card */}
      <Card style={styles.card}>
        <Card.Title
          title="Security Settings"
          titleVariant="titleMedium"
          left={(props) => <List.Icon {...props} icon="shield-lock-outline" color={COLORS.secondary} />}
        />
        <Divider />
        <Card.Content style={{ paddingTop: 16 }}>
          {isChangingPassword ? (
            <View>
              <TextInput
                label="Current Password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.secondary}
              />
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.secondary}
              />
              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                mode="outlined"
                style={styles.formInput}
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.secondary}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setIsChangingPassword(false);
                  }}
                  style={styles.actionBtn}
                  textColor={COLORS.textSecondary}
                  disabled={passwordSaving}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleChangePassword}
                  style={styles.actionBtn}
                  buttonColor={COLORS.secondary}
                  loading={passwordSaving}
                  disabled={passwordSaving}
                  icon="key-change"
                >
                  Update Password
                </Button>
              </View>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setIsChangingPassword(true)}
              style={styles.passwordButton}
              buttonColor={COLORS.secondary}
              icon="lock-reset"
            >
              Change Password
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Logout */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={COLORS.error}
        icon="logout"
      >
        Logout Account
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 20, paddingVertical: 12 },
  avatar: { backgroundColor: COLORS.primary, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  avatarLabel: { fontSize: 26, fontWeight: '700' },
  name: { fontWeight: '700', color: '#0F172A', fontSize: 20 },
  role: { color: '#64748B', marginTop: 2, fontSize: 13, fontWeight: '500' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    elevation: 1.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    marginBottom: 16,
  },
  
  formContainer: { paddingBottom: 6 },
  formInput: { marginBottom: 14, backgroundColor: '#FFFFFF' },
  
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 6 },
  actionBtn: { flex: 1, borderRadius: 8 },
  
  listItem: { paddingVertical: 4 },
  listDivider: { backgroundColor: '#F1F5F9' },
  
  editButton: {
    marginTop: 14,
    borderRadius: 8,
    paddingVertical: 2,
  },
  passwordButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 2,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: COLORS.error,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
});
