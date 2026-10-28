export type Category = 'Bracelets' | 'Bangles' | 'Rings' | 'Necklaces' | 'Earrings';

export interface GemstoneDetails {
  stoneName: string; // e.g. "NATURAL YELLOW SAPPHIRE"
  indianTradeName: string; // e.g. "Pukhraj(Guru)"
  colour: string; // e.g. "Yellow"
  caratWeight: string; // e.g. "5.06ct"
  measurement: string; // e.g. "10.10x9.60x3.80mm"
  shapeCut: string; // e.g. "Oval Mix Cut"
  mounted: string; // e.g. "Mounted in Bracelet"
  refractiveIndex: string; // e.g. "1.76-1.77"
  specificGravity: string; // e.g. "3.96-4.05"
  hardness: string; // e.g. "9.00"
  uvTest: string; // e.g. "N.A"
  microscopicObs: string; // e.g. "Typical Of Sapphire"
  spectroscopicObs: string; // e.g. "Typical Of Natural"
  comment: string; // e.g. "N.A"
  specimenImage: string; // image of cut gemstone specimen
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  collection: 'Signature' | 'Everyday Heirlooms' | 'The Pearl Edit' | string;
  material: string;
  description: string;
  weight: string;
  stone: string;
  sizes: string[];
  available: boolean;
  isNew?: boolean;
  featured?: boolean;
  gemstoneDetails: GemstoneDetails;
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
  stone?: string;
  gemstoneDetails?: GemstoneDetails;
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
  productId?: string;
  gemstoneDetails?: GemstoneDetails;
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