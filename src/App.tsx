import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { CommerceProviders } from './contexts/CommerceContext';
import { UIProvider } from './contexts/UIContext';
import { AuthProvider } from './contexts/AuthContext';
import StoreLayout from './components/StoreLayout';
import { CartDrawer } from './components/CartDrawer';
import { QuickView } from './components/ProductCard';
import { Preloader, SmoothScroll } from './components/Motion';
import RouteMetadata from './components/RouteMetadata';
import { Toasts } from './components/ui';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Checkout, { CartPage } from './pages/Checkout';
import CustomerOrders, { OrderSuccess } from './pages/Orders';
import CustomerAuth from './pages/CustomerAuth';
import { About, Care, Journal, JournalArticle, NotFound } from './pages/Editorial';
import { CardLayout, CardVerification, InvalidCard, VerifiedCard } from './pages/DigitalCard';
import './styles/commerce.css';
import './styles/admin.css';
import './styles/cards.css';

const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Analytics = lazy(() => import('./pages/admin/Dashboard').then((module) => ({ default: module.Analytics })));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrders').then((module) => ({ default: module.AdminOrderDetails })));
const AdminCreateOrder = lazy(() => import('./pages/admin/AdminCreateOrder'));
const AdminCards = lazy(() => import('./pages/admin/AdminCards'));
const AdminCardDetails = lazy(() => import('./pages/admin/AdminCards').then((module) => ({ default: module.AdminCardDetails })));
const AdminProducts = lazy(() => import('./pages/admin/Workspace').then((module) => ({ default: module.AdminProducts })));
const AdminCustomers = lazy(() => import('./pages/admin/Workspace').then((module) => ({ default: module.AdminCustomers })));
const AdminSettings = lazy(() => import('./pages/admin/Workspace').then((module) => ({ default: module.AdminSettings })));

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Aurel application error', error, info.componentStack); }
  render() {
    if (this.state.failed) return <div className="empty-state"><div className="preloader-logo">AUREL.</div><h2>A little pause.</h2><p>Something interrupted your visit. Reload to return to your saved pieces and orders.</p><button className="button button-primary" onClick={() => window.location.reload()}>RELOAD THE ATELIER</button></div>;
    return this.props.children;
  }
}

function RouteFallback() { return <div className="route-loading" role="status"><span className="button-spinner" />Opening the atelier...</div>; }

export default function App() {
  return <AppErrorBoundary><BrowserRouter><MotionConfig reducedMotion="user"><UIProvider><AuthProvider><CommerceProviders><RouteMetadata /><SmoothScroll /><Preloader /><Suspense fallback={<RouteFallback />}><Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<Navigate to="/admin" replace />} />
      <Route path="home" element={<Home />} />
      <Route path="shop" element={<Shop />} />
      <Route path="product/:id" element={<Product />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="login" element={<CustomerAuth />} />
      <Route path="signup" element={<CustomerAuth />} />
      <Route path="account" element={<CustomerAuth />} />
      <Route path="order-success" element={<OrderSuccess />} />
      <Route path="orders" element={<CustomerOrders />} />
      <Route path="about" element={<About />} />
      <Route path="journal" element={<Journal />} />
      <Route path="journal/:slug" element={<JournalArticle />} />
      <Route path="care" element={<Care />} />
    </Route>
    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="login" element={<Dashboard />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="orders/new" element={<AdminCreateOrder />} />
      <Route path="orders/:id" element={<AdminOrderDetails />} />
      <Route path="cards" element={<AdminCards />} />
      <Route path="cards/:id" element={<AdminCardDetails />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="products" element={<AdminProducts />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="settings" element={<AdminSettings />} />
    </Route>
    <Route path="card/:cardId" element={<CardLayout />}>
      <Route index element={<CardVerification />} />
      <Route path="verify" element={<CardVerification />} />
      <Route path="verified" element={<VerifiedCard />} />
      <Route path="invalid" element={<InvalidCard />} />
    </Route>
    <Route element={<StoreLayout />}><Route path="*" element={<NotFound />} /></Route>
  </Routes></Suspense><CartDrawer /><QuickView /><Toasts /></CommerceProviders></AuthProvider></UIProvider></MotionConfig></BrowserRouter></AppErrorBoundary>;
}
