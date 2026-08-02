import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import mibuksLogoUrl from "@/assets/logo.png";

export interface BusinessHeaderInfo {
  business_name?: string | null;
  business_type?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  branchName?: string | null;
}

export interface PDFPartyInfo {
  label?: string; // e.g., "BILL TO", "CUSTOMER", "SUPPLIER"
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  business_type?: string | null;
}

export interface SummaryStatCard {
  label: string;
  value: string;
  subtext?: string;
}

export interface PDFDocumentConfig {
  docType?: "invoice" | "receipt" | "report" | "statement" | "sale";
  title: string;              // e.g. "INVOICE", "OFFICIAL RECEIPT", "SALES REPORT"
  docNumber?: string;         // e.g. "# INV-0042"
  subtitle?: string;          // e.g. "Sales & Financial Summary"
  date?: string;              // e.g. "Jul 31, 2026"
  dueDate?: string;           // e.g. "Aug 15, 2026"
  status?: string;            // e.g. "PAID", "SENT", "OVERDUE", "DRAFT"
  paymentMethod?: string;     // e.g. "Cash", "Orange Money", "Bank Transfer"
  business: BusinessHeaderInfo;
  customer?: PDFPartyInfo;
  supplier?: PDFPartyInfo;
  summaryCards?: SummaryStatCard[];
  notes?: string;
  terms?: string;
  footerNote?: string;
}

/**
 * Asynchronously converts an image URL into a base64 Data URL so jsPDF can embed it reliably.
 */
export async function getImageDataUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image")) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      } catch (err) {
        console.warn("Failed to convert image to canvas data URL:", err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Prepares a modern jsPDF document with business logo, header branding, and entity info.
 */
export async function createModernPDFDocument(config: PDFDocumentConfig): Promise<{ doc: jsPDF; startY: number }> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // 1. Top Accent Stripe
  doc.setFillColor(15, 23, 42); // Dark Slate #0F172A
  doc.rect(0, 0, pageWidth, 4, "F");

  // 2. Fetch/Load Logo
  let logoDataUrl: string | null = null;
  if (config.business.logoUrl) {
    logoDataUrl = await getImageDataUrl(config.business.logoUrl);
  }
  if (!logoDataUrl) {
    logoDataUrl = await getImageDataUrl(mibuksLogoUrl);
  }

  let textLeft = margin;
  const headerTop = 10;

  // Render Logo if available
  if (logoDataUrl) {
    try {
      const logoWidth = 26;
      const logoHeight = 14;
      doc.addImage(logoDataUrl, "PNG", margin, headerTop, logoWidth, logoHeight);
      textLeft = margin + logoWidth + 4;
    } catch (e) {
      console.warn("Could not add logo image to PDF:", e);
    }
  }

  // 3. Business Name & Contact Info (Left Header)
  const businessName = config.business.business_name || "MiBuks Business";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text(businessName, textLeft, headerTop + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // #475569

  let bInfoY = headerTop + 9.5;
  if (config.business.address) {
    doc.text(config.business.address, textLeft, bInfoY);
    bInfoY += 3.8;
  }
  const contactLine = [
    config.business.phone ? `Tel: ${config.business.phone}` : null,
    config.business.email ? `Email: ${config.business.email}` : null,
  ].filter(Boolean).join(" | ");

  if (contactLine) {
    doc.text(contactLine, textLeft, bInfoY);
    bInfoY += 3.8;
  }

  if (config.business.branchName) {
    doc.setFont("helvetica", "bold");
    doc.text(`Branch: ${config.business.branchName}`, textLeft, bInfoY);
    bInfoY += 3.8;
  }

  // 4. Document Title & Metadata (Right Header)
  const rightX = pageWidth - margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(config.title.toUpperCase(), rightX, headerTop + 5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  let metaY = headerTop + 10;

  if (config.docNumber) {
    doc.setFont("helvetica", "bold");
    doc.text(config.docNumber, rightX, metaY, { align: "right" });
    metaY += 4.2;
  }

  doc.setFont("helvetica", "normal");
  if (config.date) {
    doc.text(`Date: ${config.date}`, rightX, metaY, { align: "right" });
    metaY += 4;
  }
  if (config.dueDate) {
    doc.text(`Due Date: ${config.dueDate}`, rightX, metaY, { align: "right" });
    metaY += 4;
  }

  // Status Badge Pill (Right aligned beneath date)
  if (config.status) {
    const statusText = config.status.toUpperCase();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);

    const textWidth = doc.getTextWidth(statusText);
    const badgePadding = 3;
    const badgeWidth = textWidth + badgePadding * 2;
    const badgeHeight = 5;
    const badgeX = rightX - badgeWidth;
    const badgeY = metaY + 1;

    let bgR = 241, bgG = 245, bgB = 249; // Default Slate Light
    let textR = 71, textG = 85, textB = 105;

    const lower = config.status.toLowerCase();
    if (lower === "paid" || lower === "completed") {
      bgR = 220; bgG = 252; bgB = 231; // Light Emerald
      textR = 21; textG = 128; textB = 61; // Dark Emerald
    } else if (lower === "overdue" || lower === "cancelled") {
      bgR = 254; bgG = 226; bgB = 226; // Light Red
      textR = 185; textG = 28; textB = 28; // Dark Red
    } else if (lower === "pending" || lower === "sent") {
      bgR = 219; bgG = 234; bgB = 254; // Light Blue
      textR = 29; textG = 78; textB = 216; // Dark Blue
    }

    doc.setFillColor(bgR, bgG, bgB);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, "F");

    doc.setTextColor(textR, textG, textB);
    doc.text(statusText, badgeX + badgePadding, badgeY + 3.6);

    metaY += 7;
  }

  // 5. Header Divider Line
  let currentY = Math.max(bInfoY, metaY) + 4;
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // 6. Subtitle or Summary Statement if provided
  if (config.subtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(config.subtitle, margin, currentY);
    currentY += 5;
  }

  // 7. Party Card Box (Bill To / Customer / Supplier Details)
  const party = config.customer || config.supplier;
  if (party && (party.name || party.phone || party.email)) {
    const boxHeight = 22;
    doc.setFillColor(248, 250, 252); // #F8FAFC
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "FD");

    // Left Column: Recipient
    const partyLabel = party.label || (config.supplier ? "SUPPLIER DETAILS" : "BILL TO");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(partyLabel, margin + 4, currentY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(party.name || "Walk-in Customer", margin + 4, currentY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    let pSubY = currentY + 14.5;
    const details = [
      party.phone ? `Phone: ${party.phone}` : null,
      party.email ? `Email: ${party.email}` : null,
      party.address ? `Addr: ${party.address}` : null,
    ].filter(Boolean).join("  |  ");

    if (details) {
      doc.text(details, margin + 4, pSubY);
    }

    // Right Column: Additional Transaction Details
    if (config.paymentMethod || config.dueDate) {
      const rightColX = margin + contentWidth / 2 + 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("PAYMENT INFO", rightColX, currentY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      let pRightY = currentY + 10;
      if (config.paymentMethod) {
        doc.text(`Method: ${config.paymentMethod}`, rightColX, pRightY);
        pRightY += 4.5;
      }
      if (config.currency) {
        doc.text(`Currency: ${config.currency}`, rightColX, pRightY);
      }
    }

    currentY += boxHeight + 6;
  }

  // 8. Summary Stat Cards (For Reports)
  if (config.summaryCards && config.summaryCards.length > 0) {
    const cardCount = config.summaryCards.length;
    const gap = 3;
    const cardWidth = (contentWidth - gap * (cardCount - 1)) / cardCount;
    const cardHeight = 16;

    config.summaryCards.forEach((card, idx) => {
      const cardX = margin + idx * (cardWidth + gap);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, "FD");

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label.toUpperCase(), cardX + 3, currentY + 4.5);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cardX + 3, currentY + 10.5);

      if (card.subtext) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(card.subtext, cardX + 3, currentY + 14);
      }
    });

    currentY += cardHeight + 6;
  }

  return { doc, startY: currentY };
}

