import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, Mail, MapPin, Phone, Search, ShieldCheck } from 'lucide-react';
import { getCardStatus, useCards, useOrders, useStore } from '../../contexts/CommerceContext';
import { useUI } from '../../contexts/UIContext';
import { formatDate, money } from '../../lib/storage';
import { AdminPageHeading } from './Dashboard';
import { Badge, Button, ButtonLink, EmptyState, Modal } from '../../components/ui';
import DigitalBusinessCard from '../../components/DigitalBusinessCard';
import { downloadOrderInvoicePDF } from '../../utils/pdfGenerator';
import type { Order, OrderStatus } from '../../types';

function exportOrders(orders: Order[]) {
  const safe = (value: string | number) => `"${String(value).replace(/"/g, '""').replace(/^[=+@-]/, "'")}"`;
  const rows = [['Order ID', 'Customer', 'Email', 'Date', 'Amount INR', 'Payment', 'Status'], ...orders.map((order) => [order.id, order.customer.name, order.customer.email, order.date, order.total, order.paymentStatus, order.status])];
  const blob = new Blob([rows.map((row) => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'aurel-orders.csv'; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function AdminOrders() {
  const { orders } = useOrders();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const status = params.get('status') ?? 'All orders';
  const [sort, setSort] = useState('newest');
  const filtered = orders.filter((order) => (status === 'All orders' || order.status === status) && `${order.id} ${order.customer.name} ${order.customer.email} ${order.items.map((item) => item.name).join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'highest' ? b.total - a.total : sort === 'oldest' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime());
  const update = (key: string, value: string) => setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next; }, { replace: true });
  return <><AdminPageHeading eyebrow="EVERY ORDER, A NEW STORY" title="Orders" description="A thoughtful view of every beautiful beginning."><Button variant="outline" onClick={() => exportOrders(filtered)}><Download size={14} /> EXPORT ORDERS</Button></AdminPageHeading><section className="admin-panel orders-table-panel"><div className="admin-order-tabs">{['All orders', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((item) => <button key={item} onClick={() => update('status', item === 'All orders' ? '' : item)} className={status === item ? 'active' : ''}>{item}{item === 'All orders' && <span>{orders.length}</span>}{item === 'Pending' && <span>{orders.filter((order) => order.status === 'Pending').length}</span>}</button>)}</div><div className="admin-table-toolbar"><label className="admin-table-search"><Search size={16} strokeWidth={1.3} /><input aria-label="Search orders" placeholder="Search order, customer, or piece..." value={query} onChange={(event) => update('q', event.target.value)} /></label><select aria-label="Sort orders" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option></select></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>ORDER ID</th><th>CUSTOMER</th><th>PIECE</th><th>DATE</th><th>AMOUNT</th><th>PAYMENT</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.id}><td><Link className="order-id-link" to={`/admin/orders/${order.id}`}>{order.id}</Link></td><td>{order.customer.name}<small>{order.customer.city}</small></td><td><div className="table-product"><img src={order.items[0].image} alt="" /><span>{order.items[0].name}{order.items.length > 1 && <small>+{order.items.length - 1} more</small>}</span></div></td><td className="nowrap">{formatDate(order.date)}</td><td>{money(order.total)}</td><td><Badge status={order.paymentStatus} /></td><td><Badge status={order.status} /></td><td><Link className="admin-view-button" to={`/admin/orders/${order.id}`}>VIEW <ArrowUpRight size={13} /></Link></td></tr>)}</tbody></table></div>{filtered.length === 0 && <EmptyState title="Nothing here, just yet." description="Try a different search or status to find your orders." />}<div className="table-footer"><span>Showing {filtered.length} of {orders.length} orders</span><span>All data saved in this browser</span></div></section></>;
}

export function AdminOrderDetails() {
  const { id } = useParams();
  const { orders, confirmOrder, updateStatus, markPaid } = useOrders();
  const { cards, generateCard } = useCards();
  const { settings } = useStore();
  const { toast } = useUI();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const navigate = useNavigate();
  const order = orders.find((entry) => entry.id === id);
  if (!order) return <EmptyState title="This order couldn't be found." description="It may belong to a different browser's demo data."><ButtonLink to="/admin/orders">BACK TO ORDERS</ButtonLink></EmptyState>;
  const card = cards.find((entry) => entry.orderId === order.id && getCardStatus(entry) === 'Active');
  const generate = () => {
    try { const created = generateCard(order.id); toast('Your digital purchase card has been created.'); navigate(`/admin/cards/${created.id}`); }
    catch (error) { toast(error instanceof Error ? error.message : 'The card could not be created.'); }
  };
  return <><Link to="/admin/orders" className="admin-back"><ArrowLeft size={14} /> ALL ORDERS</Link><AdminPageHeading eyebrow={`PLACED ${formatDate(order.date, true).toUpperCase()}`} title={`Order #${order.id}`} description={`A new chapter for ${order.customer.name}.`}><div className="admin-order-heading-actions"><Badge status={order.status} />{order.status === 'Pending' ? <Button onClick={() => { confirmOrder(order.id); toast('Order confirmed & Digital Business Card created!'); }}><Check size={15} /> CONFIRM ORDER</Button> : <label><span className="sr-only">Update order status</span><select className="admin-select" value={order.status} onChange={(event) => { if (event.target.value === 'Cancelled') setConfirmCancel(true); else { updateStatus(order.id, event.target.value as OrderStatus); toast(`Order marked as ${event.target.value.toLowerCase()}.`); } }}><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></label>}<Button variant="outline" onClick={() => downloadOrderInvoicePDF(order, settings)}><Download size={14} /> INVOICE (PDF)</Button></div></AdminPageHeading>

  <AnimatePresence>{order.status !== 'Pending' && order.status !== 'Cancelled' && <motion.div className="card-generation-prompt" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}><div><p>{card ? 'Digital Business Card Generated & Ready' : 'Confirmed. Ready for digital business card.'}</p><span>{card ? 'Provided with QR code linking to customer order details & invoice.' : 'Create a protected digital purchase card with a unique QR link for this order.'}</span></div>{card ? <ButtonLink to={`/admin/cards/${card.id}`} variant="outline">VIEW CARD DETAILS <ArrowRight size={15} /></ButtonLink> : <Button onClick={generate}>GENERATE DIGITAL BUSINESS CARD <ArrowRight size={15} /></Button>}</motion.div>}</AnimatePresence>

  {card && order.status !== 'Pending' && order.status !== 'Cancelled' && (
    <section className="admin-panel admin-business-card-panel" style={{ marginBottom: '2rem' }}>
      <div className="admin-panel-heading">
        <div>
          <h2>Digital Business Card for Customer</h2>
          <p>Features QR code that opens customer order details & invoice when scanned.</p>
        </div>
        <ShieldCheck size={22} />
      </div>
      <DigitalBusinessCard cardId={card.id} orderId={order.id} />
    </section>
  )}

  <div className="admin-order-detail-grid"><div><section className="admin-panel"><div className="admin-panel-heading"><h2>The considered pieces</h2><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} pieces</span></div><div className="admin-order-products">{order.items.map((item, index) => <div key={`${item.productId}-${index}`}><Link to={`/product/${item.productId}`}><img src={item.image} alt={item.name} /></Link><div><h3>{item.name}</h3><p>Size: {item.size}</p><span>Quantity: {item.quantity}</span></div><strong>{money(item.price * item.quantity)}<small>{money(item.price)} each</small></strong></div>)}</div><dl className="totals admin-order-totals"><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>{order.deliveryMethod} delivery</dt><dd>{order.shipping === 0 ? 'Complimentary' : money(order.shipping)}</dd></div><div><dt>Taxes</dt><dd>Included</dd></div><div className="total-line"><dt>Total</dt><dd>{money(order.total)}</dd></div></dl></section><section className="admin-panel admin-payment-panel"><div className="admin-panel-heading"><h2>Payment details</h2><Badge status={order.paymentStatus} /></div><div><dl><div><dt>Payment method</dt><dd>{order.paymentMethod}</dd></div><div><dt>Amount</dt><dd>{money(order.total)}</dd></div><div><dt>Transaction type</dt><dd>Simulated demo payment</dd></div></dl>{order.paymentStatus === 'Pending' && <Button variant="outline" onClick={() => { markPaid(order.id); toast('Payment marked as received.'); }}>MARK AS PAID <Check size={14} /></Button>}</div></section></div><div><section className="admin-panel admin-customer-panel"><div className="admin-panel-heading"><h2>A little about the customer</h2></div><div className="customer-avatar-name"><span>{order.customer.name.split(' ').map((name) => name[0]).slice(0, 2).join('')}</span><div><h3>{order.customer.name}</h3><p>{orders.filter((entry) => entry.customer.email === order.customer.email).length} orders with Aurel</p></div></div><div className="customer-contact-lines"><a href={`mailto:${order.customer.email}`}><Mail size={15} />{order.customer.email}</a><a href={`tel:${order.customer.phone}`}><Phone size={15} />{order.customer.phone}</a><div><MapPin size={15} /><p>{order.customer.address}<br />{order.customer.city}, {order.customer.state}<br />{order.customer.pincode}, India</p></div></div></section><section className="admin-panel order-journey-panel"><div className="admin-panel-heading"><h2>The journey so far</h2></div><ol><li className="completed"><span /><div><strong>Order placed</strong><p>{formatDate(order.date, true)}</p></div></li><li className={order.status !== 'Pending' && order.status !== 'Cancelled' ? 'completed' : ''}><span /><div><strong>Atelier confirmation</strong><p>{order.status === 'Pending' ? 'Awaiting your review' : order.status === 'Cancelled' ? 'Order cancelled' : 'Confirmed with care'}</p></div></li><li className={card ? 'completed' : ''}><span /><div><strong>Digital purchase card</strong><p>{card ? 'Created and ready to share' : 'Created after confirmation'}</p></div></li><li className={['Shipped', 'Delivered'].includes(order.status) ? 'completed' : ''}><span /><div><strong>On its way</strong><p>{order.status === 'Delivered' ? 'Delivered to its new home' : order.status === 'Shipped' ? 'Shipped to its new home' : 'A beautiful journey ahead'}</p></div></li></ol></section>{order.status === 'Pending' && <button className="cancel-order-button" onClick={() => setConfirmCancel(true)}>CANCEL THIS ORDER</button>}</div></div><Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this order?"><div className="confirmation-dialog"><p>This will mark {order.id} as cancelled. No actual payment or refund will be processed in this demo.</p><div><Button variant="outline" onClick={() => setConfirmCancel(false)}>KEEP ORDER</Button><Button onClick={() => { updateStatus(order.id, 'Cancelled'); setConfirmCancel(false); toast('Order cancelled.'); }}>CANCEL ORDER</Button></div></div></Modal></>;
}