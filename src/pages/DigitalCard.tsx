import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, useAnimationControls } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Download, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getCardStatus, useCards, useOrders, useStore } from '../contexts/CommerceContext';
import { cardUrl, formatDate, money, readStorage } from '../lib/storage';
import { Badge, Button, ButtonLink, Logo } from '../components/ui';
import { downloadOrderInvoicePDF } from '../utils/pdfGenerator';

export function CardLayout() {
  return <div className="public-card-layout"><header><Logo /><span><ShieldCheck size={15} strokeWidth={1.2} /> A LASTING RECORD. A TRUSTED CONNECTION.</span><Link to="/" className="card-back-link"><ArrowLeft size={14} /> BACK TO AUREL</Link></header><main><Outlet /></main><footer><p>AUREL / CRAFTED WITH INTENTION</p><p>Frontend demo. Sample information only. This is not a real certificate.</p><Link to="/care?topic=privacy">PRIVACY & YOUR DATA</Link></footer></div>;
}

function OTPInput({ value, onChange, disabled, invalid }: { value: string[]; onChange: (value: string[]) => void; disabled: boolean; invalid: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const update = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = [...value];
      digits.slice(0, 6 - index).split('').forEach((digit, offset) => { next[index + offset] = digit; });
      onChange(next); refs.current[Math.min(5, index + digits.length)]?.focus(); return;
    }
    const next = [...value]; next[index] = digits; onChange(next);
    if (digits && index < 5) refs.current[index + 1]?.focus();
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault(); const code = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!code) return;
    onChange(Array.from({ length: 6 }, (_, index) => code[index] ?? ''));
    refs.current[Math.min(code.length, 5)]?.focus();
  };
  const keydown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !value[index] && index > 0) { const next = [...value]; next[index - 1] = ''; onChange(next); refs.current[index - 1]?.focus(); }
    if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); refs.current[index - 1]?.focus(); }
    if (event.key === 'ArrowRight' && index < 5) { event.preventDefault(); refs.current[index + 1]?.focus(); }
  };
  return <div className={`otp-inputs ${invalid ? 'otp-invalid' : ''}`} role="group" aria-label="Six-digit one-time passcode">{value.map((digit, index) => <input key={index} ref={(element) => { refs.current[index] = element; }} type="text" inputMode="numeric" pattern="[0-9]" maxLength={index === 0 ? 6 : 1} autoComplete={index === 0 ? 'one-time-code' : 'off'} aria-label={`Passcode digit ${index + 1}`} aria-invalid={invalid} aria-describedby={invalid ? 'otp-error' : undefined} disabled={disabled} value={digit} onChange={(event) => update(index, event.target.value)} onPaste={paste} onKeyDown={(event) => keydown(event, index)} onFocus={(event) => event.target.select()} required />)}</div>;
}

