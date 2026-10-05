import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Bell, ChartNoAxesCombined, ChevronRight, CreditCard, Gem, LayoutDashboard, LockKeyhole, LogOut, Menu, Search, Settings, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders, useStore } from '../../contexts/CommerceContext';
import { useUI } from '../../contexts/UIContext';
import { Button, Field, Logo, Modal } from '../ui';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/products', label: 'Products', icon: Gem },
  { to: '/admin/cards', label: 'Digital Cards', icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { toast } = useUI();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    if (await signIn(email, password)) toast('Welcome back to the atelier.');
    else { setError('Those details do not match. Please use the demo credentials below.'); setLoading(false); }
  };
  return <div className="admin-login"><div className="admin-login-image"><img src="/images/aurel-hero.jpg" alt="Aurel fine gold jewellery" /><div><p className="eyebrow">BEHIND EVERY BEAUTIFUL PIECE</p><h2>A little intention.<br /><em>A lot of care.</em></h2></div></div><div className="admin-login-content"><Logo /><div className="admin-login-form"><p className="eyebrow">THE AUREL ATELIER</p><h1>Welcome <em>back.</em></h1><p>A thoughtful space to manage your world.</p><form onSubmit={submit}><Field label="Email address" type="email" autoComplete="username" placeholder="admin@jewellerydemo.com" required value={email} onChange={(event) => setEmail(event.target.value)} /><Field label="Password" type="password" autoComplete="current-password" placeholder="Your atelier password" required value={password} onChange={(event) => setPassword(event.target.value)} />{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" loading={loading}>{loading ? 'OPENING THE ATELIER...' : 'ENTER THE ATELIER'}<ArrowRight size={16} /></Button></form><div className="demo-credentials"><div><LockKeyhole size={15} /><span>DEMO WORKSPACE</span></div><p>Email: <strong>admin@jewellerydemo.com</strong><br />Password: <strong>admin123</strong></p><button onClick={() => { setEmail('admin@jewellerydemo.com'); setPassword('admin123'); }}>USE DEMO CREDENTIALS <ArrowRight size={13} /></button><small>Client-side demonstration only. Not a secure production login.</small></div></div><Link to="/" className="text-link">BACK TO THE STOREFRONT <ArrowUpRight size={14} /></Link></div></div>;
}

function SidebarContent({ close }: { close?: () => void }) {
  const { orders } = useOrders();
  const { signOut } = useAuth();
  const pending = orders.filter((order) => order.status === 'Pending').length;
  return <><div className="admin-brand"><Logo /><span>THE ATELIER</span></div><p className="admin-nav-label">WORKSPACE</p><nav aria-label="Admin navigation">{adminLinks.map(({ to, label, icon: Icon }) => <NavLink to={to} end={to === '/admin'} onClick={close} key={to} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={17} strokeWidth={1.45} /><span>{label}</span>{label === 'Orders' && pending > 0 && <small>{pending}</small>}</NavLink>)}</nav><div className="admin-sidebar-bottom"><Link to="/" onClick={close}><ArrowUpRight size={16} /> Visit the storefront</Link><button onClick={() => { close?.(); signOut(); }}><LogOut size={15} /> Sign out</button><p><span /> FRONTEND DEMO WORKSPACE</p></div></>;
}

export default function AdminLayout() {
  const { authenticated } = useAuth();
  const { orders } = useOrders();
  const { settings } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  if (!authenticated) return <AdminLogin />;
  const active = adminLinks.filter((link) => link.to !== '/admin' && location.pathname.startsWith(link.to))[0]?.label ?? 'Dashboard';
  const pendingOrders = orders.filter((order) => order.status === 'Pending');
  return <div className="admin-shell"><a className="skip-link" href="#admin-content">Skip to workspace</a><aside className="admin-sidebar"><SidebarContent /></aside><div className="admin-main"><header className="admin-topbar"><div><button className="admin-mobile-menu icon-button" aria-label="Open admin menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="admin-topbar-home">Workspace</span><ChevronRight size={12} /><span>{active}</span></div><div className="admin-topbar-actions"><form onSubmit={(event) => { event.preventDefault(); navigate(`/admin/orders?q=${encodeURIComponent(search)}`); }} className="admin-global-search"><Search size={16} strokeWidth={1.4} /><input placeholder="Search orders, customers..." aria-label="Search admin orders" value={search} onChange={(event) => setSearch(event.target.value)} /></form><button className="icon-button notification-trigger" onClick={() => setNotifications(true)} aria-label={`Notifications, ${pendingOrders.length} orders awaiting confirmation`}><Bell size={18} strokeWidth={1.4} />{settings.orderNotifications && pendingOrders.length > 0 && <span />}</button><Link to="/admin/settings" className="admin-profile" aria-label="Admin profile settings"><span>AA</span><div>Atelier Admin<small>Store owner</small></div></Link></div></header><main id="admin-content" className="admin-content"><Outlet /></main><footer className="admin-footer"><span>AUREL / THE ATELIER</span><p>Thoughtfully managed. Beautifully delivered.</p><span>LOCAL DEMO</span></footer></div><Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="The atelier" className="admin-mobile-modal" drawer><div className="admin-mobile-sidebar"><SidebarContent close={() => setMobileOpen(false)} /></div></Modal><Modal open={notifications} onClose={() => setNotifications(false)} title="Atelier updates"><div className="admin-notifications">{pendingOrders.length ? <><p>{pendingOrders.length} {pendingOrders.length === 1 ? 'piece of good news needs' : 'pieces of good news need'} your attention.</p>{pendingOrders.map((order) => <Link key={order.id} to={`/admin/orders/${order.id}`} onClick={() => setNotifications(false)}><ShoppingBag size={19} strokeWidth={1.2} /><div><strong>{order.customer.name} placed an order</strong><span>{order.id} / Awaiting confirmation</span></div><ArrowRight size={16} /></Link>)}</> : <p>You're all caught up. A lovely place to be.</p>}</div></Modal></div>;
}