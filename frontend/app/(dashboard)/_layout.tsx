// app/(dashboard)/_layout.tsx — Bottom Tab Navigation Layout

import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

type TabIconProps = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  size: number;
};

function TabIcon({ name, color, size }: TabIconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: 32, height: 32, marginLeft: 16, borderRadius: 6 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="view-dashboard" color={color} size={size} />
          ),
          headerTitle: 'Sai Fertilizers and Chemicals',
        }}
      />
      <Tabs.Screen
        name="products/index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="package-variant" color={color} size={size} />
          ),
          headerTitle: 'Products & Stock',
        }}
      />
      <Tabs.Screen
        name="billing/index"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt" color={color} size={size} />
          ),
          headerTitle: 'Billing',
        }}
      />
      <Tabs.Screen
        name="reports/index"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chart-bar" color={color} size={size} />
          ),
          headerTitle: 'Sales Reports',
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account-circle" color={color} size={size} />
          ),
          headerTitle: 'Store Profile',
        }}
      />
    </Tabs>
  );
}

