import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findProduct, products } from '../data/products';
import { defaultSettings, seedOrders } from '../data/demo';
import { readStorage, secureId, usePersistentState, writeStorage } from '../lib/storage';
import { demoOtpService } from '../services/demo';
import type { CartItem, Customer, DigitalCard, Order, OrderStatus, PaymentMethod, Product, StoreSettings } from '../types';

const emptyCart: CartItem[] = [];
const emptyStrings: string[] = [];
const emptyCards: DigitalCard[] = [];

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number, size?: string) => void;
  removeItem: (key: string) => void;
  increaseQuantity: (key: string) => void;
  decreaseQuantity: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [storedItems, setItems] = usePersistentState('aurel.cart.v1', emptyCart);
  const [wishlist, setWishlist] = usePersistentState('aurel.wishlist.v1', emptyStrings);
  const { catalog } = useStore();
  const items = useMemo(() => storedItems.filter((item) => findProduct(item.productId) && item.quantity > 0), [storedItems]);
  const addItem = useCallback((product: Product, quantity = 1, size = product.sizes[0]) => {
    if (!product.available) return;
    const key = `${product.id}:${size}`;
    setItems((current) => {
      const existing = current.find((item) => item.key === key);
      return existing
        ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item)
        : [...current, { key, productId: product.id, quantity: Math.min(10, Math.max(1, quantity)), size }];
    });
  }, [setItems]);
  const removeItem = useCallback((key: string) => setItems((current) => current.filter((item) => item.key !== key)), [setItems]);
  const increaseQuantity = useCallback((key: string) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item)), [setItems]);
  const decreaseQuantity = useCallback((key: string) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item)), [setItems]);
  const clearCart = useCallback(() => setItems([]), [setItems]);
  const toggleWishlist = useCallback((id: string) => setWishlist((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]), [setWishlist]);
  const value = useMemo(() => ({
    items, count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + (catalog.find((product) => product.id === item.productId)?.price ?? 0) * item.quantity, 0),
    addItem, removeItem, increaseQuantity, decreaseQuantity, clearCart, wishlist, toggleWishlist,
  }), [items, catalog, addItem, removeItem, increaseQuantity, decreaseQuantity, clearCart, wishlist, toggleWishlist]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

