import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../contexts/CommerceContext';

const titles: Record<string, string> = {
  '/': 'Jewellery for a life well lived',
  '/shop': 'The Collection',
  '/cart': 'Your Bag',
  '/checkout': 'A Beautiful Beginning',
  '/orders': 'Your Orders',
  '/order-success': 'Your Order Is Confirmed',
  '/about': 'The World of Aurel',
  '/journal': 'The Aurel Journal',
  '/care': 'Here for You',
};

export default function RouteMetadata() {
  const { pathname } = useLocation();
  const { catalog } = useStore();
  const product = pathname.startsWith('/product/') ? catalog.find((item) => item.id === pathname.split('/')[2]) : null;
  const title = product?.name ?? (pathname.startsWith('/admin') ? 'The Atelier' : pathname.startsWith('/card/') ? 'Protected Digital Purchase Card' : titles[pathname] ?? 'Notes from Our World');
  useEffect(() => { document.title = `AUREL | ${title}`; }, [title]);
  return <span className="sr-only" role="status" aria-live="polite">{title}</span>;
}