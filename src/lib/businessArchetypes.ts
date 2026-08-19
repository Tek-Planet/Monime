export type BusinessArchetype = 'food' | 'retail' | 'service';

export interface BusinessTypeOption {
  value: string;
  label: string;
  archetype: BusinessArchetype;
  description: string;
  iconName: string;
  starterCategories: string[];
  defaultUnits: string[];
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  // Food & Hospitality
  {
    value: 'restaurant',
    label: 'Restaurant / Eatery',
    archetype: 'food',
    description: 'Dine-in, takeaway, chop bars, and eateries',
    iconName: 'Utensils',
    starterCategories: ['Main Dishes', 'Sides & Extras', 'Drinks & Beverages', 'Specials'],
    defaultUnits: ['Plate', 'Portion', 'Bowl', 'Cup', 'Bottle', 'Order'],
  },
  {
    value: 'chop_bar',
    label: 'Chop Bar / Local Cookery',
    archetype: 'food',
    description: 'Local dishes, cookeries, and food stalls',
    iconName: 'Soup',
    starterCategories: ['Cookery Dishes', 'Soups & Stews', 'Sides', 'Soft Drinks'],
    defaultUnits: ['Plate', 'Bowl', 'Cup', 'Wrap', 'Piece'],
  },
  {
    value: 'bakery',
    label: 'Bakery & Pastry',
    archetype: 'food',
    description: 'Fresh bread, cakes, pastries, and snacks',
    iconName: 'Cake',
    starterCategories: ['Bread & Loaves', 'Cakes & Pastries', 'Snacks', 'Hot Beverages'],
    defaultUnits: ['Loaf', 'Piece', 'Box', 'Pack', 'Slice'],
  },
  {
    value: 'cafe',
    label: 'Cafe & Coffee Shop',
    archetype: 'food',
    description: 'Coffee, tea, breakfast, and light bites',
    iconName: 'Coffee',
    starterCategories: ['Hot Drinks', 'Cold Drinks', 'Breakfast Items', 'Pastries'],
    defaultUnits: ['Cup', 'Glass', 'Serving', 'Piece'],
  },
  {
    value: 'bar_lounge',
    label: 'Bar, Pub & Lounge',
    archetype: 'food',
    description: 'Drinks, cocktails, beers, and lounge food',
    iconName: 'Wine',
    starterCategories: ['Beers & Ciders', 'Spirits & Cocktails', 'Soft Drinks', 'Bar Bites'],
    defaultUnits: ['Bottle', 'Glass', 'Can', 'Shot', 'Plate'],
  },
  {
    value: 'catering',
    label: 'Catering & Events Food',
    archetype: 'food',
    description: 'Event catering, party trays, and bulk meal prep',
    iconName: 'PartyPopper',
    starterCategories: ['Party Trays', 'Buffet Packages', 'Event Drinks', 'Custom Menus'],
    defaultUnits: ['Tray', 'Pax', 'Platter', 'Package', 'Pot'],
  },

  // Retail & Goods
  {
    value: 'provision_store',
    label: 'Provision Store / Kiosk',
    archetype: 'retail',
    description: 'Groceries, household items, toiletries, and daily provisions',
    iconName: 'Store',
    starterCategories: ['Foodstuffs & Grains', 'Toiletries', 'Beverages & Milk', 'Household Goods'],
    defaultUnits: ['Piece', 'Pack', 'Carton', 'Bag', 'Bottle', 'Cup'],
  },
  {
    value: 'supermarket',
    label: 'Supermarket / Grocery Mart',
    archetype: 'retail',
    description: 'Packaged foods, frozen items, home essentials, and goods',
    iconName: 'ShoppingCart',
    starterCategories: ['Packaged Goods', 'Dairy & Eggs', 'Frozen Foods', 'Personal Care'],
    defaultUnits: ['Item', 'Pack', 'Box', 'Kg', 'Litre'],
  },
  {
    value: 'clothing',
    label: 'Boutique & Fashion',
    archetype: 'retail',
    description: 'Apparel, shoes, bags, jewelry, and accessories',
    iconName: 'Shirt',
    starterCategories: ['Men\'s Wear', 'Women\'s Wear', 'Shoes & Footwear', 'Accessories'],
    defaultUnits: ['Piece', 'Pair', 'Set'],
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy & Chemist',
    archetype: 'retail',
    description: 'Prescription medicines, OTC drugs, and healthcare products',
    iconName: 'Pill',
    starterCategories: ['OTC Medicines', 'Prescription Drugs', 'Supplements', 'First Aid'],
    defaultUnits: ['Strip', 'Bottle', 'Box', 'Sachet', 'Unit'],
  },
  {
    value: 'electronics',
    label: 'Electronics & Phones',
    archetype: 'retail',
    description: 'Mobile phones, accessories, gadgets, and electronics',
    iconName: 'Smartphone',
    starterCategories: ['Phones & Devices', 'Cables & Chargers', 'Audio & Earphones', 'Accessories'],
    defaultUnits: ['Piece', 'Unit', 'Box', 'Set'],
  },
  {
    value: 'retail',
    label: 'General Retail Store',
    archetype: 'retail',
    description: 'General merchandise, goods, and consumer products',
    iconName: 'ShoppingBag',
    starterCategories: ['General Goods', 'Fast Moving Items', 'Specialty Items'],
    defaultUnits: ['Piece', 'Pack', 'Box', 'Unit'],
  },
  {
    value: 'wholesale',
    label: 'Wholesale & Bulk Distributor',
    archetype: 'retail',
    description: 'Bulk goods, warehouse supply, and distributor inventory',
    iconName: 'Truck',
    starterCategories: ['Bulk Foodstuffs', 'Carton Drinks', 'Household Bundles'],
    defaultUnits: ['Carton', 'Bag (50kg)', 'Bundle', 'Crate', 'Pallet'],
  },

