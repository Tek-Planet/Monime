export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in SLE (Sierra Leone Leones) or USD
  priceUSD: number;
  image: string;
  sizes: number[];
  colors: { name: string; hex: string; class: string }[];
  features: string[];
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
}

export interface Order {
  id: string;
  productId: string;
  size: number;
  color: string;
  quantity: number;
  totalAmount: number;
  currency: 'SLE' | 'USD';
  customer: CustomerDetails;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'monime_momo' | 'monime_card';
  momoProvider?: 'orange_money' | 'afrimoney';
  momoNumber?: string;
  txRef: string;
  createdAt: string;
}

export interface MonimePaymentResponse {
  status: 'success' | 'error';
  redirectUrl: string;
  txRef: string;
  message?: string;
}
