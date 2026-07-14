// Format category values to be more user-friendly
export function formatCategory(category: string | null | undefined): string {
  if (!category) return "";

  const categoryMap: Record<string, string> = {
    food_beverages: "Food & Beverages",
    electronics: "Electronics",
    clothing: "Clothing & Textiles",
    household: "Household Items",
    beauty_personal: "Beauty & Personal Care",
    stationery: "Stationery & Office",
    hardware: "Hardware & Tools",
    pharmaceuticals: "Pharmaceuticals",
    transportation: "Transportation",
    services: "Services",
    other: "Other",
    // Expense categories
    office_supplies: "Office Supplies",
    marketing: "Marketing",
    travel: "Travel",
    utilities: "Utilities",
    equipment: "Equipment",
    professional_services: "Professional Services",
    inventory: "Inventory",
    maintenance: "Maintenance",
    insurance: "Insurance",
  };

  return categoryMap[category] || category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export const SUPPLIER_CATEGORIES = [
  { value: "food_beverages", label: "Food & Beverages" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing & Textiles" },
  { value: "household", label: "Household Items" },
  { value: "beauty_personal", label: "Beauty & Personal Care" },
  { value: "stationery", label: "Stationery & Office" },
  { value: "hardware", label: "Hardware & Tools" },
  { value: "pharmaceuticals", label: "Pharmaceuticals" },
  { value: "transportation", label: "Transportation" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES = [
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Marketing", label: "Marketing" },
  { value: "Travel", label: "Travel" },
  { value: "Utilities", label: "Utilities" },
  { value: "Equipment", label: "Equipment" },
  { value: "Professional Services", label: "Professional Services" },
  { value: "Inventory", label: "Inventory" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Insurance", label: "Insurance" },
  { value: "Other", label: "Other" },
];