  // Services & Trades
  {
    value: 'salon_barber',
    label: 'Beauty Salon & Barbershop',
    archetype: 'service',
    description: 'Haircuts, braiding, styling, grooming, and spa services',
    iconName: 'Scissors',
    starterCategories: ['Haircuts & Styling', 'Braiding & Weaves', 'Nails & Pedicure', 'Spa & Facial'],
    defaultUnits: ['Session', 'Service', 'Hour', 'Treatment'],
  },
  {
    value: 'tailoring',
    label: 'Tailoring & Fashion Design',
    archetype: 'service',
    description: 'Custom sewing, alterations, and traditional attire',
    iconName: 'Needle',
    starterCategories: ['Custom Outfits', 'Alterations & Repairs', 'Traditional Wear', 'Fabric & Sewing'],
    defaultUnits: ['Piece', 'Outfit', 'Job', 'Alteration'],
  },
  {
    value: 'repair_mechanic',
    label: 'Repair & Auto Workshop',
    archetype: 'service',
    description: 'Vehicle maintenance, appliance repair, and electronics fixing',
    iconName: 'Wrench',
    starterCategories: ['Diagnostics & Inspection', 'Maintenance & Servicing', 'Parts Replacement', 'Labor'],
    defaultUnits: ['Job', 'Labor Hour', 'Service', 'Repair'],
  },
  {
    value: 'consulting_pro',
    label: 'Consulting & Professional Services',
    archetype: 'service',
    description: 'Legal, accounting, marketing, advisory, and tech services',
    iconName: 'Briefcase',
    starterCategories: ['Consultations', 'Retainers', 'Project Deliverables', 'Advisory'],
    defaultUnits: ['Hour', 'Project', 'Session', 'Retainer Month'],
  },
  {
    value: 'cleaning_laundry',
    label: 'Laundry & Cleaning Services',
    archetype: 'service',
    description: 'Dry cleaning, laundry wash, and residential/office cleaning',
    iconName: 'Sparkles',
    starterCategories: ['Wash & Iron', 'Dry Cleaning', 'Home Cleaning', 'Commercial Cleaning'],
    defaultUnits: ['Kg', 'Piece', 'Hour', 'Job', 'Visit'],
  },
  {
    value: 'services',
    label: 'General Services & Freelance',
    archetype: 'service',
    description: 'Freelance, contracting, and general service providers',
    iconName: 'Layers',
    starterCategories: ['Standard Services', 'Custom Projects', 'Hourly Work'],
    defaultUnits: ['Job', 'Hour', 'Project', 'Deliverable'],
  },
];

export function getBusinessArchetype(businessType?: string | null): BusinessArchetype {
  if (!businessType) return 'retail';
  const typeLower = businessType.toLowerCase().trim();

  // Food & Hospitality check
  if (
    typeLower.includes('restaurant') ||
    typeLower.includes('food') ||
    typeLower.includes('bar') ||
    typeLower.includes('bakery') ||
    typeLower.includes('cafe') ||
    typeLower.includes('chop') ||
    typeLower.includes('catering') ||
    typeLower.includes('eatery') ||
    typeLower.includes('kitchen') ||
    typeLower.includes('lounge') ||
    typeLower.includes('pub')
  ) {
    return 'food';
  }

  // Services check
  if (
    typeLower.includes('service') ||
    typeLower.includes('salon') ||
    typeLower.includes('barber') ||
    typeLower.includes('tailor') ||
    typeLower.includes('repair') ||
    typeLower.includes('mechanic') ||
    typeLower.includes('consult') ||
    typeLower.includes('clean') ||
    typeLower.includes('laundry') ||
    typeLower.includes('agency') ||
    typeLower.includes('freelance') ||
    typeLower.includes('tech') ||
    typeLower.includes('legal') ||
    typeLower.includes('account')
  ) {
    return 'service';
  }

  // Default to Retail & Goods
  return 'retail';
}

