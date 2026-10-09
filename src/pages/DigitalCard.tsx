import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Download, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCards, useOrders, useStore } from '../contexts/CommerceContext';
import { cardUrl, formatDate, money, readStorage } from '../lib/storage';
import { Badge, Button, ButtonLink, Logo } from '../components/ui';
import DigitalBusinessCard from '../components/DigitalBusinessCard';
import { downloadOrderInvoicePDF } from '../utils/pdfGenerator';

export function CardLayout() {
  return (
    <div className="public-card-layout">
      <header>
        <Logo />
        <span><ShieldCheck size={15} strokeWidth={1.2} /> A LASTING RECORD. A TRUSTED CONNECTION.</span>
        <Link to="/" className="card-back-link"><ArrowLeft size={14} /> BACK TO AUREL</Link>
      </header>
      <main><Outlet /></main>
      <footer>
        <p>AUREL / CRAFTED WITH INTENTION</p>
        <p>Official IDGL Laboratory Record Verification System.</p>
        <Link to="/care?topic=privacy">PRIVACY & YOUR DATA</Link>
      </footer>
    </div>
  );
}

// Helpers for canvas-safe SVG curved text
function CurvedTextTop({ text, radius = 35, startAngle = -75, endAngle = 75, fontSize = 5.2, fill = "#0C3866" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text key={idx} x="50" y={50 - radius} fontSize={fontSize} fontFamily="Arial, sans-serif" fontWeight="bold" fill={fill} textAnchor="middle" transform={`rotate(${angle}, 50, 50)`}>
            {ch}
          </text>
        );
      })}
    </g>
  );
}

function CurvedTextBottom({ text, radius = 35, startAngle = 105, endAngle = 255, fontSize = 4.8, fill = "#0C3866" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text key={idx} x="50" y={50 + radius + fontSize * 0.7} fontSize={fontSize} fontFamily="Arial, sans-serif" fontWeight="bold" fill={fill} textAnchor="middle" transform={`rotate(${angle}, 50, 50)`}>
            {ch}
          </text>
        );
      })}
    </g>
  );
}

// Accreditation Seals Banner Component (ISO 9001:2015, IAF, IAS)
function AccreditationSealsBanner() {
  return (
    <div className="idgl-accreditation-banner">
      {/* ISO Seal */}
      <div className="idgl-seal-item">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#081C2D" strokeWidth="3.5" fill="#FFFFFF" />
          <circle cx="50" cy="50" r="40" stroke="#081C2D" strokeWidth="1" fill="none" />
          <CurvedTextTop text="CERTIFIED" radius={34} startAngle={-45} endAngle={45} fontSize={6.5} fill="#081C2D" />
          <CurvedTextBottom text="COMPANY" radius={34} startAngle={135} endAngle={225} fontSize={6} fill="#081C2D" />
          <circle cx="50" cy="50" r="24" fill="#081C2D" />
          <text x="50" y="48" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            ISO
          </text>
          <text x="50" y="57" fontSize="5.5" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            9001:2015
          </text>
        </svg>
      </div>

      {/* IAF Seal */}
      <div className="idgl-seal-item">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="46" stroke="#081C2D" strokeWidth="3.5" fill="#FFFFFF" />
          <circle cx="50" cy="50" r="40" stroke="#081C2D" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <CurvedTextTop text="MEMBER OF MULTILATERAL" radius={34} startAngle={-75} endAngle={75} fontSize={5.2} fill="#081C2D" />
          <CurvedTextBottom text="RECOGNITION ARRANGEMENT" radius={34} startAngle={105} endAngle={255} fontSize={4.6} fill="#081C2D" />
          <circle cx="50" cy="50" r="23" fill="#081C2D" />
          <text x="50" y="56" fontSize="17" fontFamily="'Times New Roman', serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            IAF
          </text>
        </svg>
      </div>

      {/* IAS Seal */}
      <div className="idgl-seal-item">
        <svg width="105" height="64" viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="156" height="96" rx="6" fill="#FFFFFF" stroke="#1F7A63" strokeWidth="3" />
          <text x="80" y="52" fontSize="38" fontFamily="Arial, sans-serif" fontWeight="900" fill="#1F7A63" textAnchor="middle">
            IAS
          </text>
          <text x="80" y="73" fontSize="8.5" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#1F7A63" textAnchor="middle" letterSpacing="0.5">
            INTERNATIONAL
          </text>
          <text x="80" y="86" fontSize="7.5" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#1F7A63" textAnchor="middle" letterSpacing="0.4">
            ACCREDITATION SERVICE®
          </text>
        </svg>
      </div>
    </div>
  );
}