export function CardVerification() {
  const { cardId } = useParams();
  const [searchParams] = useSearchParams();
  const { cards, verifyCard } = useCards();
  const { orders } = useOrders();
  const [code, setCode] = useState(Array(6).fill('') as string[]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const controls = useAnimationControls();
  const navigate = useNavigate();
  const card = cards.find((entry) => entry.id === cardId);
  const orderExists = orders.some((order) => order.id === card?.orderId && order.status !== 'Cancelled');

  // Auto-verify if autoverify=true in URL query params
  useEffect(() => {
    if (card && orderExists && searchParams.get('autoverify') === 'true') {
      void verifyCard(card.id, '123456').then((success) => {
        if (success) navigate(`/card/${card.id}/verified`, { replace: true });
      });
    }
  }, [card, orderExists, searchParams, verifyCard, navigate]);

  if (!card || getCardStatus(card) !== 'Active' || !orderExists) return <Navigate to={`/card/${cardId}/invalid`} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    if (await verifyCard(card.id, code.join(''))) navigate(`/card/${card.id}/verified`, { replace: true });
    else {
      setError('Invalid passcode. Please try again.');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) void controls.start({ x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } });
      setLoading(false);
    }
  };

  const handleQuickReveal = async () => {
    setLoading(true);
    if (await verifyCard(card.id, '123456')) navigate(`/card/${card.id}/verified`, { replace: true });
    setLoading(false);
  };

  return <motion.section className="verification-page" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}><div className="verification-symbol"><LockKeyhole size={28} strokeWidth={1.1} /></div><p className="eyebrow">SECURE ACCESS</p><h1>A little protection.<br /><em>A precious connection.</em></h1><p className="verification-description">This digital card contains protected customer and purchase information. Verify your access to reveal your order details & invoice.</p><div className="verification-card-id"><span>CARD ID</span><strong>{card.id}</strong></div><form onSubmit={submit}><label>ENTER YOUR ONE-TIME PASSCODE</label><motion.div animate={controls}><OTPInput value={code} onChange={(value) => { setCode(value); if (error) setError(''); }} disabled={loading} invalid={Boolean(error)} /></motion.div>{error && <p id="otp-error" className="form-error" role="alert">{error}</p>}<Button type="submit" loading={loading} disabled={code.some((digit) => !digit)}>{loading ? 'VERIFYING YOUR ACCESS...' : 'VERIFY & CONTINUE'}{!loading && <ArrowRight size={15} />}</Button></form><div className="verification-demo" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}><Button variant="outline" onClick={handleQuickReveal} loading={loading}>REVEAL ORDER DETAILS & INVOICE NOW (PASSCODE: 123456)</Button><span>Passcode <strong>123456</strong> is set for demo verification.</span></div><p className="verification-fine-print"><ShieldCheck size={13} /> Your verification is valid for 10 minutes in this tab.</p><p className="verification-local-note">Demo access only. Records live in this browser, not on a secure server.</p></motion.section>;
}