export interface ArchetypeConfig {
  archetype: BusinessArchetype;
  title: string;
  badge: string;
  tagline: string;
  itemsLabel: string;
  salesLabel: string;
  unitsLabel: string;
  metric1Title: string;
  metric1Period: string;
  metric2Title: string;
  metric2Period: string;
  metric3Title: string;
  metric3Period: string;
  metric4Title: string;
  metric4Period: string;
  quickActions: {
    title: string;
    description: string;
    route: string;
    icon: string;
  }[];
}

export const ARCHETYPE_CONFIGS: Record<BusinessArchetype, ArchetypeConfig> = {
  food: {
    archetype: 'food',
    title: 'Restaurant & Food Service',
    badge: '🍽️ Food & Hospitality',
    tagline: 'Streamlined for dishes, orders, table service, and kitchen stock',
    itemsLabel: 'Menu Dishes & Drinks',
    salesLabel: 'Meals & Orders Served',
    unitsLabel: 'Plates / Portions / Bottles',
    metric1Title: 'Food & Drink Revenue',
    metric1Period: 'from orders & dine-in',
    metric2Title: 'Meals & Orders Served',
    metric2Period: 'total orders fulfilled',
    metric3Title: 'Menu Items & Stock',
    metric3Period: 'dishes & ingredients',
    metric4Title: 'Pending Orders & Bills',
    metric4Period: 'awaiting payment/delivery',
    quickActions: [
      { title: 'Take Order', description: 'Record meal or drink sale', route: '/sales', icon: 'Utensils' },
      { title: 'Add Menu Dish', description: 'Create new dish or beverage', route: '/inventory', icon: 'PlusCircle' },
      { title: 'Bill / Invoice', description: 'Create food order invoice', route: '/invoices', icon: 'FileText' },
      { title: 'Regular Diners', description: 'Manage customer accounts', route: '/customers', icon: 'Users' },
    ],
  },
  retail: {
    archetype: 'retail',
    title: 'Provision Store & Retail',
    badge: '🛒 Retail & Provisions',
    tagline: 'Tailored for stock valuation, fast checkout, and reorder levels',
    itemsLabel: 'Products in Stock',
    salesLabel: 'Sales Transactions',
    unitsLabel: 'Pieces / Packs / Cartons',
    metric1Title: 'Total Sales Revenue',
    metric1Period: 'from store transactions',
    metric2Title: 'Active Shoppers',
    metric2Period: 'registered customers',
    metric3Title: 'Inventory Valuation',
    metric3Period: 'stock on shelves',
    metric4Title: 'Pending Store Credits',
    metric4Period: 'unpaid customer invoices',
    quickActions: [
      { title: 'Quick Sale', description: 'Ring up walk-in customer', route: '/sales', icon: 'TrendingUp' },
      { title: 'Add Product', description: 'Register new stock item', route: '/inventory', icon: 'Package' },
      { title: 'Customer Credit', description: 'Invoice / credit sale', route: '/invoices', icon: 'CreditCard' },
      { title: 'Restock Order', description: 'Record supplier delivery', route: '/suppliers', icon: 'Truck' },
    ],
  },
  service: {
    archetype: 'service',
    title: 'Services & Trades',
    badge: '💼 Services & Trades',
    tagline: 'Optimized for client bookings, service billings, and work milestones',
    itemsLabel: 'Service Offerings & Rates',
    salesLabel: 'Jobs & Appointments Done',
    unitsLabel: 'Sessions / Hours / Jobs',
    metric1Title: 'Total Service Revenue',
    metric1Period: 'collected fees & jobs',
    metric2Title: 'Jobs & Bookings Done',
    metric2Period: 'services completed',
    metric3Title: 'Active Clients',
    metric3Period: 'client roster & bookings',
    metric4Title: 'Outstanding Invoices',
    metric4Period: 'unsettled client bills',
    quickActions: [
      { title: 'Record Job / Sale', description: 'Log completed service', route: '/sales', icon: 'CheckCircle' },
      { title: 'Client Invoice', description: 'Bill client for services', route: '/invoices', icon: 'FileText' },
      { title: 'Add Client', description: 'Save client information', route: '/customers', icon: 'UserPlus' },
      { title: 'Add Service Rate', description: 'Create new service offering', route: '/inventory', icon: 'Briefcase' },
    ],
  },
};
