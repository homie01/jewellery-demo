export type Category = 'Rings' | 'Necklaces' | 'Earrings' | 'Bracelets' | 'Bangles';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  collection: 'Signature' | 'Everyday Heirlooms' | 'The Pearl Edit';
  material: '18K Gold' | 'Gold & Pearl' | 'Gold & Diamond';
  description: string;
  weight: string;
  stone: string;
  sizes: string[];
  available: boolean;
  isNew?: boolean;
  featured?: boolean;
}

export interface CartItem {
  key: string;
  productId: string;
  quantity: number;
  size: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CustomerSignUpData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'UPI' | 'Credit / Debit Card' | 'Cash on Delivery';

export interface Order {
  id: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending';
  status: OrderStatus;
  deliveryMethod: 'Standard' | 'Express';
  owner: string;
}

export interface DigitalCard {
  id: string;
  orderId: string;
  createdAt: string;
  expiresAt: string;
  status: 'Active' | 'Expired' | 'Revoked';
}

export interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  orderNotifications: boolean;
}