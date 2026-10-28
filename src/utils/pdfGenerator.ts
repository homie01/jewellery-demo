import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Order, StoreSettings, GemstoneDetails } from '../types';
import { formatDate, money, productUrl, readStorage } from '../lib/storage';
import { findProduct } from '../data/products';
import { seedOrders } from '../data/demo';

export interface GenerateCardOptions {
  cardId: string;
  orderId: string;
  settings?: StoreSettings;
  elementId?: string;
  order?: Order;
  clientName?: string;
  gem?: GemstoneDetails;
  summaryNo?: string;
  productId?: string;
  productUrl?: string;
}

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

function standardizeCardElement(card: HTMLElement) {
  card.style.position = 'relative';
  card.style.width = '640px';
  card.style.minWidth = '640px';
  card.style.maxWidth = '640px';
  card.style.minHeight = '405px';
  card.style.height = 'auto';
  card.style.aspectRatio = 'auto';
  card.style.overflow = 'visible';
  card.style.transform = 'none';
  card.style.boxShadow = 'none';
  card.style.borderRadius = '10px';
  card.style.border = '1.5px solid #bfdbfe';
  card.style.boxSizing = 'border-box';
  card.style.margin = '0 0 24px 0';
  card.style.padding = '14px 18px 12px';
  card.style.backgroundColor = '#ffffff';

  // Header Section
  const header = card.querySelector<HTMLElement>('.sample-cert-header');
  if (header) {
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.width = '100%';
    header.style.margin = '0 0 2px 0';
    header.style.padding = '0';
  }

  const headerLeft = card.querySelector<HTMLElement>('.sample-cert-header-left');
  if (headerLeft) {
    headerLeft.style.display = 'flex';
    headerLeft.style.alignItems = 'center';
    headerLeft.style.margin = '0';
    headerLeft.style.padding = '0';
  }

  const gemClusterIcon = card.querySelector<HTMLElement>('.sample-gem-cluster-icon');
  if (gemClusterIcon) {
    gemClusterIcon.style.width = '38px';
    gemClusterIcon.style.height = '38px';
    gemClusterIcon.style.minWidth = '38px';
    gemClusterIcon.style.minHeight = '38px';
    gemClusterIcon.style.borderRadius = '50%';
    gemClusterIcon.style.overflow = 'hidden';
    gemClusterIcon.style.border = '1.5px solid #2374b5';
    gemClusterIcon.style.flexShrink = '0';
    gemClusterIcon.style.margin = '0 12px 0 0';
    gemClusterIcon.style.padding = '0';
    gemClusterIcon.style.display = 'inline-flex';
    gemClusterIcon.style.alignItems = 'center';
    gemClusterIcon.style.justifyContent = 'center';
  }

  const clusterImg = card.querySelector<HTMLElement>('.sample-cluster-img');
  if (clusterImg) {
    clusterImg.style.width = '100%';
    clusterImg.style.height = '100%';
    clusterImg.style.objectFit = 'cover';
    clusterImg.style.display = 'block';
  }

  const originalText = card.querySelector<HTMLElement>('.sample-original-text');
  if (originalText) {
    originalText.style.fontFamily = "'Source Serif 4', Georgia, serif";
    originalText.style.fontSize = '30px';
    originalText.style.fontWeight = '700';
    originalText.style.color = '#2374b5';
    originalText.style.letterSpacing = '2px';
    originalText.style.lineHeight = '1';
    originalText.style.margin = '0';
    originalText.style.padding = '0';
    originalText.style.marginTop = '0';
    originalText.style.marginBottom = '0';
    originalText.style.display = 'inline-block';
    originalText.style.verticalAlign = 'middle';
    originalText.style.alignSelf = 'center';
  }

  const headerRight = card.querySelector<HTMLElement>('.sample-cert-header-right');
  if (headerRight) {
    headerRight.style.display = 'flex';
    headerRight.style.flexDirection = 'column';
    headerRight.style.alignItems = 'flex-end';
    headerRight.style.textAlign = 'right';
    headerRight.style.margin = '0';
    headerRight.style.padding = '0';
  }

  const labLines = card.querySelectorAll<HTMLElement>('.sample-lab-name-line');
  labLines.forEach((line) => {
    line.style.margin = '0';
    line.style.padding = '0';
    line.style.lineHeight = '1.22';
    line.style.fontSize = '10px';
    line.style.fontWeight = '700';
    line.style.color = '#1d70b8';
    line.style.letterSpacing = '0.8px';
  });

  const divider = card.querySelector<HTMLElement>('.sample-blue-divider');
  if (divider) {
    divider.style.width = '100%';
    divider.style.height = '3px';
    divider.style.backgroundColor = '#2374b5';
    divider.style.margin = '6px 0 8px';
  }

  const body = card.querySelector<HTMLElement>('.sample-cert-body');
  if (body) {
    body.style.display = 'flex';
    body.style.justifyContent = 'space-between';
    body.style.gap = '14px';
    body.style.overflow = 'visible';
  }

  const specsCol = card.querySelector<HTMLElement>('.sample-specs-col');
  if (specsCol) {
    specsCol.style.flex = '1';
    specsCol.style.minWidth = '0';
    specsCol.style.display = 'flex';
    specsCol.style.flexDirection = 'column';
    specsCol.style.gap = '2.5px';
    specsCol.style.overflow = 'visible';
  }

  // Ensure NO client information or specs are cut off
  const specRows = card.querySelectorAll<HTMLElement>('.sample-spec-row');
  specRows.forEach((row) => {
    row.style.display = 'flex';
    row.style.alignItems = 'baseline';
    row.style.fontSize = '10.2px';
    row.style.lineHeight = '1.25';
    row.style.color = '#0f172a';
    row.style.gap = '2px';
  });

  const labels = card.querySelectorAll<HTMLElement>('.sample-spec-label');
  labels.forEach((lbl) => {
    lbl.style.width = '116px';
    lbl.style.minWidth = '116px';
    lbl.style.flexShrink = '0';
    lbl.style.fontSize = '10.2px';
    lbl.style.fontWeight = '700';
    lbl.style.color = '#1e293b';
    lbl.style.whiteSpace = 'nowrap';
  });

  const colons = card.querySelectorAll<HTMLElement>('.sample-spec-colon');
  colons.forEach((c) => {
    c.style.width = '10px';
    c.style.minWidth = '10px';
    c.style.flexShrink = '0';
    c.style.fontSize = '10.2px';
    c.style.fontWeight = '700';
    c.style.textAlign = 'center';
    c.style.marginRight = '4px';
  });

  const values = card.querySelectorAll<HTMLElement>('.sample-spec-val');
  values.forEach((v) => {
    v.style.flex = '1';
    v.style.minWidth = '0';
    v.style.fontSize = '10.2px';
    v.style.fontWeight = '500';
    v.style.color = '#0f172a';
    v.style.overflow = 'visible';
    v.style.whiteSpace = 'normal';
    v.style.wordBreak = 'break-word';
    v.style.textOverflow = 'clip';
  });

  const rightCol = card.querySelector<HTMLElement>('.sample-right-col');
  if (rightCol) {
    rightCol.style.width = '160px';
    rightCol.style.minWidth = '160px';
    rightCol.style.flexShrink = '0';
    rightCol.style.display = 'flex';
    rightCol.style.flexDirection = 'column';
    rightCol.style.alignItems = 'center';
    rightCol.style.justifyContent = 'space-between';
    rightCol.style.textAlign = 'center';
  }

  const redBox = card.querySelector<HTMLElement>('.sample-red-stone-box');
  if (redBox) {
    redBox.style.width = '100%';
    redBox.style.padding = '4px 6px';
    redBox.style.border = '1.4px solid #0f172a';
    redBox.style.boxSizing = 'border-box';
  }

  const redText = card.querySelector<HTMLElement>('.sample-red-stone-text');
  if (redText) {
    redText.style.fontSize = '10.8px';
    redText.style.fontWeight = '800';
    redText.style.color = '#dc2626';
    redText.style.letterSpacing = '0.5px';
    redText.style.display = 'block';
  }

  const specimenBox = card.querySelector<HTMLElement>('.sample-specimen-box');
  if (specimenBox) {
    specimenBox.style.width = '88px';
    specimenBox.style.height = '88px';
    specimenBox.style.margin = '4px auto';
  }

  const specimenImg = card.querySelector<HTMLElement>('.sample-specimen-photo');
  if (specimenImg) {
    specimenImg.style.maxWidth = '100%';
    specimenImg.style.maxHeight = '100%';
    specimenImg.style.objectFit = 'contain';
  }

  const captions = card.querySelectorAll<HTMLElement>('.sample-blue-caption');
  captions.forEach((cap) => {
    cap.style.fontSize = '7.5px';
    cap.style.fontWeight = '700';
    cap.style.color = '#1d70b8';
    cap.style.margin = '1px 0';
  });

  const qrWrapper = card.querySelector<HTMLElement>('.sample-front-qr-wrapper');
  if (qrWrapper) {
    qrWrapper.style.padding = '3px 6px';
    qrWrapper.style.marginTop = '4px';
    qrWrapper.style.gap = '6px';
  }

  // Back card elements
  const backContainer = card.querySelector<HTMLElement>('.sample-back-container');
  if (backContainer) {
    backContainer.style.height = '100%';
    backContainer.style.minHeight = '375px';
    backContainer.style.display = 'flex';
    backContainer.style.flexDirection = 'column';
    backContainer.style.justifyContent = 'space-between';
  }

  const backMain = card.querySelector<HTMLElement>('.sample-back-main');
  if (backMain) {
    backMain.style.display = 'flex';
    backMain.style.gap = '14px';
    backMain.style.margin = '8px 0';
    backMain.style.flex = '1';
  }

  const termsBox = card.querySelector<HTMLElement>('.sample-back-terms-box');
  if (termsBox) {
    termsBox.style.fontSize = '8.5px';
    termsBox.style.lineHeight = '1.35';
    termsBox.style.padding = '6px 8px';
  }

  const qrBlock = card.querySelector<HTMLElement>('.sample-back-qr-block');
  if (qrBlock) {
    qrBlock.style.width = '130px';
    qrBlock.style.flexShrink = '0';
  }
}

