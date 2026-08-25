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
    starterCategories: ['Main Dishes', 'Sides & Extras', 'Drinks & Beverages', 'Appetizers & Starters', 'Specials & Combos', 'Desserts', 'Kitchen Ingredients'],
    defaultUnits: ['Plate', 'Portion', 'Bowl', 'Cup', 'Bottle', 'Order', 'Serving'],
  },
  {
    value: 'chop_bar',
    label: 'Chop Bar / Local Cookery',
    archetype: 'food',
    description: 'Local dishes, cookeries, and food stalls',
    iconName: 'Soup',
    starterCategories: ['Cookery Dishes', 'Soups & Stews', 'Rice & Starches', 'Soft Drinks & Juices', 'Local Meats & Fish', 'Specials'],
    defaultUnits: ['Plate', 'Bowl', 'Cup', 'Wrap', 'Piece', 'Portion'],
  },
  {
    value: 'bakery',
    label: 'Bakery & Pastry',
    archetype: 'food',
    description: 'Fresh bread, cakes, pastries, and snacks',
    iconName: 'Cake',
    starterCategories: ['Bread & Loaves', 'Cakes & Pastries', 'Pies & Snacks', 'Hot Beverages', 'Baking Ingredients & Flour'],
    defaultUnits: ['Loaf', 'Piece', 'Box', 'Pack', 'Slice', 'Dozen'],
  },
  {
    value: 'cafe',
    label: 'Cafe & Coffee Shop',
    archetype: 'food',
    description: 'Coffee, tea, breakfast, and light bites',
    iconName: 'Coffee',
    starterCategories: ['Hot Coffees & Teas', 'Iced & Cold Drinks', 'Breakfast & Sandwiches', 'Pastries & Desserts', 'Snacks'],
    defaultUnits: ['Cup', 'Glass', 'Serving', 'Piece', 'Order'],
  },
  {
    value: 'bar_lounge',
    label: 'Bar, Pub & Lounge',
    archetype: 'food',
    description: 'Drinks, cocktails, beers, and lounge food',
    iconName: 'Wine',
    starterCategories: ['Beers & Ciders', 'Spirits & Whiskeys', 'Cocktails & Wine', 'Energy & Soft Drinks', 'Bar Bites & Grills'],
    defaultUnits: ['Bottle', 'Glass', 'Can', 'Shot', 'Plate', 'Crate'],
  },
  {
    value: 'catering',
    label: 'Catering & Events Food',
    archetype: 'food',
    description: 'Event catering, party trays, and bulk meal prep',
    iconName: 'PartyPopper',
    starterCategories: ['Buffet Menus', 'Party Trays & Platters', 'Custom Packages', 'Event Drinks', 'Event Supplies'],
    defaultUnits: ['Tray', 'Pax', 'Platter', 'Package', 'Pot', 'Plate'],
  },

  // Retail & Goods
  {
    value: 'provision_store',
    label: 'Provision Store / Kiosk',
    archetype: 'retail',
    description: 'Groceries, household items, toiletries, and daily provisions',
    iconName: 'Store',
    starterCategories: ['Foodstuffs & Grains', 'Cooking Oil & Spices', 'Beverages & Milk', 'Toiletries & Soaps', 'Snacks & Sweets', 'Household Essentials'],
    defaultUnits: ['Piece', 'Pack', 'Carton', 'Bag', 'Bottle', 'Cup', 'Sachet'],
  },
  {
    value: 'supermarket',
    label: 'Supermarket / Grocery Mart',
    archetype: 'retail',
    description: 'Packaged foods, frozen items, home essentials, and goods',
    iconName: 'ShoppingCart',
    starterCategories: ['Packaged Foods', 'Dairy, Milk & Eggs', 'Beverages & Juices', 'Frozen Foods & Meat', 'Personal Care', 'Cleaning & Household', 'Bakery & Snacks'],
    defaultUnits: ['Item', 'Pack', 'Box', 'Kg', 'Litre', 'Bottle', 'Carton'],
  },
  {
    value: 'clothing',
    label: 'Boutique & Fashion',
    archetype: 'retail',
    description: 'Apparel, shoes, bags, jewelry, and accessories',
    iconName: 'Shirt',
    starterCategories: ['Men\'s Wear', 'Women\'s Wear', 'Children & Baby Wear', 'Shoes & Footwear', 'Bags & Luggage', 'Jewelry & Accessories', 'Underwear & Nightwear'],
    defaultUnits: ['Piece', 'Pair', 'Set', 'Bundle'],
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy & Chemist',
    archetype: 'retail',
    description: 'Prescription medicines, OTC drugs, and healthcare products',
    iconName: 'Pill',
    starterCategories: ['OTC Pain & Cold', 'Prescription Drugs', 'Vitamins & Supplements', 'First Aid & Bandages', 'Baby Care & Formula', 'Personal Hygiene', 'Medical Supplies'],
    defaultUnits: ['Strip', 'Bottle', 'Box', 'Sachet', 'Unit', 'Pack', 'Tube'],
  },
  {
    value: 'electronics',
    label: 'Electronics & Phones',
    archetype: 'retail',
    description: 'Mobile phones, accessories, gadgets, and electronics',
    iconName: 'Smartphone',
    starterCategories: [
      'Phones & Devices',
      'Phone Accessories & Cases',
      'Cables, Chargers & Adapters',
      'Audio, Headphones & Speakers',
      'Computers & Laptops',
      'Power Banks & Batteries',
      'Smart Home & Gadgets',
      'Screen Protectors & Covers',
      'Spare Parts & Tools'
    ],
    defaultUnits: ['Piece', 'Unit', 'Box', 'Set', 'Pack', 'Pair'],
  },
  {
    value: 'retail',
    label: 'General Retail Store',
    archetype: 'retail',
    description: 'General merchandise, goods, and consumer products',
    iconName: 'ShoppingBag',
    starterCategories: ['Fast Moving Goods', 'General Merchandise', 'Home & Living', 'Hardware & Tools', 'Stationery & Books', 'Toys & Gifts'],
    defaultUnits: ['Piece', 'Pack', 'Box', 'Unit', 'Set'],
  },
  {
    value: 'wholesale',
    label: 'Wholesale & Bulk Distributor',
    archetype: 'retail',
    description: 'Bulk goods, warehouse supply, and distributor inventory',
    iconName: 'Truck',
    starterCategories: ['Bulk Foodstuffs & Rice', 'Carton Beverages & Water', 'Bulk Cooking Oils & Sugar', 'Household Bundles', 'Wholesale Packs'],
    defaultUnits: ['Carton', 'Bag (50kg)', 'Bundle', 'Crate', 'Pallet', 'Pack'],
  },

  // Services & Trades
  {
    value: 'salon_barber',
    label: 'Beauty Salon & Barbershop',
    archetype: 'service',
    description: 'Haircuts, braiding, styling, grooming, and spa services',
    iconName: 'Scissors',
    starterCategories: ['Haircuts & Styling', 'Braiding & Extensions', 'Nails & Pedicure', 'Spa & Facial Treatments', 'Hair Care Products', 'Grooming Cosmetics'],
    defaultUnits: ['Session', 'Service', 'Hour', 'Treatment', 'Unit'],
  },
  {
    value: 'tailoring',
    label: 'Tailoring & Fashion Design',
    archetype: 'service',
    description: 'Custom sewing, alterations, and traditional attire',
    iconName: 'Needle',
    starterCategories: ['Custom Outfits', 'Traditional & Native Wear', 'Alterations & Repairs', 'Suits & Formal Wear', 'Fabrics & Textiles', 'Sewing Materials'],
    defaultUnits: ['Piece', 'Outfit', 'Job', 'Alteration', 'Yard'],
  },
  {
    value: 'repair_mechanic',
    label: 'Repair & Auto Workshop',
    archetype: 'service',
    description: 'Vehicle maintenance, appliance repair, and electronics fixing',
    iconName: 'Wrench',
    starterCategories: ['Diagnostics & Inspection', 'Routine Servicing & Oil', 'Brakes & Suspension', 'Engine & Transmission', 'Electrical & Battery', 'Spare Parts', 'Labor Charges'],
    defaultUnits: ['Job', 'Labor Hour', 'Service', 'Repair', 'Part'],
  },
  {
    value: 'consulting_pro',
    label: 'Consulting & Professional Services',
    archetype: 'service',
    description: 'Legal, accounting, marketing, advisory, and tech services',
    iconName: 'Briefcase',
    starterCategories: ['Consultation Sessions', 'Monthly Retainers', 'Project Deliverables', 'Document Review', 'Advisory & Strategy', 'Training & Workshops'],
    defaultUnits: ['Hour', 'Project', 'Session', 'Retainer Month', 'Document'],
  },
  {
    value: 'cleaning_laundry',
    label: 'Laundry & Cleaning Services',
    archetype: 'service',
    description: 'Dry cleaning, laundry wash, and residential/office cleaning',
    iconName: 'Sparkles',
    starterCategories: ['Wash & Fold / Iron', 'Dry Cleaning', 'Home Cleaning Service', 'Office & Commercial Cleaning', 'Carpet & Upholstery', 'Cleaning Supplies'],
    defaultUnits: ['Kg', 'Piece', 'Hour', 'Job', 'Visit', 'Room'],
  },
  {
    value: 'services',
    label: 'General Services & Freelance',
    archetype: 'service',
    description: 'Freelance, contracting, and general service providers',
    iconName: 'Layers',
    starterCategories: ['Standard Services', 'Custom Projects', 'Hourly Work', 'Consultations', 'Repairs & Maintenance', 'Special Packages'],
    defaultUnits: ['Job', 'Hour', 'Project', 'Deliverable', 'Day'],
  },
];

