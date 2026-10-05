import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LockKeyhole, UserCheck, LogOut } from 'lucide-react';
import { useCart, useOrders, useStore } from '../contexts/CommerceContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { money } from '../lib/storage';
import { demoPaymentService } from '../services/demo';
import { Button, ButtonLink, EmptyState } from '../components/ui';
import { CartRow } from '../components/CartDrawer';
import { CustomerFields, DeliveryFields, PaymentFields } from '../components/CheckoutForm';
import type { Customer, PaymentMethod } from '../types';

function OrderTotals({ subtotal, shipping }: { subtotal: number; shipping: number }) {
  return (
    <dl className="totals">
      <div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
      <div><dt>Delivery</dt><dd className={shipping === 0 ? 'complimentary' : ''}>{shipping === 0 ? 'Complimentary' : money(shipping)}</dd></div>
      <div><dt>Taxes</dt><dd>Included</dd></div>
      <div className="total-line"><dt>Total <span>INR</span></dt><dd>{money(subtotal + shipping)}</dd></div>
    </dl>
  );
}

export function CartPage() {
  const { items, count, subtotal } = useCart();
  const { customerUser } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!customerUser) {
      navigate('/login?redirect=/checkout&reason=order');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="commerce-page">
      <div className="breadcrumbs"><Link to="/">HOME</Link><span>/</span><span>YOUR BAG</span></div>
      <div className="commerce-title"><p className="eyebrow">A LITTLE SOMETHING, FOREVER.</p><h1>Your <em>bag.</em> <span>({count})</span></h1></div>
      {items.length ? (
        <div className="cart-page-grid">
          <div>
            <div className="cart-list-heading"><span>YOUR CONSIDERED PIECES</span><span>AMOUNT</span></div>
            {items.map((item) => <CartRow key={item.key} item={item} />)}
            <Link to="/shop" className="text-link cart-continue"><ArrowLeft size={15} /> CONTINUE EXPLORING</Link>
          </div>
          <aside className="order-summary">
            <p className="eyebrow">THE BEAUTIFUL DETAILS</p><h2>Order summary</h2>
            <OrderTotals subtotal={subtotal} shipping={0} />
            <Button onClick={handleCheckout} className="w-full">PROCEED TO CHECKOUT <ArrowRight size={16} /></Button>
            <p className="summary-note"><LockKeyhole size={13} /> Customer account required. Simulated demo payments.</p>
            <div className="packaging-note"><p>Beautifully wrapped. Thoughtfully sent.</p><span>Every Aurel piece arrives in our signature gift-ready packaging, with a little extra care.</span></div>
          </aside>
        </div>
      ) : (
        <EmptyState title="The beginning of something beautiful." description="Your bag is waiting for a piece that feels like you.">
          <ButtonLink to="/shop">FIND YOUR FOREVER PIECE <ArrowRight size={16} /></ButtonLink>
        </EmptyState>
      )}
    </div>
  );
}

