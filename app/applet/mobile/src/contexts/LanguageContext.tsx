import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'krio' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.title": "MiBuks Mobile",
    "nav.dashboard": "Dashboard",
    "nav.sales": "Sales",
    "nav.invoices": "Invoices",
    "nav.inventory": "Inventory",
    "nav.more": "More",
    "nav.credit": "Credit Score",
    "nav.customers": "Customers",
    "nav.suppliers": "Suppliers",
    "nav.expenses": "Expenses",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "auth.welcome": "Welcome to MiBuks",
    "auth.login": "Sign In",
    "auth.register": "Create Account",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.logout": "Sign Out",
    "dashboard.totalSales": "Total Sales",
    "dashboard.totalRevenue": "Total Revenue",
    "dashboard.totalExpenses": "Total Expenses",
    "dashboard.lowStockAlerts": "Low Stock Items",
    "dashboard.quickActions": "Quick Actions",
    "sale.addSale": "Record New Sale",
    "sale.total": "Total Amount",
    "sale.paymentMethod": "Payment Method",
    "invoice.create": "Create Invoice",
    "inventory.add": "Add Item",
    "customer.add": "Add Customer",
    "credit.score": "Credit Score",
    "credit.maxLoan": "Eligible Micro Loan",
    "settings.pinLock": "Security PIN Lock",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.loading": "Loading...",
  },
  krio: {
    "app.title": "MiBuks Mobile",
    "nav.dashboard": "Dashboard",
    "nav.sales": "Sels Dem",
    "nav.invoices": "Invoys Dem",
    "nav.inventory": "Stok Dem",
    "nav.more": "Oda Tin",
    "nav.credit": "Kredit Skow",
    "nav.customers": "Kostoma Dem",
    "nav.suppliers": "Soplayah Dem",
    "nav.expenses": "Kost Dem",
    "nav.reports": "Ripot Dem",
    "nav.settings": "Setin Dem",
    "auth.welcome": "Kusheh na MiBuks",
    "auth.login": "Lagin",
    "auth.register": "Opun Akawnt",
    "auth.email": "Imel Adres",
    "auth.password": "Paswod",
    "auth.logout": "Komot Na Akawnt",
    "dashboard.totalSales": "Ol Sels",
    "dashboard.totalRevenue": "Ol Mone Wey Enta",
    "dashboard.totalExpenses": "Ol Mone Wey Komot",
    "dashboard.lowStockAlerts": "Stok Wey De Don",
    "dashboard.quickActions": "Kwik Opeshon",
    "sale.addSale": "Rikod New Sel",
    "sale.total": "Ol Mone Total",
    "sale.paymentMethod": "Aw Yu Pay",
    "invoice.create": "Mek New Invoys",
    "inventory.add": "Add New Stok",
    "customer.add": "Add Kostoma",
    "credit.score": "Yu Kredit Skow",
    "credit.maxLoan": "Mone Wey Yu Kin Borro",
    "settings.pinLock": "PIN Lok Seakyuriti",
    "common.save": "Sev",
    "common.cancel": "Kansul",
    "common.delete": "Dilit",
    "common.loading": "De Lod...",
  },
  fr: {
    "app.title": "MiBuks Mobile",
    "nav.dashboard": "Tableau de Bord",
    "nav.sales": "Ventes",
    "nav.invoices": "Factures",
    "nav.inventory": "Inventaire",
    "nav.more": "Plus",
    "nav.credit": "Score de Crédit",
    "nav.customers": "Clients",
    "nav.suppliers": "Fournisseurs",
    "nav.expenses": "Dépenses",
    "nav.reports": "Rapports",
    "nav.settings": "Paramètres",
    "auth.welcome": "Bienvenue sur MiBuks",
    "auth.login": "Se Connecter",
    "auth.register": "Créer un Compte",
    "auth.email": "Adresse Email",
    "auth.password": "Mot de Passe",
    "auth.logout": "Se Déconnecter",
    "dashboard.totalSales": "Ventes Totales",
    "dashboard.totalRevenue": "Chiffre d'Affaires",
    "dashboard.totalExpenses": "Dépenses Totales",
    "dashboard.lowStockAlerts": "Stock Faible",
    "dashboard.quickActions": "Actions Rapides",
    "sale.addSale": "Enregistrer Vente",
    "sale.total": "Montant Total",
    "sale.paymentMethod": "Mode de Paiement",
    "invoice.create": "Créer Facture",
    "inventory.add": "Ajouter Produit",
    "customer.add": "Ajouter Client",
    "credit.score": "Score de Crédit",
    "credit.maxLoan": "Prêt Éligible",
    "settings.pinLock": "Verrouillage par Code PIN",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.delete": "Supprimer",
    "common.loading": "Chargement...",
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem('mibuks_language').then((saved) => {
      if (saved === 'en' || saved === 'krio' || saved === 'fr') {
        setLanguageState(saved as Language);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem('mibuks_language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