export function getBusinessTypeOption(businessType?: string | null): BusinessTypeOption | undefined {
  if (!businessType) return undefined;
  return BUSINESS_TYPES.find(b => b.value === businessType || b.value.toLowerCase() === businessType.toLowerCase());
}

export function getCategoriesForBusinessType(
  businessType?: string | null,
  existingCategories: (string | null | undefined)[] = []
): string[] {
  let baseCategories: string[] = [];

  const foundType = getBusinessTypeOption(businessType);
  if (foundType && foundType.starterCategories && foundType.starterCategories.length > 0) {
    baseCategories = [...foundType.starterCategories];
  } else {
    // Check archetype fallback
    const archetype = getBusinessArchetype(businessType);
    if (archetype === 'food') {
      baseCategories = ['Main Dishes', 'Sides & Extras', 'Drinks & Beverages', 'Appetizers & Starters', 'Specials', 'Desserts', 'Kitchen Stock'];
    } else if (archetype === 'service') {
      baseCategories = ['Standard Services', 'Custom Projects', 'Hourly Work', 'Consultations', 'Materials & Supplies'];
    } else {
      baseCategories = ['General Goods', 'Fast Moving Items', 'Specialty Items', 'Accessories', 'Household'];
    }
  }

  // Extract clean unique categories from existing inventory
  const cleanExisting = existingCategories
    .filter((cat): cat is string => typeof cat === 'string' && cat.trim().length > 0)
    .map(c => c.trim());

  // Merge presets with existing categories and append 'Other'
  const set = new Set<string>();
  
  // Prioritize existing categories already in use
  cleanExisting.forEach(c => set.add(c));
  // Then add base preset categories
  baseCategories.forEach(c => set.add(c));
  // Always provide 'Other'
  set.add('Other');

  return Array.from(set);
}

export function getUnitsForBusinessType(businessType?: string | null): string[] {
  const foundType = getBusinessTypeOption(businessType);
  if (foundType && foundType.defaultUnits && foundType.defaultUnits.length > 0) {
    return [...foundType.defaultUnits, 'Piece', 'Other'];
  }
  const archetype = getBusinessArchetype(businessType);
  if (archetype === 'food') {
    return ['Plate', 'Portion', 'Bowl', 'Cup', 'Bottle', 'Order', 'Serving', 'Piece', 'Other'];
  }
  if (archetype === 'service') {
    return ['Job', 'Session', 'Hour', 'Service', 'Project', 'Day', 'Visit', 'Other'];
  }
  return ['Piece', 'Unit', 'Pack', 'Box', 'Carton', 'Bag', 'Set', 'Kg', 'Litre', 'Other'];
}

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
