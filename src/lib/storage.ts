import { useCallback, useEffect, useState } from 'react';

export function readStorage<T>(key: string, fallback: T, storage?: Storage): T {
  try {
    const raw = (storage ?? window.localStorage).getItem(key);
    if (!raw) return fallback;
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(value)) return fallback;
    if (typeof value !== typeof fallback || value === null) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown, storage?: Storage) {
  try {
    (storage ?? window.localStorage).setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, initial));
  useEffect(() => { writeStorage(key, value); }, [key, value]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === key) setValue(readStorage(key, initial));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key, initial]);
  return [value, setValue] as const;
}

export const money = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(amount);

export const formatDate = (date: string, long = false) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: long ? 'long' : 'short', year: 'numeric',
}).format(new Date(date));

export function secureId(prefix: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export const cardUrl = (id: string) => new URL(`/card/${encodeURIComponent(id)}`, window.location.origin).href;

export function useClipboard() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      return true;
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const success = document.execCommand('copy');
      field.remove();
      setCopied(success);
      return success;
    }
  }, []);
  return { copied, copy };
}