function buildDynamicCertificateElements(
  cardId: string,
  clientName: string,
  gem: GemstoneDetails,
  summaryNo: string,
  productUrlString: string,
  productId: string
): { front: HTMLElement; back: HTMLElement } {
  const front = document.createElement('div');
  front.id = `idgl-front-node-${cardId}`;
  front.className = 'idgl-card sample-cert-card sample-cert-front';
  front.innerHTML = `
    <div class="sample-cert-header">
      <div class="sample-cert-header-left">
        <div class="sample-gem-cluster-icon">
          <img src="/images/gemstones/navaratna-cluster.jpg" alt="Navaratna Gemstones Cluster" class="sample-cluster-img" />
        </div>
        <h2 class="sample-original-text">ORIGINAL</h2>
      </div>
      <div class="sample-cert-header-right">
        <h3 class="sample-lab-name-line">INTERNATIONAL</h3>
        <h3 class="sample-lab-name-line">GEMS &amp; DIAMOND</h3>
        <h3 class="sample-lab-name-line">TESTING LABORATORY</h3>
      </div>
    </div>
    <div class="sample-blue-divider"></div>
    <div class="sample-cert-body">
      <div class="sample-specs-col">
        <div class="sample-spec-row">
          <span class="sample-spec-label">Clients Name</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val font-semibold">${clientName}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Weight</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.caratWeight}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Colour</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.colour}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Measurement-Approx</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.measurement}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Shape &amp; Cut</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.shapeCut}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Mounted/Unmounted</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.mounted}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Refractive Index</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.refractiveIndex}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Specific Gravity</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.specificGravity}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Hardness</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.hardness}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">U.V. Test</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.uvTest}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Microscopic Obs</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.microscopicObs}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Spectroscopic Obs</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.spectroscopicObs}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Indian Trade Name</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val font-semibold">${gem.indianTradeName}</span>
        </div>
        <div class="sample-spec-row">
          <span class="sample-spec-label">Comment.</span>
          <span class="sample-spec-colon">:</span>
          <span class="sample-spec-val">${gem.comment}</span>
        </div>
      </div>
      <div class="sample-right-col">
        <div class="sample-red-stone-box">
          <span class="sample-red-stone-text">${gem.stoneName}</span>
        </div>
        <div class="sample-specimen-box">
          <img src="${gem.specimenImage}" alt="${gem.stoneName} Specimen" class="sample-specimen-photo" />
        </div>
        <div class="sample-specimen-captions">
          <p class="sample-blue-caption">SPECIMEN SUBMITTED FOR TEST</p>
          <p class="sample-blue-caption">IN GEMSTONE IDENTIFIED TO</p>
        </div>
        <div class="sample-front-qr-wrapper">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(productUrlString)}&color=081C2D&bgcolor=FFFFFF" style="width:36px;height:36px;display:block;" alt="Product QR" />
          <span class="sample-qr-tag">SCAN PIECE</span>
        </div>
      </div>
    </div>
  `;

  const back = document.createElement('div');
  back.className = 'idgl-card sample-cert-card sample-cert-back';
  back.innerHTML = `
    <div class="sample-back-container">
      <div class="sample-back-top">
        <div class="sample-back-header-left">
          <div class="sample-back-mini-gem">
            <img src="/images/gemstones/navaratna-cluster.jpg" alt="Logo" />
          </div>
          <div>
            <h4 class="sample-back-title">IDENTIFICATION REPORT &amp; SECURITY VERIFICATION</h4>
            <p class="sample-back-sub">INTERNATIONAL GEMS &amp; DIAMOND TESTING LABORATORY</p>
          </div>
        </div>
        <div class="sample-back-header-right">
          <span class="sample-back-cert-label">SUMMARY NO. / CERTIFICATE ID</span>
          <span class="sample-back-cert-value">${summaryNo}</span>
        </div>
      </div>
      <div class="sample-back-main">
        <div class="sample-back-qr-block">
          <div class="sample-back-qr-frame">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(productUrlString)}&color=081C2D&bgcolor=FFFFFF" class="sample-back-qr-img" alt="Product QR" />
          </div>
          <span class="sample-back-scan-callout">SCAN TO OPEN FEATURED PIECE</span>
          <span class="sample-back-url-hint">aurel-jewellery.com/product/${productId}</span>
        </div>
        <div class="sample-back-info-block">
          <div class="sample-back-seals">
            <div class="sample-back-hologram-seal">
              <span class="hologram-star">★ ★ ★</span>
              <span class="hologram-text">ORIGINAL LAB REPORT</span>
              <span class="hologram-sub">GENUINE SPECIMEN TESTED</span>
            </div>
          </div>
          <div class="sample-back-terms-box">
            <p><span class="sample-bold-term">IMPORTANT NOTICE:</span> This certificate represents the opinion of the laboratory gemologists at the time of examination using standard gemological testing instruments.</p>
            <p>Weight, dimensions, refractive index and optical properties are determined within accepted scientific tolerances. The laboratory assumes no financial liability for differences of opinion.</p>
          </div>
        </div>
      </div>
      <div class="sample-back-bottom">
        <div class="sample-back-auth-sign">
          <span class="sample-sign-label">CHIEF GEMOLOGIST &amp; LAB DIRECTOR</span>
          <span class="sample-sign-signature">Dr. K. R. Mehta, F.G.A., D.G.</span>
        </div>
        <div style="font-size: 8px; font-weight: 700; color: #64748b; letter-spacing: 1.5px;">
          ||||| | |||| ||| |||||| | ||||| | |||
        </div>
      </div>
    </div>
  `;

  return { front, back };
}

