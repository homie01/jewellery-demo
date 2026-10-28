import { products } from './products';
import type { Order, OrderStatus, StoreSettings } from '../types';

const buyers = [
  { name: 'Bhaveshbhai soni', email: 'bhavesh.soni@example.com', city: 'Surat', state: 'Gujarat', address: '14, Mahavir Gem Complex, Mahidharpura', pincode: '395003', phone: '+91 98251 45678' },
  { name: 'Ananya Sharma', email: 'ananya@example.com', city: 'Mumbai', state: 'Maharashtra', address: '18, Sea View Apartments, Bandra', pincode: '400050', phone: '+91 98201 23456' },
  { name: 'Rahul Patel', email: 'rahul@example.com', city: 'Surat', state: 'Gujarat', address: '24, Riverfront Residences, Adajan', pincode: '395009', phone: '+91 98765 43210' },
];

export const seedOrders: Order[] = buyers.map((customer, index) => {
  const product = products[index];
  const date = new Date();
  date.setDate(date.getDate() - index * 3);
  const statuses: OrderStatus[] = ['Confirmed', 'Processing', 'Pending'];
  return {
    id: `ORD-${date.getFullYear()}-${String(125 - index).padStart(5, '0')}`,
    customer,
    items: [{
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      size: product.sizes[0],
      stone: product.stone,
      gemstoneDetails: product.gemstoneDetails,
    }],
    subtotal: product.price,
    shipping: 0,
    total: product.price,
    date: date.toISOString(),
    paymentMethod: index % 2 === 0 ? 'UPI' : 'Credit / Debit Card',
    paymentStatus: index === 2 ? 'Pending' : 'Paid',
    status: statuses[index],
    deliveryMethod: 'Standard',
    owner: 'seed',
  };
});

export const defaultSettings: StoreSettings = {
  name: 'AUREL Fine Gems & Jewellery',
  email: 'care@aurel-jewellery.com',
  phone: '+91 261 555 0188',
  address: 'The Aurel Atelier, Ghod Dod Road, Surat, Gujarat 395007',
  orderNotifications: true,
};