import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Order, StoreSettings } from '../types';
import { cardUrl, formatDate, money } from '../lib/storage';

interface GenerateCardOptions {
  cardId: string;
  orderId: string;
  settings: StoreSettings;
  elementId?: string;
}

/**
 * Generates a high-quality PDF of the Digital Business Card.
 * CONTAINS ONLY: Shop Name, Address, Mobile Number, Email/Website, and QR Code.
 * NO OTHER DETAILS (No order items, customer details, or prices).
 */
export async function downloadDigitalBusinessCardPDF({ cardId, settings, elementId }: GenerateCardOptions): Promise<void> {
  const targetElement = elementId ? document.getElementById(elementId) : null;

  if (targetElement) {
    try {
      const canvas = await html2canvas(targetElement, {
        scale: 4, // Ultra crisp resolution for QR code scanning
        useCORS: true,
        backgroundColor: '#fffdf9',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      // Standard Business Card dimensions: 3.5in x 2in (88.9mm x 50.8mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [88.9, 50.8],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 88.9, 50.8);
      pdf.save(`Aurel-BusinessCard-${cardId}.pdf`);
      return;
    } catch (err) {
      console.warn('HTML canvas export failed, falling back to vector PDF generation:', err);
    }
  }

  // Fallback programmatic jsPDF generator (guaranteed pure PDF output)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [88.9, 50.8], // 3.5" x 2" business card
  });

  const width = 88.9;
  const height = 50.8;

  // Background - Luxury Off-White / Cream
  pdf.setFillColor(255, 253, 249);
  pdf.rect(0, 0, width, height, 'F');

  // Outer Gold Border
  pdf.setDrawColor(212, 175, 55); // Gold
  pdf.setLineWidth(0.6);
  pdf.rect(2.5, 2.5, width - 5, height - 5, 'S');

  // Inner Accent Line
  pdf.setDrawColor(180, 150, 90);
  pdf.setLineWidth(0.2);
  pdf.rect(3.5, 3.5, width - 7, height - 7, 'S');

  // Header / Shop Name
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(81, 65, 44); // Warm Dark Bronze #51412c
  pdf.text((settings.name || 'AUREL FINE JEWELLERY').toUpperCase(), 7, 10);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(150, 130, 100);
  pdf.text('DIGITAL BUSINESS CARD • SCAN FOR ORDER & INVOICE', 7, 13);

  // Divider line
  pdf.setDrawColor(220, 210, 190);
  pdf.setLineWidth(0.3);
  pdf.line(7, 15.5, width - 35, 15.5);

  // Shop Details (Left Column) - ONLY Shop Info!
  let y = 20;

  // Address
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(100, 80, 50);
  pdf.text('ATELIER ADDRESS', 7, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(50, 40, 30);
  const splitAddress = pdf.splitTextToSize(settings.address || 'Ghod Dod Road, Surat, Gujarat 395007', width - 42);
  pdf.text(splitAddress, 7, y + 3.5);

  y += 3.5 + (splitAddress.length * 3);

  // Mobile / Phone
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(100, 80, 50);
  pdf.text('MOBILE / CONTACT', 7, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.5);
  pdf.setTextColor(50, 40, 30);
  pdf.text(settings.phone || '+91 261 555 0188', 7, y + 3.5);

  y += 7.5;

  // Email & Website
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(100, 80, 50);
  pdf.text('EMAIL & WEBSITE', 7, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(50, 40, 30);
  pdf.text(settings.email || 'care@aurel-jewellery.com', 7, y + 3.5);
  pdf.text(window.location.host, 7, y + 7);

  // Render QR Code on Right Side
  const qrUrl = cardUrl(cardId);
  try {
    const qrChartUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&color=51412c&bgcolor=fffdf9`;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      img.src = qrChartUrl;
    });
    pdf.addImage(img, 'PNG', width - 33, 10, 27, 27);
  } catch {
    // Basic QR box if image fails to load
    pdf.setDrawColor(81, 65, 44);
    pdf.rect(width - 33, 10, 27, 27, 'S');
  }

  // Label under QR Code
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(5.5);
  pdf.setTextColor(140, 110, 70);
  pdf.text('SCAN QR FOR INVOICE', width - 33 + 13.5, 40, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5);
  pdf.setTextColor(160, 140, 120);
  pdf.text(`CARD ID: ${cardId}`, width - 33 + 13.5, 43, { align: 'center' });

  // Save the PDF file
  pdf.save(`Aurel-Digital-Business-Card-${cardId}.pdf`);
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
