import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { cardUrl, useClipboard } from '../lib/storage';
import { useStore } from '../contexts/CommerceContext';
import { useUI } from '../contexts/UIContext';
import { downloadDigitalBusinessCardPDF } from '../utils/pdfGenerator';
import { Button, ButtonLink } from './ui';

interface DigitalBusinessCardProps {
  cardId: string;
  orderId?: string;
  showActions?: boolean;
  className?: string;
}

export default function DigitalBusinessCard({ cardId, orderId, showActions = true, className = '' }: DigitalBusinessCardProps) {
  const { settings } = useStore();
  const { toast } = useUI();
  const { copy, copied } = useClipboard();
  const [downloading, setDownloading] = useState(false);

  const url = cardUrl(cardId);
  const elementId = `business-card-node-${cardId}`;

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      await downloadDigitalBusinessCardPDF({
        cardId,
        orderId: orderId || cardId,
        settings,
        elementId,
      });
      toast('Digital Business Card PDF downloaded successfully.');
    } catch (err) {
      console.error(err);
      toast('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`digital-business-card-wrapper ${className}`}>
      {/* Visual Business Card (3.5" x 2" Aspect Ratio) */}
      <div id={elementId} className="digital-business-card-container">
        <div className="card-outer-border">
          <div className="card-inner-frame">
            {/* Left Column: Store Details ONLY */}
            <div className="card-left-section">
              <div className="card-brand-header">
                <span className="card-brand-tag">DIGITAL BUSINESS CARD</span>
                <h3 className="card-shop-name">{settings.name || 'AUREL FINE JEWELLERY'}</h3>
              </div>

              <div className="card-divider" />

              <div className="card-info-grid">
                <div className="card-info-block">
                  <span className="card-info-label">ATELIER ADDRESS</span>
                  <p className="card-info-text">{settings.address || 'Ghod Dod Road, Surat, Gujarat 395007'}</p>
                </div>

                <div className="card-info-block">
                  <span className="card-info-label">MOBILE / PHONE</span>
                  <p className="card-info-text highlight">{settings.phone || '+91 261 555 0188'}</p>
                </div>

                <div className="card-info-block">
                  <span className="card-info-label">EMAIL & WEBSITE</span>
                  <p className="card-info-text">{settings.email || 'care@aurel-jewellery.com'}</p>
                  <p className="card-info-subtext">{window.location.host}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Scannable QR Code */}
            <div className="card-right-section">
              <div className="qr-frame">
                <QRCodeSVG
                  value={url}
                  size={140}
                  level="H"
                  marginSize={2}
                  bgColor="#FFFDF9"
                  fgColor="#51412c"
                  title={`Scan QR code for order invoice and details - ${cardId}`}
                />
              </div>
              <span className="qr-caption">SCAN FOR INVOICE & ORDER</span>
              <span className="card-id-code">CARD: {cardId}</span>
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
            {downloading ? 'GENERATING PDF...' : 'DOWNLOAD BUSINESS CARD (PDF)'}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              if (await copy(url)) {
                toast('QR Code link copied to clipboard!');
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
            OPEN ORDER & INVOICE <ExternalLink size={14} />
          </ButtonLink>
        </div>
      )}

      <div className="card-notice">
        <ShieldCheck size={14} />
        <span>This business card contains only shop contact details and the QR code for order scanning.</span>
      </div>
    </div>
  );
}
