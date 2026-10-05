import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, LogIn, LogOut, Package, ShieldCheck, UserCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrders } from '../contexts/CommerceContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, money, readStorage } from '../lib/storage';
import { Badge, ButtonLink, EmptyState, SuccessMark } from '../components/ui';
import type { Order } from '../types';

export function OrderSuccess() {
  const [params] = useSearchParams();
  const { orders } = useOrders();
  const id = params.get('order') ?? readStorage('aurel.latestOrder', '');
  const order = orders.find((entry) => entry.id === id && entry.owner === 'customer');
  if (!order) return <EmptyState title="Your next chapter is waiting." description="Place an order to begin your Aurel story."><ButtonLink to="/shop">EXPLORE THE COLLECTION</ButtonLink></EmptyState>;
  return <div className="order-success-page"><SuccessMark /><p className="eyebrow">YOUR ORDER IS CONFIRMED</p><h1>A beautiful choice.<br /><em>A new story.</em></h1><p className="success-description">Thank you, {order.customer.name.split(' ')[0]}. We're delighted to be a part of yours.</p><div className="success-order"><div className="success-order-heading"><span>ORDER {order.id}</span><span>{formatDate(order.date)}</span></div>{order.items.map((item, index) => <div className="success-product" key={`${item.productId}-${index}`}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>Size {item.size} / Quantity {item.quantity}</p></div><span>{money(item.price * item.quantity)}</span></div>)}<div className="success-details"><div><p>DELIVERING TO</p><span>{order.customer.name}<br />{order.customer.address}<br />{order.customer.city}, {order.customer.state} {order.customer.pincode}</span></div><div><p>PAYMENT</p><span>{order.paymentMethod}</span><Badge status={order.paymentStatus} /><p className="success-amount">TOTAL <strong>{money(order.total)}</strong></p></div></div><p className="success-delivery"><Package size={15} strokeWidth={1.2} />Estimated delivery: {order.deliveryMethod === 'Express' ? '2-3' : '5-7'} business days</p></div><div className="success-actions"><ButtonLink to={`/orders?order=${order.id}`} variant="outline">VIEW YOUR ORDER</ButtonLink><ButtonLink to="/shop">CONTINUE EXPLORING <ArrowRight size={15} /></ButtonLink></div><div className="workflow-note"><ShieldCheck size={21} strokeWidth={1.1} /><p>A lasting record of something precious.<span>Your digital purchase card with QR code is created once our atelier confirms your order.</span></p><Link to={`/admin/orders/${order.id}`}>TRY THE ADMIN WORKFLOW <ArrowRight size={13} /></Link></div></div>;
}

function CustomerOrder({ order, defaultOpen }: { order: Order; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const stages = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  return <article className="customer-order"><button className="customer-order-heading" onClick={() => setOpen(!open)} aria-expanded={open}><div><span className="eyebrow">{order.id}</span><p>Placed on {formatDate(order.date)}</p></div><Badge status={order.status} /><span className="order-total">{money(order.total)}</span><ChevronDown size={18} className={open ? 'rotated' : ''} /></button><div className="customer-order-preview">{order.items.map((item, index) => <Link to={`/product/${item.productId}`} key={`${item.productId}-${index}`}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><span>Quantity {item.quantity} / Size {item.size}</span></div></Link>)}</div><AnimatePresence initial={false}>{open && <motion.div className="customer-order-expanded" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="order-progress" aria-label={`Order status: ${order.status}`}>{stages.map((stage, index) => <div key={stage} className={index <= stages.indexOf(order.status) ? 'completed' : ''}><span /><p>{stage === 'Pending' ? 'Placed' : stage}</p></div>)}</div><div className="customer-order-details"><div><p className="eyebrow">DELIVERY DETAILS</p><p>{order.customer.name}<br />{order.customer.address}<br />{order.customer.city}, {order.customer.state} {order.customer.pincode}</p></div><div><p className="eyebrow">PAYMENT DETAILS</p><p>{order.paymentMethod}</p><Badge status={order.paymentStatus} /></div></div></motion.div>}</AnimatePresence></article>;
}

export default function CustomerOrders() {
  const { customerOrders } = useOrders();
  const { customerUser, customerSignOut } = useAuth();
  const [params] = useSearchParams();

  return (
    <div className="commerce-page orders-page">
      <div className="breadcrumbs"><Link to="/">HOME</Link><span>/</span><span>MY ORDERS</span></div>

      <div className="commerce-title">
        <p className="eyebrow">YOUR AUREL STORY</p>
        <h1>My <em>orders.</em></h1>
        <p>Your orders, their journeys, and the pieces that become part of you.</p>
      </div>

      <div className="checkout-customer-bar">
        {customerUser ? (
          <>
            <div className="customer-info">
              <UserCheck size={18} />
              <span>Signed in as <strong>{customerUser.name}</strong> ({customerUser.email})</span>
            </div>
            <button
              type="button"
              className="text-link flex items-center gap-1 text-xs"
              onClick={() => {
                customerSignOut();
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </>
        ) : (
          <>
            <div className="customer-info">
              <span>Sign in to save your account profile and access past orders easily.</span>
            </div>
            <ButtonLink to="/login" variant="outline" className="text-xs py-1.5 px-3">
              <LogIn size={13} /> SIGN IN / SIGN UP
            </ButtonLink>
          </>
        )}
      </div>

      {customerOrders.length ? (
        <div className="customer-orders">{customerOrders.map((order, index) => <CustomerOrder key={order.id} order={order} defaultOpen={params.get('order') === order.id || index === 0} />)}</div>
      ) : (
        <EmptyState title="Every story has a beginning." description="Your orders will appear here after your first purchase. All demo orders are saved in this browser."><ButtonLink to="/shop">BEGIN YOUR AUREL STORY <ArrowRight size={15} /></ButtonLink></EmptyState>
      )}
      <p className="orders-demo-note">This demo shows purchases made in this browser. <Link to="/admin">Visit the atelier admin</Link> to manage and confirm them.</p>
    </div>
  );
}