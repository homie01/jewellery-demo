import { CreditCard, LockKeyhole, Smartphone, Truck } from 'lucide-react';
import { Field } from './ui';
import { money } from '../lib/storage';
import type { Customer, PaymentMethod } from '../types';

const sampleCustomer: Customer = {
  name: 'Rahul Patel', phone: '9876543210', email: 'rahul@example.com',
  address: '24, Riverfront Residences, Adajan', city: 'Surat', state: 'Gujarat', pincode: '395009',
};

export function CustomerFields({ customer, onChange }: { customer: Customer; onChange: (customer: Customer) => void }) {
  const update = (key: keyof Customer, value: string) => onChange({ ...customer, [key]: value });
  return (
    <section>
      <div className="checkout-section-heading">
        <span>01</span><h2>Your details</h2>
        <button type="button" onClick={() => onChange(sampleCustomer)}>USE DEMO DETAILS</button>
      </div>
      <div className="form-grid">
        <Field className="form-full" label="Full name" placeholder="As you would like it on your purchase card" required autoComplete="name" minLength={2} value={customer.name} onChange={(event) => update('name', event.target.value)} />
        <Field label="Email address" type="email" required autoComplete="email" placeholder="you@example.com" value={customer.email} onChange={(event) => update('email', event.target.value)} />
        <Field label="Mobile number" type="tel" required autoComplete="tel" placeholder="98765 43210" pattern="[+0-9 ]{10,17}" title="Enter 10 to 15 digits, with an optional country code and spaces" value={customer.phone} onChange={(event) => update('phone', event.target.value)} />
        <Field className="form-full" label="Delivery address" required autoComplete="street-address" placeholder="House, street, and a little direction" minLength={8} value={customer.address} onChange={(event) => update('address', event.target.value)} />
        <Field label="City" required autoComplete="address-level2" value={customer.city} onChange={(event) => update('city', event.target.value)} />
        <Field label="State" required autoComplete="address-level1" value={customer.state} onChange={(event) => update('state', event.target.value)} />
        <Field label="Pincode" required inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} title="Enter a valid six-digit Indian pincode" placeholder="395009" value={customer.pincode} onChange={(event) => update('pincode', event.target.value)} />
        <div className="country-label"><span>DELIVERING TO</span><p>India</p></div>
      </div>
    </section>
  );
}

export function DeliveryFields({ value, onChange }: { value: 'Standard' | 'Express'; onChange: (value: 'Standard' | 'Express') => void }) {
  return (
    <section>
      <div className="checkout-section-heading"><span>02</span><h2>The journey to you</h2></div>
      <div className="delivery-options">
        {(['Standard', 'Express'] as const).map((method) => (
          <label className={`delivery-option ${value === method ? 'selected' : ''}`} key={method}>
            <input type="radio" name="delivery" checked={value === method} onChange={() => onChange(method)} />
            <div><strong>{method === 'Standard' ? 'Thoughtfully delivered' : 'A little sooner'}</strong><span>{method === 'Standard' ? 'Standard delivery, 5-7 business days' : 'Express delivery, 2-3 business days'}</span></div>
            <span>{method === 'Standard' ? 'COMPLIMENTARY' : money(499)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

const paymentMethods = [
  { method: 'UPI', icon: Smartphone, label: 'UPI' },
  { method: 'Credit / Debit Card', icon: CreditCard, label: 'Card' },
  { method: 'Cash on Delivery', icon: Truck, label: 'Pay on delivery' },
] as const;

export function PaymentFields({ value, onChange, upiId, onUpiChange }: {
  value: PaymentMethod; onChange: (value: PaymentMethod) => void; upiId: string; onUpiChange: (value: string) => void;
}) {
  return (
    <section>
      <div className="checkout-section-heading"><span>03</span><h2>A final detail</h2><LockKeyhole size={15} /></div>
      <div className="payment-options">
        {paymentMethods.map(({ method, icon: Icon, label }) => (
          <label className={`payment-option ${value === method ? 'selected' : ''}`} key={method}>
            <input className="sr-only" type="radio" name="payment" checked={value === method} onChange={() => onChange(method)} />
            <Icon size={22} strokeWidth={1.25} /><span>{label}</span><span className="payment-radio" />
          </label>
        ))}
      </div>
      <div className="payment-detail">
        {value === 'UPI' && <Field label="Demo UPI ID" required pattern="[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+" title="Use the demo UPI ID: aurel.demo@upi" value={upiId} onChange={(event) => onUpiChange(event.target.value)} />}
        {value === 'Credit / Debit Card' && <div className="demo-card-instrument"><CreditCard size={25} strokeWidth={1.2} /><div><strong>AUREL TEST CARD</strong><p>Visa ending 4242</p></div><span>DEMO</span></div>}
        {value === 'Cash on Delivery' && <p>Pay your delivery partner when your jewellery arrives. Your payment will be marked as pending until received.</p>}
        <p className="demo-notice">Frontend demonstration only. No money will be charged. Please use sample contact details and never enter real payment information.</p>
      </div>
    </section>
  );
}