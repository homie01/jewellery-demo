import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Product } from '../types';

interface Toast { id: number; message: string; }
interface UIValue {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  quickView: Product | null;
  setQuickView: (product: Product | null) => void;
  toasts: Toast[];
  toast: (message: string) => void;
  dismissToast: (id: number) => void;
}
const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  const dismissToast = useCallback((id: number) => setToasts((current) => current.filter((item) => item.id !== id)), []);
  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message }]);
    timers.current.push(window.setTimeout(() => dismissToast(id), 4200));
  }, [dismissToast]);
  return <UIContext.Provider value={{ cartOpen, setCartOpen, quickView, setQuickView, toasts, toast, dismissToast }}>{children}</UIContext.Provider>;
}

export function useUI() { const context = useContext(UIContext); if (!context) throw new Error('UIProvider is required'); return context; }