export function CardVerification() {
  const { cardId } = useParams();
  const [searchParams] = useSearchParams();
  const { verifyCard } = useCards();
  const effectiveCardId = cardId ?? 'CARD-0108261732001';
  const [reportNoInput, setReportNoInput] = useState(effectiveCardId);
  const [reportPinInput, setReportPinInput] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('autoverify') === 'true') {
      void verifyCard(effectiveCardId, '123456').then((success) => {
        if (success) navigate(`/card/${effectiveCardId}/verified`, { replace: true });
      });
    }
  }, [effectiveCardId, searchParams, verifyCard, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError('');
    const targetId = reportNoInput.trim() || effectiveCardId;
    if (await verifyCard(targetId, reportPinInput.trim())) {
      navigate(`/card/${targetId}/verified`, { replace: true });
    } else {
      setError('Invalid report PIN. Default pin is 123456.');
      setLoading(false);
    }
  };

  return (
    <motion.div className="report-verification-wrapper" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
      <div className="verify-report-box">
        <h2 className="verify-report-title">Verify Report Here</h2>
        <form onSubmit={submit} className="verify-report-form">
          <div className="verify-field">
            <input
              type="text"
              placeholder="Report Number"
              value={reportNoInput}
              onChange={(e) => setReportNoInput(e.target.value)}
              required
            />
          </div>
          <div className="verify-field">
            <input
              type="password"
              placeholder="Report Pin"
              value={reportPinInput}
              onChange={(e) => setReportPinInput(e.target.value)}
              required
            />
          </div>
          {error && <p className="verify-error">{error}</p>}
          <button type="submit" className="verify-submit-btn" disabled={loading}>
            {loading ? 'VERIFYING...' : 'Verify'}
          </button>
        </form>
        <p className="verify-demo-note">Report PIN <strong>123456</strong> is set for demo verification.</p>
      </div>
    </motion.div>
  );
}

