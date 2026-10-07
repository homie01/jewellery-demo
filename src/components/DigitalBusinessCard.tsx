import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, ShieldCheck, Eye, RotateCw } from 'lucide-react';
import { cardUrl, useClipboard } from '../lib/storage';
import { useStore, useOrders } from '../contexts/CommerceContext';
import { useUI } from '../contexts/UIContext';
import { downloadDigitalBusinessCardPDF } from '../utils/pdfGenerator';
import { Button, ButtonLink } from './ui';

interface DigitalBusinessCardProps {
  cardId: string;
  orderId?: string;
  showActions?: boolean;
  className?: string;
}

// Helper for curved top SVG text (canvas-safe, no textPath)
function CurvedTextTop({ text, radius = 35, startAngle = -75, endAngle = 75, fontSize = 5.2, fill = "#0C3866" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text
            key={idx}
            x="50"
            y={50 - radius}
            fontSize={fontSize}
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fill={fill}
            textAnchor="middle"
            transform={`rotate(${angle}, 50, 50)`}
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}

// Helper for curved bottom SVG text (canvas-safe, no textPath)
function CurvedTextBottom({ text, radius = 35, startAngle = 105, endAngle = 255, fontSize = 4.8, fill = "#0C3866" }: { text: string; radius?: number; startAngle?: number; endAngle?: number; fontSize?: number; fill?: string }) {
  const chars = text.split('');
  const step = (endAngle - startAngle) / Math.max(chars.length - 1, 1);
  return (
    <g>
      {chars.map((ch, idx) => {
        const angle = startAngle + idx * step;
        return (
          <text
            key={idx}
            x="50"
            y={50 + radius + fontSize * 0.7}
            fontSize={fontSize}
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fill={fill}
            textAnchor="middle"
            transform={`rotate(${angle}, 50, 50)`}
          >
            {ch}
          </text>
        );
      })}
    </g>
  );
}

// IAF Emblem SVG (Member of Multilateral Recognition Arrangement)
function IAFSeal({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="idgl-seal-svg">
      <circle cx="50" cy="50" r="46" stroke="#0C3866" strokeWidth="3.5" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="40" stroke="#0C3866" strokeWidth="1" strokeDasharray="2 2" fill="none" />
      <CurvedTextTop text="MEMBER OF MULTILATERAL" radius={34} startAngle={-75} endAngle={75} fontSize={5.2} fill="#0C3866" />
      <CurvedTextBottom text="RECOGNITION ARRANGEMENT" radius={34} startAngle={105} endAngle={255} fontSize={4.6} fill="#0C3866" />
      <circle cx="50" cy="50" r="23" fill="#0C3866" />
      <text x="50" y="56" fontSize="17" fontFamily="'Times New Roman', Georgia, serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        IAF
      </text>
    </svg>
  );
}

// ISO 9001:2015 Emblem SVG
function ISOSeal({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="idgl-seal-svg">
      <circle cx="50" cy="50" r="46" stroke="#0C3866" strokeWidth="3.5" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="40" stroke="#0C3866" strokeWidth="1" fill="none" />
      <CurvedTextTop text="CERTIFIED" radius={34} startAngle={-45} endAngle={45} fontSize={6.5} fill="#0C3866" />
      <CurvedTextBottom text="COMPANY" radius={34} startAngle={135} endAngle={225} fontSize={6} fill="#0C3866" />
      <circle cx="50" cy="50" r="24" fill="#0C3866" />
      <text x="50" y="48" fontSize="12" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        ISO
      </text>
      <text x="50" y="57" fontSize="5.5" fontFamily="Arial, sans-serif" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
        9001:2015
      </text>
    </svg>
  );
}

// IDGL Round Logo SVG
function IDGLLogoSeal({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="idgl-seal-svg">
      <circle cx="50" cy="50" r="46" stroke="#0C3866" strokeWidth="2.5" fill="#FFFFFF" />
      <CurvedTextTop text="INTERNATIONAL" radius={35} startAngle={-60} endAngle={60} fontSize={6.2} fill="#0C3866" />
      <CurvedTextBottom text="DIAMOND & GEM LABORATORY" radius={35} startAngle={100} endAngle={260} fontSize={4.8} fill="#0C3866" />
      <polygon points="50,26 65,40 50,70 35,40" fill="none" stroke="#0C3866" strokeWidth="2.2" />
      <line x1="36" y1="40" x2="64" y2="40" stroke="#0C3866" strokeWidth="1.5" />
      <line x1="50" y1="26" x2="50" y2="70" stroke="#0C3866" strokeWidth="1.5" />
    </svg>
  );
}

export default function DigitalBusinessCard({ cardId, orderId, showActions = true, className = '' }: DigitalBusinessCardProps) {
  const { settings } = useStore();
  const { orders } = useOrders();
  const { toast } = useUI();
  const { copy, copied } = useClipboard();
  const [downloading, setDownloading] = useState(false);
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');

  const url = cardUrl(cardId);
  const elementId = `business-card-node-${cardId}`;

  // Find linked order for dynamic customer/piece specs
  const order = orders.find((entry) => entry.id === orderId || entry.id === cardId);
  const firstItem = order?.items?.[0];

  // IDGL Card Details (Exact match to IDGL certificate report format)
  const partyName = order?.customer?.name || 'To whom it may concern';
  const summaryNo = cardId ? (cardId.length > 13 ? cardId.slice(0, 13) : cardId.padStart(13, '0')) : '0108261732001';
  const weight = firstItem ? '6.14 carats' : '6.14 carats';
  const colour = 'GREEN';
  const shape = 'OVAL MIX';
  const measurement = '13.23 x 11.04 x 5.27 mm';
  const refractiveIndex = '1.57 - 1.58';
  const specificGravity = '2.67 - 2.78';
  const hardness = '7.5';
  const identification = firstItem?.name ? firstItem.name.toUpperCase() : 'NATURAL EMERALD';
  const gemImage = firstItem?.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400';

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadDigitalBusinessCardPDF({
        cardId,
        orderId: orderId || cardId,
        settings,
        elementId,
      });
      toast('IDGL Certificate Card PDF downloaded successfully.');
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
      <div className="idgl-view-selector">
        <button
          type="button"
          className={`idgl-view-btn ${activeSide === 'both' ? 'active' : ''}`}
          onClick={() => setActiveSide('both')}
        >
          <Eye size={13} /> DUAL SIDES (FRONT & BACK)
        </button>
        <button
          type="button"
          className={`idgl-view-btn ${activeSide === 'front' ? 'active' : ''}`}
          onClick={() => setActiveSide('front')}
        >
          <RotateCw size={13} /> FRONT COVER
        </button>
        <button
          type="button"
          className={`idgl-view-btn ${activeSide === 'back' ? 'active' : ''}`}
          onClick={() => setActiveSide('back')}
        >
          <RotateCw size={13} /> BACK REPORT
        </button>
      </div>

      {/* Visual IDGL Certificate Card Container */}
      <div id={elementId} className={`idgl-card-container side-${activeSide}`}>
        {/* FRONT SIDE COVER */}
        <div
          id={`idgl-front-node-${cardId}`}
          className={`idgl-card idgl-card-front ${activeSide === 'back' ? 'idgl-offscreen-pdf-target' : ''
            }`}
        >


          {/* Main Front Content Area */}
          <div className="idgl-front-main">
            {/* Top Right IAF Emblem */}
            <div className="idgl-front-top-seal">
              <IAFSeal size={52} />
            </div>

            {/* Center Main IDGL Brand Title */}
            <div className="idgl-front-brand">
              <h2 className="idgl-main-logo">
                IDGL<span className="idgl-tm">TM</span>
              </h2>
            </div>

            {/* Bottom Right ISO Emblem */}
            <div className="idgl-front-bottom-seal">
              <ISOSeal size={50} />
            </div>
          </div>
        </div>

        {/* BACK SIDE REPORT */}
        <div
          id={`idgl-back-node-${cardId}`}
          className={`idgl-card idgl-card-back ${activeSide === 'front' ? 'idgl-offscreen-pdf-target' : ''
            }`}
        >
          {/* Top Header Section */}
          <div className="idgl-back-header">
            <div className="idgl-back-header-right">
              <div className="idgl-logo-badge">
                <IDGLLogoSeal size={34} />
                <span className="idgl-logo-text">IDGL<span className="idgl-tm-sm">TM</span></span>
              </div>
              <h3 className="idgl-lab-title">INTERNATIONAL DIAMOND & GEM LABORATORY</h3>
            </div>
          </div>

          {/* Main Certificate Details Grid */}
          <div className="idgl-back-body">
            <div className="idgl-specs-list">
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">PARTY NAME</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{partyName}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">SUMMARY NO</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{summaryNo}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">WEIGHT</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{weight}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">COLOUR</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{colour}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">SHAPE</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{shape}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">MEASUREMENT</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{measurement}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">REFRACTIVE INDEX</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{refractiveIndex}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">SPECIFIC GRAVITY</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{specificGravity}</span>
              </div>
              <div className="idgl-spec-row">
                <span className="idgl-spec-label">HARDNESS</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value">{hardness}</span>
              </div>
              <div className="idgl-spec-row idgl-highlight-row">
                <span className="idgl-spec-label">IDENTIFICATION</span>
                <span className="idgl-spec-colon">:</span>
                <span className="idgl-spec-value idgl-bold-blue">{identification}</span>
              </div>
            </div>

            {/* Bottom Insets: Gemstone Photo (Left) & QR Code (Right) */}
            <div className="idgl-back-footer">
              <div className="idgl-gem-frame">
                <img src={gemImage} alt="Gemstone Identification" className="idgl-gem-image" />
              </div>
              <div className="idgl-qr-container">
                <QRCodeSVG
                  value={url}
                  size={76}
                  level="H"
                  marginSize={1}
                  bgColor="#FFFFFF"
                  fgColor="#0C3866"
                  title={`IDGL Certificate QR - ${cardId}`}
                />
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
            {downloading ? 'GENERATING PDF...' : 'DOWNLOAD IDGL CERTIFICATE CARD (PDF)'}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              if (await copy(url)) {
                toast('IDGL Card link copied to clipboard!');
              } else {
                toast('Please copy link manually.');
              }
            }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'LINK COPIED' : 'COPY QR LINK'}
          </Button>

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
        <span>Official IDGL International Diamond & Gem Laboratory Certificate Card & Scannable Record.</span>
      </div>
    </div>
  );
}