const initialCustomer: Customer = { name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { catalog } = useStore();
  const { createOrder } = useOrders();
  const { customerUser, customerSignOut } = useAuth();
  const { toast } = useUI();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer>(() => {
    if (customerUser) {
      return {
        name: customerUser.name || '',
        email: customerUser.email || '',
        phone: customerUser.phone || '',
        address: customerUser.address || '',
        city: customerUser.city || '',
        state: customerUser.state || '',
        pincode: customerUser.pincode || '',
      };
    }
    return initialCustomer;
  });

  const [delivery, setDelivery] = useState<'Standard' | 'Express'>('Standard');
  const [payment, setPayment] = useState<PaymentMethod>('UPI');
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState('aurel.demo@upi');
  const [error, setError] = useState('');
  const placing = useRef(false);
  const mounted = useRef(true);

  // Redirect to login if customer is not authenticated
  useEffect(() => {
    mounted.current = true;
    if (!customerUser) {
      navigate('/login?redirect=/checkout&reason=order', { replace: true });
    }
    return () => { mounted.current = false; };
  }, [customerUser, navigate]);

  // Update customer fields if customerUser changes
  useEffect(() => {
    if (customerUser) {
      setCustomer((prev) => ({
        ...prev,
        name: prev.name || customerUser.name || '',
        email: customerUser.email || prev.email || '',
        phone: prev.phone || customerUser.phone || '',
        address: prev.address || customerUser.address || '',
        city: prev.city || customerUser.city || '',
        state: prev.state || customerUser.state || '',
        pincode: prev.pincode || customerUser.pincode || '',
      }));
    }
  }, [customerUser]);

  const shipping = delivery === 'Express' ? 499 : 0;

  const placeOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (!customerUser) {
      navigate('/login?redirect=/checkout&reason=order');
      return;
    }
    if (placing.current || !items.length) return;
    const phoneDigits = customer.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('Please enter a valid phone number with 10 to 15 digits.');
      return;
    }
    if (!customer.name.trim() || !customer.city.trim() || !customer.state.trim() || customer.address.trim().length < 8) {
      setError('Please complete your name and delivery address.');
      return;
    }
    if (items.some((item) => !catalog.find((product) => product.id === item.productId)?.available)) {
      setError('One of your pieces is currently unavailable. Please update your bag before continuing.');
      return;
    }
    placing.current = true;
    setProcessing(true);
    setError('');
    try {
      const result = await demoPaymentService.authorize(payment);
      if (!mounted.current) return;
      if (!result.success) throw new Error('Payment could not be completed. Please try again.');
      const cleanCustomer = {
        ...customer, name: customer.name.trim(), email: customer.email.trim().toLowerCase(),
        city: customer.city.trim(), state: customer.state.trim(), address: customer.address.trim(),
      };
      const order = createOrder({ customer: cleanCustomer, items, paymentMethod: payment, deliveryMethod: delivery });
      clearCart();
      navigate(`/order-success?order=${order.id}`, { replace: true });
      toast('Your next forever piece is on its way.');
    } catch (caught) {
      if (!mounted.current) return;
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.');
      placing.current = false;
      setProcessing(false);
    }
  };

  if (!customerUser) {
    return null; // Will redirect via useEffect
  }

  if (!items.length && !processing) {
    return <EmptyState title="Something lovely comes first." description="Find a piece you love before completing your order."><ButtonLink to="/shop">EXPLORE THE COLLECTION</ButtonLink></EmptyState>;
  }

  return (
    <div className="commerce-page checkout-page">
      <div className="checkout-breadcrumbs"><Link to="/cart">YOUR BAG</Link><span>/</span><span>CHECKOUT</span><span>/</span><span className="muted">A NEW CHAPTER</span></div>
      <div className="commerce-title"><p className="eyebrow">ALMOST YOURS</p><h1>A beautiful <em>beginning.</em></h1><p>Let us take care of the little details.</p></div>
      
      {/* Logged in customer identity bar */}
      <div className="checkout-customer-bar">
        <div className="customer-info">
          <UserCheck size={18} />
          <span>Ordering as <strong>{customerUser.name}</strong> ({customerUser.email})</span>
        </div>
        <button
          type="button"
          className="text-link flex items-center gap-1 text-xs"
          onClick={() => {
            customerSignOut();
            navigate('/login?redirect=/checkout');
          }}
        >
          <LogOut size={13} /> Switch Account
        </button>
      </div>

      <form onSubmit={placeOrder} className="checkout-grid" aria-busy={processing}>
        <fieldset className="checkout-form" disabled={processing}>
          <legend className="sr-only">Your contact, delivery, and payment details</legend>
          <CustomerFields customer={customer} onChange={setCustomer} />
          <DeliveryFields value={delivery} onChange={setDelivery} />
          <PaymentFields value={payment} onChange={setPayment} upiId={upiId} onUpiChange={setUpiId} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <Link to="/cart" className="text-link"><ArrowLeft size={14} /> BACK TO YOUR BAG</Link>
        </fieldset>
        <aside className="order-summary checkout-summary">
          <p className="eyebrow">YOUR NEXT FOREVER PIECES</p><h2>A lovely choice.</h2>
          <div className="checkout-summary-items">
            {items.map((item) => {
              const product = catalog.find((entry) => entry.id === item.productId)!;
              return (
                <div key={item.key}>
                  <div className="checkout-item-image"><img src={product.image} alt={product.name} /><span>{item.quantity}</span></div>
                  <div><h3>{product.name}</h3><p>{product.material} / {item.size}</p></div>
                  <span>{money(product.price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <OrderTotals subtotal={subtotal} shipping={shipping} />
          <Button type="submit" loading={processing} className="w-full">{processing ? 'CREATING YOUR BEAUTIFUL BEGINNING...' : 'PLACE ORDER'}{!processing && <ArrowRight size={16} />}</Button>
          <p className="checkout-agreement">By placing your order, you agree to our <Link to="/care?topic=terms" className="underlined">terms</Link> and acknowledge that this is a simulated purchase.</p>
          <p className="summary-note"><LockKeyhole size={12} /> Signed in securely as {customerUser.name}.</p>
        </aside>
      </form>
    </div>
  );
}