export function VerifiedCard() {
  const { cardId } = useParams();
  const { cards, isVerified, lockCard } = useCards();
  const { orders } = useOrders();
  const { settings } = useStore();
  const [, updateTime] = useState(0);
  const navigate = useNavigate();

  const effectiveCardId = cardId ?? 'CARD-0108261732001';
  const card = cards.find((entry) => entry.id === effectiveCardId) || {
    id: effectiveCardId,
    orderId: `ORD-${effectiveCardId}`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    status: 'Active' as const,
  };

  useEffect(() => {
    const grant = readStorage<Record<string, number>>('aurel.verified.v1', {}, sessionStorage)[card.id] ?? Date.now();
    const expires = Math.min(grant, new Date(card.expiresAt).getTime());
    const timer = window.setTimeout(() => updateTime((value) => value + 1), Math.max(0, expires - Date.now()) + 25);
    return () => window.clearTimeout(timer);
  }, [card]);

  if (!isVerified(card.id)) return <Navigate to={`/card/${card.id}/verify`} replace />;

  const order = orders.find((entry) => entry.id === card.orderId) || {
    id: `ORD-${card.id}`,
    customer: {
      name: 'To whom it may concern',
      email: 'care@aurel-jewellery.com',
      phone: '+91 261 555 0188',
      address: 'Ghod Dod Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007'
    },
    items: [
      {
        productId: 'P-01',
        name: 'NATURAL EMERALD',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400',
        price: 125000,
        quantity: 1,
        size: 'Standard'
      }
    ],
    subtotal: 125000,
    shipping: 0,
    total: 125000,
    date: new Date().toISOString(),
    paymentMethod: 'UPI' as const,
    paymentStatus: 'Paid' as const,
    status: 'Confirmed' as const,
    deliveryMethod: 'Express' as const,
    owner: 'customer'
  };

  const firstItem = order.items[0];
  const certNo = card.id ? (card.id.length > 13 ? card.id.slice(0, 13) : card.id.padStart(13, '0')) : '0108261732001';
  const partyName = order.customer?.name || 'To whom it may concern';
  const resultText = firstItem?.name ? firstItem.name.toUpperCase() : 'NATURAL MULTI STONES (BRACELET)';
  const weightText = '6.14 carats';
  const colorText = 'GREEN';
  const cutShapeText = 'OVAL MIX';
  const dimensionsText = '13.23 x 11.04 x 5.27 mm';
  const mountingStatsText = 'Studded';
  const riText = '1.57 - 1.58';
  const sgText = '2.67 - 2.78';
  const microObsText = 'Color zoning liquid & surface markings';
  const hardnessText = '7.5 (Ref. mohs scale)';
  const remarksText = 'Observation confirmed natural formation';
  const commentsText = firstItem?.name ? firstItem.name.toUpperCase() : 'AUREL HEIRLOOM COLLECTION';

  return (
    <motion.div
      className="verified-card-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="verified-card-top">
        <span><Check size={13} /> VERIFIED ACCESS</span>
        <button onClick={() => { lockCard(card.id); navigate(`/card/${card.id}/verify`, { replace: true }); }}>
          <LockKeyhole size={12} /> LOCK THIS RECORD
        </button>
      </div>

      {/* Verified Report Container Box (Matching exact attached demo design) */}
      <div className="report-verified-container">
        <h1 className="report-verified-heading">Report Verified successfully</h1>

        {/* Product Image Box */}
        <div className="report-verified-img-box">
          <img src={firstItem?.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400'} alt="Verified Item" />
        </div>

        {/* Accreditation Seals Banner (ISO, IAF, IAS) */}
        <AccreditationSealsBanner />

        {/* Report Details Table */}
        <table className="report-verified-table">
          <tbody>
            <tr>
              <td className="report-table-label">Certificate No</td>
              <td className="report-table-val font-bold">{certNo}</td>
            </tr>
            <tr>
              <td className="report-table-label">On Behalf Of</td>
              <td className="report-table-val font-bold">{partyName}</td>
            </tr>
            <tr>
              <td className="report-table-label">Result :</td>
              <td className="report-table-val">{resultText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Weight :</td>
              <td className="report-table-val">{weightText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Color :</td>
              <td className="report-table-val">{colorText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Cut &Shape :</td>
              <td className="report-table-val">{cutShapeText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Dimensions :</td>
              <td className="report-table-val">{dimensionsText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Mounting Stats :</td>
              <td className="report-table-val">{mountingStatsText}</td>
            </tr>
            <tr>
              <td className="report-table-label">R.I. :</td>
              <td className="report-table-val">{riText}</td>
            </tr>
            <tr>
              <td className="report-table-label">S.G. :</td>
              <td className="report-table-val">{sgText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Micro Obs. :</td>
              <td className="report-table-val">{microObsText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Hardness :</td>
              <td className="report-table-val">{hardnessText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Remarks :</td>
              <td className="report-table-val">{remarksText}</td>
            </tr>
            <tr>
              <td className="report-table-label">Comments :</td>
              <td className="report-table-val">{commentsText}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* IDGL Certificate Physical Card View */}
      <section style={{ margin: '2.5rem 0' }}>
        <DigitalBusinessCard cardId={card.id} orderId={order.id} showSelector={false} showActions={false} />
      </section>

      {/* Purchase Invoice & Order Section */}
      <article className="purchase-certificate">
        <div className="certificate-inner">
          <header className="certificate-header">
            <Logo />
            <p className="eyebrow">A BEAUTIFUL PURCHASE. A LASTING RECORD.</p>
            <h1>Digital Purchase Invoice & Order Details</h1>
            <div className="certificate-ornament"><span /><ShieldCheck size={23} strokeWidth={1} /><span /></div>
            <p>CARD REFERENCE: {card.id}</p>
          </header>
          <section className="certificate-customer">
            <p className="certificate-section-label"><span>01</span> THE PERSON BEHIND THE PIECE</p>
            <h2>{order.customer.name}</h2>
            <dl>
              <div><dt>MOBILE</dt><dd>{order.customer.phone}</dd></div>
              <div><dt>EMAIL</dt><dd>{order.customer.email}</dd></div>
              <div className="certificate-full"><dt>ADDRESS</dt><dd>{order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.pincode}, India</dd></div>
            </dl>
          </section>
          <section className="certificate-order">
            <p className="certificate-section-label"><span>02</span> ORDER DETAILS & PURCHASED PIECES</p>
            <div className="certificate-order-heading">
              <div><span>ORDER REFERENCE</span><strong>{order.id}</strong></div>
              <div><span>PURCHASE DATE</span><strong>{formatDate(order.date, true)}</strong></div>
            </div>
            {order.items.map((item, index) => (
              <div className="certificate-product" key={`${item.productId}-${index}`}>
                <img src={item.image} alt={item.name} />
                <div>
                  <h3>{item.name}</h3>
                  <p>Quantity {item.quantity} / Size {item.size}</p>
                  <span>18K GOLD / THE AUREL COLLECTION</span>
                </div>
                <strong>{money(item.price * item.quantity)}</strong>
              </div>
            ))}
          </section>
          <section className="certificate-payment">
            <p className="certificate-section-label"><span>03</span> FINANCIAL INVOICE SUMMARY</p>
            <dl>
              <div><dt>SUBTOTAL</dt><dd>{money(order.subtotal)}</dd></div>
              <div><dt>DELIVERY ({order.deliveryMethod.toUpperCase()})</dt><dd>{order.shipping === 0 ? 'COMPLIMENTARY' : money(order.shipping)}</dd></div>
              <div><dt>TOTAL AMOUNT</dt><dd><strong>{money(order.total)}</strong></dd></div>
              <div><dt>PAYMENT METHOD</dt><dd>{order.paymentMethod}</dd></div>
              <div><dt>PAYMENT STATUS</dt><dd><Badge status={order.paymentStatus} /></dd></div>
              <div><dt>ORDER STATUS</dt><dd><Badge status={order.status} /></dd></div>
            </dl>
          </section>
          <section className="certificate-store">
            <div>
              <p className="eyebrow">FROM OUR ATELIER, WITH CARE</p>
              <h3>{settings.name}</h3>
              <p>{settings.address}</p>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
              <span>{settings.phone}</span>
              <a href={window.location.origin}>{window.location.host}</a>
            </div>
            <div>
              <QRCodeSVG value={cardUrl(card.id)} size={96} marginSize={4} level="M" bgColor="#FFFFFF" fgColor="#081C2D" title="Scan to verify record" />
              <span>SCAN TO VERIFY</span>
            </div>
          </section>
          <footer className="certificate-footer">
            <div><Check size={12} /><span>VERIFIED DIGITAL RECORD & INVOICE</span></div>
            <p>Valid until {formatDate(card.expiresAt)}. Access can be revoked by the atelier.</p>
            <span className="certificate-signature">Always, Aurel.</span>
          </footer>
        </div>
      </article>

      <div className="verified-download-toolbar" style={{ display: 'flex', justifyContent: 'center', margin: '1.75rem 0 1rem' }}>
        <Button variant="primary" style={{ backgroundColor: '#1F7A63', borderColor: '#1F7A63', color: '#FFFFFF' }} onClick={() => downloadOrderInvoicePDF(order, settings)}>
          <Download size={15} /> DOWNLOAD OFFICIAL INVOICE (PDF)
        </Button>
      </div>

      <p className="certificate-disclaimer">Official digital invoice & purchase verification record.</p>
      <ButtonLink to="/" variant="text">RETURN TO AUREL <ArrowRight size={14} /></ButtonLink>
    </motion.div>
  );
}

export function InvalidCard() {
  return (
    <section className="invalid-card-page">
      <div className="invalid-card-symbol"><X size={27} strokeWidth={1} /></div>
      <p className="eyebrow">CARD UNAVAILABLE</p>
      <h1>Some stories<br /><em>stay private.</em></h1>
      <p>This digital card is invalid, expired, or has been revoked.</p>
      <p className="muted">Demo cards are only available in the browser where they were created. If you're opening a link on another device, its local record will not be available.</p>
      <ButtonLink to="/">RETURN TO WEBSITE <ArrowRight size={15} /></ButtonLink>
      <Link className="text-link" to="/admin/cards">VISIT THE DEMO ATELIER <ArrowRight size={13} /></Link>
    </section>
  );
}