type NewOrder = { customer: Customer; items: CartItem[]; paymentMethod: PaymentMethod; deliveryMethod: 'Standard' | 'Express' };
interface OrderValue {
  orders: Order[];
  customerOrders: Order[];
  createOrder: (data: NewOrder) => Order;
  confirmOrder: (id: string) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
  markPaid: (id: string) => void;
}
const OrderContext = createContext<OrderValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = usePersistentState('aurel.orders.v1', seedOrders);
  const { catalog } = useStore();
  const createOrder = useCallback((data: NewOrder): Order => {
    if (data.items.length === 0) throw new Error('Please add a piece to your bag first.');
    const items = data.items.map((item) => {
      const product = catalog.find((entry) => entry.id === item.productId);
      if (!product || !product.available) throw new Error('A piece in your bag is no longer available.');
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Please choose a quantity between 1 and 10.');
      return { productId: product.id, name: product.name, image: product.image, price: product.price, quantity: item.quantity, size: item.size };
    });
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = data.deliveryMethod === 'Express' ? 499 : 0;
    const sequence = Math.max(125, ...orders.map((order) => Number(order.id.split('-').pop()) || 0)) + 1;
    const order: Order = {
      id: `ORD-${new Date().getFullYear()}-${String(sequence).padStart(5, '0')}`,
      customer: data.customer, items, subtotal, shipping, total: subtotal + shipping,
      date: new Date().toISOString(), paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      status: 'Pending', deliveryMethod: data.deliveryMethod, owner: 'customer',
    };
    setOrders((current) => [order, ...current]);
    writeStorage('aurel.latestOrder', order.id);
    return order;
  }, [orders, catalog, setOrders]);
  const updateStatus = useCallback((id: string, status: OrderStatus) => setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order)), [setOrders]);
  const confirmOrder = useCallback((id: string) => updateStatus(id, 'Confirmed'), [updateStatus]);
  const markPaid = useCallback((id: string) => setOrders((current) => current.map((order) => order.id === id ? { ...order, paymentStatus: 'Paid' } : order)), [setOrders]);
  const value = useMemo(() => ({ orders, customerOrders: orders.filter((order) => order.owner === 'customer'), createOrder, confirmOrder, updateStatus, markPaid }), [orders, createOrder, confirmOrder, updateStatus, markPaid]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function getCardStatus(card: DigitalCard) {
  const expires = new Date(card.expiresAt).getTime();
  return card.status === 'Active' && (!Number.isFinite(expires) || expires <= Date.now()) ? 'Expired' : card.status;
}

interface CardValue {
  cards: DigitalCard[];
  generateCard: (orderId: string) => DigitalCard;
  regenerateCard: (id: string) => DigitalCard | null;
  verifyCard: (id: string, code: string) => Promise<boolean>;
  isVerified: (id: string) => boolean;
  revokeCard: (id: string) => void;
  lockCard: (id: string) => void;
}
const CardContext = createContext<CardValue | null>(null);

export function CardProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = usePersistentState('aurel.cards.v1', emptyCards);
  const [verified, setVerified] = useState<Record<string, number>>(() => readStorage('aurel.verified.v1', {}, sessionStorage));
  const { orders } = useOrders();
  useEffect(() => {
    const cancelled = new Set(orders.filter((order) => order.status === 'Cancelled').map((order) => order.id));
    if (cards.some((card) => card.status === 'Active' && cancelled.has(card.orderId))) {
      setCards((current) => current.map((card) => cancelled.has(card.orderId) ? { ...card, status: 'Revoked' } : card));
    }
  }, [orders, cards, setCards]);

  const makeCard = useCallback((orderId: string): DigitalCard => ({
    id: secureId('CARD'), orderId, createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), status: 'Active',
  }), []);

  // Automatically generate digital business card once an order is confirmed
  useEffect(() => {
    const confirmedOrders = orders.filter((order) => order.status !== 'Pending' && order.status !== 'Cancelled');
    const missing = confirmedOrders.filter((order) => !cards.some((card) => card.orderId === order.id && getCardStatus(card) === 'Active'));

    if (missing.length > 0) {
      const newCards = missing.map((order) => makeCard(order.id));
      setCards((current) => [...newCards, ...current]);
    }
  }, [orders, cards, setCards, makeCard]);

  const generateCard = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status === 'Pending' || order.status === 'Cancelled') throw new Error('Confirm the order before creating a digital card.');
    const existing = cards.find((card) => card.orderId === orderId && getCardStatus(card) === 'Active');
    if (existing) return existing;
    const card = makeCard(orderId);
    setCards((current) => [card, ...current]);
    return card;
  };
  const lockCard = (id: string) => {
    setVerified((current) => {
      const next = { ...current };
      delete next[id];
      writeStorage('aurel.verified.v1', next, sessionStorage);
      return next;
    });
  };
  const revokeCard = (id: string) => {
    setCards((current) => current.map((card) => card.id === id ? { ...card, status: 'Revoked' } : card));
    lockCard(id);
  };
  const regenerateCard = (id: string) => {
    const old = cards.find((card) => card.id === id);
    if (!old || getCardStatus(old) !== 'Active') return null;
    if (!orders.some((order) => order.id === old.orderId && order.status !== 'Cancelled' && order.status !== 'Pending')) return null;
    const next = makeCard(old.orderId);
    setCards((current) => [next, ...current.map((card) => card.id === id ? { ...card, status: 'Revoked' as const } : card)]);
    lockCard(id);
    return next;
  };
  const verifyCard = async (id: string, code: string) => {
    if (!await demoOtpService.verify(id, code)) return false;
    setCards((current) => {
      if (current.some((item) => item.id === id)) return current;
      const newCard: DigitalCard = {
        id,
        orderId: `ORD-${id}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
        status: 'Active',
      };
      return [newCard, ...current];
    });
    const next = { ...verified, [id]: Date.now() + 10 * 60000 };
    writeStorage('aurel.verified.v1', next, sessionStorage);
    setVerified(next);
    return true;
  };
  const isVerified = (id: string) => Boolean(verified[id] && verified[id] > Date.now());
  return <CardContext.Provider value={{ cards, generateCard, regenerateCard, verifyCard, isVerified, revokeCard, lockCard }}>{children}</CardContext.Provider>;
}

interface StoreValue {
  settings: StoreSettings;
  saveSettings: (settings: StoreSettings) => void;
  catalog: Product[];
  updateProduct: (product: Product) => void;
}
const StoreContext = createContext<StoreValue | null>(null);
const emptyOverrides: Record<string, Partial<Product>> = {};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, saveSettings] = usePersistentState('aurel.settings.v1', defaultSettings);
  const [overrides, setOverrides] = usePersistentState('aurel.products.v1', emptyOverrides);
  const catalog = useMemo(() => products.map((product) => ({ ...product, ...overrides[product.id] })), [overrides]);
  const updateProduct = (product: Product) => setOverrides((current) => ({ ...current, [product.id]: product }));
  return <StoreContext.Provider value={{ settings, saveSettings, catalog, updateProduct }}>{children}</StoreContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error('CartProvider is required'); return context; }
export function useOrders() { const context = useContext(OrderContext); if (!context) throw new Error('OrderProvider is required'); return context; }
export function useCards() { const context = useContext(CardContext); if (!context) throw new Error('CardProvider is required'); return context; }
export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error('StoreProvider is required'); return context; }

export function CommerceProviders({ children }: { children: ReactNode }) {
  return <StoreProvider><CartProvider><OrderProvider><CardProvider>{children}</CardProvider></OrderProvider></CartProvider></StoreProvider>;
}