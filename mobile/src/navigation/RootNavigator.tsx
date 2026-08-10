import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { usePinLock } from '../contexts/PinLockContext';

import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { PinLockScreen } from '../screens/PinLockScreen';
import { MainTabNavigator } from './MainTabNavigator';

import { AddSaleScreen } from '../screens/AddSaleScreen';
import { CreateInvoiceScreen } from '../screens/CreateInvoiceScreen';
import { AddInventoryScreen } from '../screens/AddInventoryScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { AddCustomerScreen } from '../screens/AddCustomerScreen';
import { SuppliersScreen } from '../screens/SuppliersScreen';
import { AddSupplierScreen } from '../screens/AddSupplierScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { ApplyLoanScreen } from '../screens/ApplyLoanScreen';
import { ReportsScreen } from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, loading } = useAuth();
  const { isLocked } = usePinLock();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (isLocked) {
    return <PinLockScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="AddSale" component={AddSaleScreen} />
          <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
          <Stack.Screen name="AddInventory" component={AddInventoryScreen} />
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
          <Stack.Screen name="Suppliers" component={SuppliersScreen} />
          <Stack.Screen name="AddSupplier" component={AddSupplierScreen} />
          <Stack.Screen name="Expenses" component={ExpensesScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