/**
 * Generates an authentic high-resolution 2-page PDF of the Gemstone Laboratory Certificate Card.
 * Page 1: Front side (Full client name, gemological testing specs, gemstone specimen photo, red stone box).
 * Page 2: Back side (Security verification, terms & conditions, barcode, official lab credentials).
 */
export async function downloadDigitalBusinessCardPDF(options: GenerateCardOptions): Promise<void> {
  const { cardId, orderId } = options;
  const frontElement = document.getElementById(`idgl-front-node-${cardId}`);
  const backElement = document.getElementById(`idgl-back-node-${cardId}`);

  // Resolve order and customer/gemstone details
  const storedOrders = readStorage<Order[]>('aurel.orders.v2', seedOrders);
  const matchedOrder = options.order || storedOrders.find((o) => o.id === orderId || o.id === cardId);
  const clientName = options.clientName || matchedOrder?.customer?.name || 'Bhaveshbhai soni';
  const firstItem = matchedOrder?.items?.[0];
  const matchedProduct = firstItem ? findProduct(firstItem.productId) : undefined;
  const gem: GemstoneDetails = options.gem || firstItem?.gemstoneDetails || matchedProduct?.gemstoneDetails || defaultGemstone;
  const summaryNo = options.summaryNo || (cardId ? (cardId.length > 13 ? cardId.slice(0, 13) : cardId.padStart(13, '0')) : '0108261732001');
  const productId = options.productId || firstItem?.productId || matchedProduct?.id || 'pukhraj-yellow-sapphire-bracelet';
  const targetProductUrl = options.productUrl || productUrl(productId);

  // Setup offscreen standard staging container
  const staging = document.createElement('div');
  staging.id = `idgl-pdf-staging-${cardId}`;
  staging.style.cssText = `
    position: fixed !important;
    left: -99999px !important;
    top: 0 !important;
    width: 640px !important;
    z-index: -99999 !important;
    background: #ffffff !important;
    pointer-events: none !important;
    opacity: 1 !important;
    overflow: visible !important;
  `;
  document.body.appendChild(staging);

  try {
    let frontNode: HTMLElement;
    let backNode: HTMLElement;

    if (frontElement && backElement) {
      frontNode = frontElement.cloneNode(true) as HTMLElement;
      backNode = backElement.cloneNode(true) as HTMLElement;
      frontNode.classList.remove('idgl-offscreen-pdf-target');
      backNode.classList.remove('idgl-offscreen-pdf-target');
    } else {
      const generated = buildDynamicCertificateElements(cardId, clientName, gem, summaryNo, targetProductUrl, productId);
      frontNode = generated.front;
      backNode = generated.back;
    }

    standardizeCardElement(frontNode);
    standardizeCardElement(backNode);

    staging.appendChild(frontNode);
    staging.appendChild(backNode);

    // Wait for all images inside staging to finish loading
    const images = staging.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
    // Microtask pause for layout settlement
    await new Promise((resolve) => setTimeout(resolve, 80));

    const frontCanvas = await html2canvas(frontNode, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
    });

    const backCanvas = await html2canvas(backNode, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
    });

    const frontImg = frontCanvas.toDataURL('image/png', 1.0);
    const backImg = backCanvas.toDataURL('image/png', 1.0);

    const cardWidth = 88.9; // 3.5 inches standard card width in mm
    const frontCardHeight = (frontCanvas.height * cardWidth) / frontCanvas.width;
    const backCardHeight = (backCanvas.height * cardWidth) / backCanvas.width;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [cardWidth, frontCardHeight],
    });

    // PAGE 1: Front Cover of Gemstone Laboratory Certificate (Client info, gemstone specs, specimen photo)
    pdf.addImage(frontImg, 'PNG', 0, 0, cardWidth, frontCardHeight);

    // PAGE 2: Back Security & Verification
    pdf.addPage([cardWidth, backCardHeight], 'landscape');
    pdf.addImage(backImg, 'PNG', 0, 0, cardWidth, backCardHeight);

    pdf.save(`IGDTL-Gemstone-Certificate-${cardId}.pdf`);
  } catch (err) {
    console.error('Gemstone Certificate Card PDF export error:', err);
    throw err;
  } finally {
    staging.remove();
  }
}

