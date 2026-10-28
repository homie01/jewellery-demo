import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, ShieldCheck, Eye, RotateCw } from 'lucide-react';
import { productUrl, useClipboard } from '../lib/storage';
import { useStore, useOrders } from '../contexts/CommerceContext';
import { useUI } from '../contexts/UIContext';
import { downloadDigitalBusinessCardPDF } from '../utils/pdfGenerator';
import { Button, ButtonLink } from './ui';
import type { GemstoneDetails } from '../types';

interface DigitalBusinessCardProps {
  cardId: string;
  orderId?: string;
  showActions?: boolean;
  showSelector?: boolean;
  className?: string;
}

// Fallback gemstone details matching the reference certificate card
const defaultGemstone: GemstoneDetails = {
  stoneName: 'NATURAL YELLOW SAPPHIRE',
  indianTradeName: 'Pukhraj(Guru)',
  colour: 'Yellow',
  caratWeight: '5.06ct',
  measurement: '10.10x9.60x3.80mm',
  shapeCut: 'Oval Mix Cut',
  mounted: 'Mounted in Bracelet',
  refractiveIndex: '1.76-1.77',
  specificGravity: '3.96-4.05',
  hardness: '9.00',
  uvTest: 'N.A',
  microscopicObs: 'Typical Of Sapphire',
  spectroscopicObs: 'Typical Of Natural',
  comment: 'N.A',
  specimenImage: '/images/gemstones/yellow-sapphire-gem.jpg',
};

// Canvas-safe circular text for seals
function CurvedTextTop({ text, radius = 35, startAngle = -75, endAngle = 75, fontSize = 5.2, fill = "#1d70b8" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text key={idx} x="50" y={50 - radius} fontSize={fontSize} fontFamily="'Inter', sans-serif" fontWeight="bold" fill={fill} textAnchor="middle" transform={`rotate(${angle}, 50, 50)`}>
            {ch}
          </text>
        );
      })}
    </g>
  );
}

function CurvedTextBottom({ text, radius = 35, startAngle = 105, endAngle = 255, fontSize = 4.8, fill = "#1d70b8" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text key={idx} x="50" y={50 + radius + fontSize * 0.7} fontSize={fontSize} fontFamily="'Inter', sans-serif" fontWeight="bold" fill={fill} textAnchor="middle" transform={`rotate(${angle}, 50, 50)`}>
            {ch}
          </text>
        );
      })}
    </g>
  );
}

function ISOSeal({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="idgl-seal-svg">
      <circle cx="50" cy="50" r="46" stroke="#1d70b8" strokeWidth="3" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="40" stroke="#1d70b8" strokeWidth="1" fill="none" />
      <CurvedTextTop text="CERTIFIED" radius={34} startAngle={-45} endAngle={45} fontSize={6.5} fill="#1d70b8" />
      <CurvedTextBottom text="COMPANY" radius={34} startAngle={135} endAngle={225} fontSize={6} fill="#1d70b8" />
      <circle cx="50" cy="50" r="23" fill="#1d70b8" />
      <text x="50" y="48" fontSize="11" fontFamily="'Inter', sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        ISO
      </text>
      <text x="50" y="56" fontSize="5.5" fontFamily="'Inter', sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        9001:2015
      </text>
    </svg>
  );
}

function IAFSeal({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="idgl-seal-svg">
      <circle cx="50" cy="50" r="46" stroke="#1d70b8" strokeWidth="3" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="40" stroke="#1d70b8" strokeWidth="1" strokeDasharray="2 2" fill="none" />
      <CurvedTextTop text="MEMBER OF MULTILATERAL" radius={34} startAngle={-75} endAngle={75} fontSize={5.2} fill="#1d70b8" />
      <CurvedTextBottom text="RECOGNITION ARRANGEMENT" radius={34} startAngle={105} endAngle={255} fontSize={4.6} fill="#1d70b8" />
      <circle cx="50" cy="50" r="22" fill="#1d70b8" />
      <text x="50" y="56" fontSize="16" fontFamily="'Inter', sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        IAF
      </text>
    </svg>
  );
}

