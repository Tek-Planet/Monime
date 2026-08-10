import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { CreditScreen } from '../screens/CreditScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
        tabBarIcon: ({ color, size }) => {
          let icon = '📊';
          if (route.name === 'Dashboard') icon = '🏠';
          else if (route.name === 'Sales') icon = '🛍️';
          else if (route.name === 'Invoices') icon = '📄';
          else if (route.name === 'Inventory') icon = '📦';
          else if (route.name === 'Credit') icon = '📈';
          else if (route.name === 'Settings') icon = '⚙️';

          return <Text style={{ fontSize: size - 2 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Sales" component={SalesScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Credit" component={CreditScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