/**
 * Generates a full Order Invoice PDF document.
 */
export async function downloadOrderInvoicePDF(order: Order, settings: StoreSettings): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();

  // Header Banner
  pdf.setFillColor(81, 65, 44); // Dark Bronze
  pdf.rect(0, 0, pageWidth, 28, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 253, 249);
  pdf.text((settings.name || 'AUREL FINE JEWELLERY').toUpperCase(), 15, 15);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(220, 200, 170);
  pdf.text('OFFICIAL TAX INVOICE & ORDER SUMMARY', 15, 22);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 253, 249);
  pdf.text(`INVOICE #${order.id}`, pageWidth - 15, 15, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Date: ${formatDate(order.date, true)}`, pageWidth - 15, 22, { align: 'right' });

  let y = 38;

  // Store & Customer Info Section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(81, 65, 44);
  pdf.text('ISSUED BY', 15, y);
  pdf.text('BILLED TO', 115, y);

  pdf.setDrawColor(200, 180, 150);
  pdf.setLineWidth(0.3);
  pdf.line(15, y + 2, 95, y + 2);
  pdf.line(115, y + 2, 195, y + 2);

  y += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(50, 40, 30);

  // Store Details
  pdf.text(settings.name, 15, y);
  pdf.text(settings.address, 15, y + 4.5);
  pdf.text(`Phone: ${settings.phone}`, 15, y + 9);
  pdf.text(`Email: ${settings.email}`, 15, y + 13.5);

  // Customer Details
  pdf.text(order.customer.name, 115, y);
  pdf.text(`${order.customer.address}, ${order.customer.city}`, 115, y + 4.5);
  pdf.text(`${order.customer.state} - ${order.customer.pincode}`, 115, y + 9);
  pdf.text(`Phone: ${order.customer.phone} | Email: ${order.customer.email}`, 115, y + 13.5);

  y += 22;

  // Items Table Header
  pdf.setFillColor(245, 240, 230);
  pdf.rect(15, y, pageWidth - 30, 8, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(81, 65, 44);
  pdf.text('ITEM DESCRIPTION', 20, y + 5.5);
  pdf.text('SIZE', 105, y + 5.5);
  pdf.text('QTY', 130, y + 5.5);
  pdf.text('PRICE', 155, y + 5.5);
  pdf.text('TOTAL', pageWidth - 20, y + 5.5, { align: 'right' });

  y += 10;

  // Items List
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(40, 30, 20);

  order.items.forEach((item) => {
    pdf.text(item.name, 20, y);
    pdf.text(item.size || 'Standard', 105, y);
    pdf.text(String(item.quantity), 130, y);
    pdf.text(money(item.price), 155, y);
    pdf.text(money(item.price * item.quantity), pageWidth - 20, y, { align: 'right' });

    pdf.setDrawColor(240, 235, 225);
    pdf.line(15, y + 3, pageWidth - 15, y + 3);
    y += 8;
  });

  y += 5;

  // Totals Section
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Subtotal:', 140, y);
  pdf.text(money(order.subtotal), pageWidth - 20, y, { align: 'right' });

  y += 5;
  pdf.text(`Delivery (${order.deliveryMethod}):`, 140, y);
  pdf.text(order.shipping === 0 ? 'Complimentary' : money(order.shipping), pageWidth - 20, y, { align: 'right' });

  y += 5;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(81, 65, 44);
  pdf.text('Grand Total:', 140, y);
  pdf.text(money(order.total), pageWidth - 20, y, { align: 'right' });

  y += 12;

  // Payment Status Box
  pdf.setFillColor(250, 246, 240);
  pdf.setDrawColor(212, 175, 55);
  pdf.rect(15, y, pageWidth - 30, 18, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(81, 65, 44);
  pdf.text(`PAYMENT METHOD: ${order.paymentMethod.toUpperCase()}`, 20, y + 6);
  pdf.text(`PAYMENT STATUS: ${order.paymentStatus.toUpperCase()}`, 20, y + 12);
  pdf.text(`ORDER STATUS: ${order.status.toUpperCase()}`, 115, y + 6);

  // Footer Note
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(140, 120, 100);
  pdf.text('Thank you for choosing Aurel Fine Jewellery. For queries, please contact concierge@aurel.com', pageWidth / 2, 285, { align: 'center' });

  pdf.save(`Aurel-Invoice-${order.id}.pdf`);
}