export default function DigitalBusinessCard({ cardId, orderId, showActions = true, showSelector = true, className = '' }: DigitalBusinessCardProps) {
  const { settings, catalog } = useStore();
  const { orders } = useOrders();
  const { toast } = useUI();
  const { copy, copied } = useClipboard();
  const [downloading, setDownloading] = useState(false);
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');

  const elementId = `business-card-node-${cardId}`;

  // Find linked order for dynamic customer/piece specs
  const order = orders.find((entry) => entry.id === orderId || entry.id === cardId);
  const firstItem = order?.items?.[0];
  const matchedProduct = firstItem ? catalog.find((p) => p.id === firstItem.productId) : catalog[0];
  const featuredProduct = matchedProduct || catalog[0];
  const featuredProductId = firstItem?.productId || featuredProduct?.id || 'pukhraj-yellow-sapphire-bracelet';

  // Specific gemstone parameters (extracted from product or order item)
  const gem: GemstoneDetails = firstItem?.gemstoneDetails || matchedProduct?.gemstoneDetails || defaultGemstone;

  // Target product URL for the QR code: scanning directly opens the featured piece!
  const targetProductUrl = productUrl(featuredProductId);

  // Exact data fields matching the user's sample card image
  const clientName = order?.customer?.name || 'Bhaveshbhai soni';
  const summaryNo = cardId ? (cardId.length > 13 ? cardId.slice(0, 13) : cardId.padStart(13, '0')) : '0108261732001';

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadDigitalBusinessCardPDF({
        cardId,
        orderId: orderId || cardId,
        settings,
        elementId,
        order,
        clientName,
        gem,
        summaryNo,
        productId: featuredProductId,
        productUrl: targetProductUrl,
      });
      toast('Laboratory Gemstone Certificate Card PDF downloaded successfully.');
    } catch (err) {
      console.error(err);
      toast('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`digital-business-card-wrapper ${className}`}>
      {/* Side View Selector Controls */}
      {showSelector && (
        <div className="idgl-view-selector">
          <button
            type="button"
            className={`idgl-view-btn ${activeSide === 'both' ? 'active' : ''}`}
            onClick={() => setActiveSide('both')}
          >
            <Eye size={13} /> DUAL SIDES (CERTIFICATE & SECURITY)
          </button>
          <button
            type="button"
            className={`idgl-view-btn ${activeSide === 'front' ? 'active' : ''}`}
            onClick={() => setActiveSide('front')}
          >
            <RotateCw size={13} /> FRONT CERTIFICATE
          </button>
          <button
            type="button"
            className={`idgl-view-btn ${activeSide === 'back' ? 'active' : ''}`}
            onClick={() => setActiveSide('back')}
          >
            <RotateCw size={13} /> BACK SECURITY
          </button>
        </div>
      )}

      {/* Visual Certificate Card Container */}
      <div id={elementId} className={`idgl-card-container side-${activeSide}`}>
        {/* FRONT SIDE: Exact replication of International Gems & Diamond Testing Laboratory Certificate */}
        <div
          id={`idgl-front-node-${cardId}`}
          className={`idgl-card sample-cert-card sample-cert-front ${activeSide === 'back' ? 'idgl-offscreen-pdf-target' : ''}`}
        >
          {/* Header Section */}
          <div className="sample-cert-header">
            <div className="sample-cert-header-left">
              {/* Navaratna Gemstones Wheel Cluster Icon */}
              <div className="sample-gem-cluster-icon">
                <img
                  src="/images/gemstones/navaratna-cluster.jpg"
                  alt="Navaratna Gemstones Cluster"
                  className="sample-cluster-img"
                />
              </div>
              <h2 className="sample-original-text">ORIGINAL</h2>
            </div>

            <div className="sample-cert-header-right">
              <h3 className="sample-lab-name-line">INTERNATIONAL</h3>
              <h3 className="sample-lab-name-line">GEMS & DIAMOND</h3>
              <h3 className="sample-lab-name-line">TESTING LABORATORY</h3>
            </div>
          </div>

          {/* Dividing Blue Line */}
          <div className="sample-blue-divider" />

          {/* Main Card Body */}
          <div className="sample-cert-body">
            {/* Left Column: Gemological Testing Attributes */}
            <div className="sample-specs-col">
              <div className="sample-spec-row">
                <span className="sample-spec-label">Clients Name</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val font-semibold">{clientName}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Weight</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.caratWeight}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Colour</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.colour}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Measurement-Approx</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.measurement}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Shape & Cut</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.shapeCut}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Mounted/Unmounted</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.mounted}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Refractive Index</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.refractiveIndex}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Specific Gravity</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.specificGravity}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Hardness</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.hardness}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">U.V. Test</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.uvTest}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Microscopic Obs</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.microscopicObs}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Spectroscopic Obs</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.spectroscopicObs}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Indian Trade Name</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val font-semibold">{gem.indianTradeName}</span>
              </div>
              <div className="sample-spec-row">
                <span className="sample-spec-label">Comment.</span>
                <span className="sample-spec-colon">:</span>
                <span className="sample-spec-val">{gem.comment}</span>
              </div>
            </div>

            {/* Right Column: Red Stone Box + Cut Gemstone Specimen Photo + Test Identification Text */}
            <div className="sample-right-col">
              {/* Highlighted Red Box with Exact Gemstone Name */}
              <div className="sample-red-stone-box">
                <span className="sample-red-stone-text">{gem.stoneName}</span>
              </div>

              {/* Gemstone Specimen Photo */}
              <div className="sample-specimen-box">
                <img
                  src={gem.specimenImage}
                  alt={`${gem.stoneName} Specimen`}
                  className="sample-specimen-photo"
                />
              </div>

              {/* Identification Subtitle */}
              <div className="sample-specimen-captions">
                <p className="sample-blue-caption">SPECIMEN SUBMITTED FOR TEST</p>
                <p className="sample-blue-caption">IN GEMSTONE IDENTIFIED TO</p>
              </div>

              {/* Scannable Product QR Code: Opens featured piece on scan */}
              <div className="sample-front-qr-wrapper">
                <QRCodeSVG
                  value={targetProductUrl}
                  size={46}
                  level="M"
                  marginSize={1}
                  bgColor="#FFFFFF"
                  fgColor="#081C2D"
                  className="sample-front-qr-svg"
                  title={`Scan to open ${featuredProduct.name}`}
                />
                <span className="sample-qr-tag">SCAN PIECE</span>
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE: Official Security, Laboratory Accreditation & Terms */}
        <div
          id={`idgl-back-node-${cardId}`}
          className={`idgl-card sample-cert-card sample-cert-back ${activeSide === 'front' ? 'idgl-offscreen-pdf-target' : ''}`}
        >
          <div className="sample-back-container">
            {/* Back Header */}
            <div className="sample-back-top">
              <div className="sample-back-header-left">
                <div className="sample-back-mini-gem">
                  <img src="/images/gemstones/navaratna-cluster.jpg" alt="IGDTL Emblem" />
                </div>
                <div>
                  <h4 className="sample-back-title">INTERNATIONAL GEMS & DIAMOND</h4>
                  <h5 className="sample-back-sub">TESTING LABORATORY • OFFICIAL SECURITY BACK</h5>
                </div>
              </div>
              <div className="sample-back-header-right">
                <span className="sample-back-cert-label">CERTIFICATE NO</span>
                <strong className="sample-back-cert-value">{summaryNo}</strong>
              </div>
            </div>

            {/* Back Main Content */}
            <div className="sample-back-main">
              {/* Left Column: QR Code & Product Link */}
              <div className="sample-back-qr-block">
                <div className="sample-back-qr-frame">
                  <QRCodeSVG
                    value={targetProductUrl}
                    size={76}
                    level="H"
                    marginSize={1}
                    bgColor="#FFFFFF"
                    fgColor="#081C2D"
                    className="sample-back-qr-img"
                    title={`Scan to open ${featuredProduct.name}`}
                  />
                </div>
                <span className="sample-back-scan-callout">SCAN TO OPEN FEATURED PIECE</span>
              </div>

              {/* Right Column: Accreditation Seals, Hologram & Disclaimer */}
              <div className="sample-back-info-block">
                <div className="sample-back-seals">
                  <ISOSeal size={42} />
                  <div className="sample-back-hologram-seal">
                    <span className="hologram-star">★</span>
                    <span className="hologram-text">GENUINE GEMOLOGICAL RECORD</span>
                    <span className="hologram-sub">SECURE DIGITAL CARD</span>
                  </div>
                  <IAFSeal size={42} />
                </div>

                <div className="sample-back-terms-box">
                  <p>
                    This report represents the professional scientific assessment of certified gemologists. Examination was carried out using standard gemological instruments including refractometer, specific gravity hydrostatic balance, microscope, and spectroscope.
                  </p>
                  <p className="mt-1 font-semibold">
                    Specific Stone Verified: <span className="sample-bold-term">{gem.stoneName} ({gem.indianTradeName})</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Back Footer */}
            <div className="sample-back-bottom">
              <div className="sample-back-auth-sign">
                <span className="sample-sign-label">Chief Gemologist Signature</span>
                <div className="sample-sign-signature">Dr. H. M. Dave (F.G.A., G.I.A.)</div>
              </div>
              <div className="sample-back-lab-loc">
                <span>Gem Tower, Mahidharpura Diamond Bazaar, Surat 395003</span>
                <span>Official Digital Registry • All Rights Reserved</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="business-card-actions">
          <Button
            onClick={handleDownloadPDF}
            loading={downloading}
            variant="primary"
            className="download-pdf-btn"
          >
            <Download size={15} />
            {downloading ? 'GENERATING PDF...' : 'DOWNLOAD GEMSTONE CERTIFICATE CARD (PDF)'}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              if (await copy(targetProductUrl)) {
                toast(`Product link for "${featuredProduct.name}" copied to clipboard!`);
              } else {
                toast('Please copy link manually.');
              }
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'LINK COPIED' : 'COPY PRODUCT LINK'}
          </Button>

          <ButtonLink
            to={`/product/${featuredProductId}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
          >
            VIEW FEATURED PIECE <ExternalLink size={14} />
          </ButtonLink>

          <ButtonLink
            to={`/card/${cardId}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
          >
            OPEN CERTIFICATE RECORD <ExternalLink size={14} />
          </ButtonLink>
        </div>
      )}

      <div className="card-notice">
        <ShieldCheck size={14} />
        <span>Official International Gems & Diamond Testing Laboratory Certificate Card with Scannable QR linked directly to the featured jewellery piece.</span>
      </div>
    </div>
  );
}