/**
 * Executes autoTable with consistent modern styling.
 */
export function renderModernTable(doc: jsPDF, options: UserOptions) {
  const margin = 14;

  autoTable(doc, {
    margin: { left: margin, right: margin, top: 15, bottom: 20 },
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42], // #0F172A
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      halign: "left",
      valign: "middle",
    },
    bodyStyles: {
      textColor: [51, 65, 85], // #334155
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // #F8FAFC
    },
    tableLineWidth: 0.1,
    tableLineColor: [226, 232, 240], // #E2E8F0
    ...options,
  });
}

/**
 * Adds totals block (subtotal, paid, total) and notes at the bottom of the document.
 */
export function addTotalsAndNotes(
  doc: jsPDF,
  options: {
    totals: Array<{ label: string; value: string; isBold?: boolean; isHighlight?: boolean }>;
    notes?: string;
    terms?: string;
    startY: number;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = options.startY + 4;

  const totalsWidth = 75;
  const notesWidth = contentWidth - totalsWidth - 6;

  // Render Notes / Terms box on Left
  if (options.notes || options.terms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("NOTES & TERMS", margin, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const noteText = [options.notes, options.terms].filter(Boolean).join("\n");
    const splitNotes = doc.splitTextToSize(noteText, notesWidth - 4);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const boxH = Math.max(16, splitNotes.length * 4 + 6);
    doc.roundedRect(margin, currentY + 2, notesWidth, boxH, 1.5, 1.5, "FD");

    doc.text(splitNotes, margin + 3, currentY + 6);
  }

  // Render Totals Table on Right
  const totalsX = pageWidth - margin - totalsWidth;
  let tY = currentY;

  options.totals.forEach((row) => {
    if (row.isHighlight) {
      doc.setFillColor(15, 23, 42); // Navy background for Grand Total
      doc.roundedRect(totalsX, tY, totalsWidth, 7, 1, 1, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(row.label, totalsX + 3, tY + 4.8);
      doc.text(row.value, totalsX + totalsWidth - 3, tY + 4.8, { align: "right" });
      tY += 8.5;
    } else {
      doc.setFont("helvetica", row.isBold ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(row.isBold ? 15 : 71, row.isBold ? 23 : 85, row.isBold ? 42 : 105);

      doc.text(row.label, totalsX + 3, tY + 4);
      doc.text(row.value, totalsX + totalsWidth - 3, tY + 4, { align: "right" });

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(totalsX + 3, tY + 5.5, totalsX + totalsWidth - 3, tY + 5.5);

      tY += 6;
    }
  });

  return Math.max(currentY + 20, tY + 4);
}

/**
 * Draws page numbers, footer timestamp, and "Powered by MiBuks" branding on every page.
 */
export function addPDFPageFooters(doc: jsPDF, config: PDFDocumentConfig) {
  const totalPages = (doc.internal as any).getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const businessName = config.business.business_name || "MiBuks Business";
  const nowStr = new Date().toLocaleString();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // #94A3B8

    // Left
    doc.text(`${businessName} • Generated: ${nowStr}`, margin, footerY + 4.5);

    // Center
    doc.text("Thank you for your business! • Powered by MiBuks", pageWidth / 2, footerY + 4.5, { align: "center" });

    // Right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY + 4.5, { align: "right" });
  }
}
