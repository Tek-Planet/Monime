# MiBuks Mobile (React Native + Expo)

This directory contains the cross-platform React Native / Expo application for **MiBuks**, fully replicating all user-facing functionalities of the web application.

## 📱 Features Included (User App Scope)
1. **Supabase Backend Integration**:
   - Authentication (Sign In & Sign Up)
   - Realtime database sync for sales, inventory, invoices, expenses, customers, and suppliers.
   - Offline token persistence via `AsyncStorage`.
2. **Security & PIN Lock**:
   - Local 4-digit security PIN lock screen.
3. **Multi-Language Support**:
   - Instantly switch between **English**, **Krio**, and **French**.
4. **Core Modules**:
   - **Dashboard**: Live revenue, low stock alerts, credit rating preview, recent sales.
   - **Sales**: Quick sale entry, customer linking, stock deduction, cart manager.
   - **Invoices**: Create invoices, line items, status badges (Paid, Pending, Overdue).
   - **Inventory**: Product catalog, stock alerts, price & cost management.
   - **Customers & Debtors**: Customer directory, balance tracking, credit limits.
   - **Suppliers**: Supplier directory and contact logs.
   - **Expenses**: Expense recording and category breakdown.
   - **Credit Score Engine**: 6 core financial indices (Repayment History, Volume, Longevity, Inventory Value, Expense Ratio, Customer Retention) with micro-loan applications.
   - **Reports**: Financial overview (Revenue, Expenses, Net Profit, Inventory Valuation).
   - **Settings**: Business profile, branch switcher, language selector, security PIN settings.

---

## 🚀 How to Run the App

### Prerequisites
- Node.js (v18 or later)
- Expo CLI (`npm install -g expo-cli`)
- [Expo Go App](https://expo.dev/go) on your Android device or iPhone.

### 1. Installation
In your terminal, navigate to the `mobile` subfolder:
```bash
cd mobile
npm install
```

### 2. Start Development Server
Start the Metro bundler:
```bash
npx expo start
```

### 3. Running on Mobile Devices
- **Android / iOS via Expo Go**: Scan the QR code displayed in the terminal using your phone camera (iOS) or the Expo Go app (Android).
- **Android Emulator**: Press `a` in the terminal to launch on an open Android emulator.
- **iOS Simulator**: Press `i` in the terminal to launch on Xcode simulator (macOS only).

---

## 📦 Building Standalone APK / iOS App

To build standalone `.apk` / `.aab` for Android or `.ipa` for iOS using Expo Application Services (EAS):

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Build for Android (APK):
   ```bash
   eas build -p android --profile preview
   ```
4. Build for iOS:
   ```bash
   eas build -p ios
   ```