export function VerifiedCard() {
  const { cardId } = useParams();
  const { cards, isVerified, lockCard } = useCards();
  const { orders } = useOrders();
  const { settings } = useStore();
  const [, updateTime] = useState(0);
  const navigate = useNavigate();
  const card = cards.find((entry) => entry.id === cardId);

  useEffect(() => {
    const grant = readStorage<Record<string, number>>('aurel.verified.v1', {}, sessionStorage)[cardId ?? ''] ?? Date.now();
    const expires = Math.min(grant, card ? new Date(card.expiresAt).getTime() : Date.now());
    const timer = window.setTimeout(() => updateTime((value) => value + 1), Math.max(0, expires - Date.now()) + 25);
    return () => window.clearTimeout(timer);
  }, [cardId, card]);

  if (!card || getCardStatus(card) !== 'Active') return <Navigate to={`/card/${cardId}/invalid`} replace />;
  if (!isVerified(card.id)) return <Navigate to={`/card/${card.id}/verify`} replace />;
  const order = orders.find((entry) => entry.id === card.orderId);
  if (!order || order.status === 'Cancelled') return <Navigate to={`/card/${card.id}/invalid`} replace />;

  return <motion.div className="verified-card-page" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}><div className="verified-card-top"><span><Check size={13} /> VERIFIED ACCESS</span><button onClick={() => { lockCard(card.id); navigate(`/card/${card.id}/verify`, { replace: true }); }}><LockKeyhole size={12} /> LOCK THIS RECORD</button></div>

  <article className="purchase-certificate"><div className="certificate-inner"><header className="certificate-header"><Logo /><p className="eyebrow">A BEAUTIFUL PURCHASE. A LASTING RECORD.</p><h1>Digital Purchase Invoice & Order Details</h1><div className="certificate-ornament"><span /><ShieldCheck size={23} strokeWidth={1} /><span /></div><p>CARD REFERENCE: {card.id}</p></header><section className="certificate-customer"><p className="certificate-section-label"><span>01</span> THE PERSON BEHIND THE PIECE</p><h2>{order.customer.name}</h2><dl><div><dt>MOBILE</dt><dd>{order.customer.phone}</dd></div><div><dt>EMAIL</dt><dd>{order.customer.email}</dd></div><div className="certificate-full"><dt>ADDRESS</dt><dd>{order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.pincode}, India</dd></div></dl></section><section className="certificate-order"><p className="certificate-section-label"><span>02</span> ORDER DETAILS & PURCHASED PIECES</p><div className="certificate-order-heading"><div><span>ORDER REFERENCE</span><strong>{order.id}</strong></div><div><span>PURCHASE DATE</span><strong>{formatDate(order.date, true)}</strong></div></div>{order.items.map((item, index) => <div className="certificate-product" key={`${item.productId}-${index}`}><img src={item.image} alt={item.name} /><div><h3>{item.name}</h3><p>Quantity {item.quantity} / Size {item.size}</p><span>18K GOLD / THE AUREL COLLECTION</span></div><strong>{money(item.price * item.quantity)}</strong></div>)}</section><section className="certificate-payment"><p className="certificate-section-label"><span>03</span> FINANCIAL INVOICE SUMMARY</p><dl><div><dt>SUBTOTAL</dt><dd>{money(order.subtotal)}</dd></div><div><dt>DELIVERY ({order.deliveryMethod.toUpperCase()})</dt><dd>{order.shipping === 0 ? 'COMPLIMENTARY' : money(order.shipping)}</dd></div><div><dt>TOTAL AMOUNT</dt><dd><strong>{money(order.total)}</strong></dd></div><div><dt>PAYMENT METHOD</dt><dd>{order.paymentMethod}</dd></div><div><dt>PAYMENT STATUS</dt><dd><Badge status={order.paymentStatus} /></dd></div><div><dt>ORDER STATUS</dt><dd><Badge status={order.status} /></dd></div></dl></section><section className="certificate-store"><div><p className="eyebrow">FROM OUR ATELIER, WITH CARE</p><h3>{settings.name}</h3><p>{settings.address}</p><a href={`mailto:${settings.email}`}>{settings.email}</a><span>{settings.phone}</span><a href={window.location.origin}>{window.location.host}</a></div><div><QRCodeSVG value={cardUrl(card.id)} size={96} marginSize={4} level="M" bgColor="#fffdf9" fgColor="#776140" title="Scan to verify record" /><span>SCAN TO VERIFY</span></div></section><footer className="certificate-footer"><div><Check size={12} /><span>VERIFIED DIGITAL RECORD & INVOICE</span></div><p>Valid until {formatDate(card.expiresAt)}. Access can be revoked by the atelier.</p><span className="certificate-signature">Always, Aurel.</span></footer></div></article>

  <div className="verified-download-toolbar" style={{ display: 'flex', justifyContent: 'center', margin: '1.75rem 0 1rem' }}>
    <Button variant="primary" onClick={() => downloadOrderInvoicePDF(order, settings)}>
      <Download size={15} /> DOWNLOAD OFFICIAL INVOICE (PDF)
    </Button>
  </div>

  <p className="certificate-disclaimer">Official digital invoice & purchase verification record.</p><ButtonLink to="/" variant="text">RETURN TO AUREL <ArrowRight size={14} /></ButtonLink></motion.div>;
}

export function InvalidCard() {
  return <section className="invalid-card-page"><div className="invalid-card-symbol"><X size={27} strokeWidth={1} /></div><p className="eyebrow">CARD UNAVAILABLE</p><h1>Some stories<br /><em>stay private.</em></h1><p>This digital card is invalid, expired, or has been revoked.</p><p className="muted">Demo cards are only available in the browser where they were created. If you're opening a link on another device, its local record will not be available.</p><ButtonLink to="/">RETURN TO WEBSITE <ArrowRight size={15} /></ButtonLink><Link className="text-link" to="/admin/cards">VISIT THE DEMO ATELIER <ArrowRight size={13} /></Link></section>;
}