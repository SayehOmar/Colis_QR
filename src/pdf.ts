import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Language } from "./i18n/translations";
import { translations } from "./i18n/translations";
import {
  buildLegalDocument,
  type LegalDocumentBlock,
} from "./legalAttestation";
import { shipmentItemLabel } from "./shipmentItems";
import type { ParsedPayloadFields } from "./types";

const PDF_LABELS: Record<
  Language,
  {
    title: string;
    subtitle: string;
    code: string;
    sender: string;
    receiver: string;
    departure: string;
    delivery: string;
    oilLoad: string;
    items: string;
    scanQr: string;
  }
> = {
  fr: {
    title: "EXPÉDITION TRANSFRONTALIÈRE",
    subtitle: "Logistique Europe / Afrique du Nord",
    code: "CODE EXPÉDITION",
    sender: "EXPÉDITEUR",
    receiver: "DESTINATAIRE",
    departure: "ADRESSE DE DÉPART",
    delivery: "ADRESSE DE LIVRAISON",
    oilLoad: "CHARGEMENT HUILE",
    items: "ARTICLES",
    scanQr: "Scanner le code QR",
  },
  en: {
    title: "CROSS-BORDER SHIPMENT",
    subtitle: "Europe / North Africa logistics",
    code: "SHIPMENT CODE",
    sender: "SENDER",
    receiver: "RECEIVER",
    departure: "DEPARTURE ADDRESS",
    delivery: "DELIVERY ADDRESS",
    oilLoad: "OIL LOAD",
    items: "ITEMS",
    scanQr: "Scan the QR code",
  },
  ar: {
    title: "شحنة عابرة للحدود",
    subtitle: "لوجستيات أوروبا / شمال أفريقيا",
    code: "رمز الشحنة",
    sender: "المرسل",
    receiver: "المستلم",
    departure: "عنوان المغادرة",
    delivery: "عنوان التسليم",
    oilLoad: "حمولة الزيت",
    items: "الأصناف",
    scanQr: "امسح رمز QR",
  },
};

function drawLegalPages(
  doc: jsPDF,
  blocks: LegalDocumentBlock[],
  language: Language
): void {
  const isRtl = language === "ar";
  doc.addPage("a4", "portrait");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed <= pageHeight - margin) return;
    doc.addPage("a4", "portrait");
    y = margin;
  };

  const writeWrapped = (
    text: string,
    options: { bold?: boolean; size?: number; color?: [number, number, number] }
  ) => {
    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(options.size ?? 10);
    if (options.color) {
      doc.setTextColor(...options.color);
    } else {
      doc.setTextColor(20);
    }
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(6);
      if (isRtl) {
        doc.text(line, pageWidth - margin, y, { align: "right" });
      } else {
        doc.text(line, margin, y);
      }
      y += 5;
    }
    y += 2;
  };

  for (const block of blocks) {
    if (block.kind === "notice") {
      ensureSpace(16);
      doc.setFillColor(255, 243, 205);
      doc.roundedRect(margin, y - 4, maxWidth, 12, 2, 2, "F");
      writeWrapped(block.text, { bold: true, size: 10, color: [120, 70, 0] });
      y += 2;
      continue;
    }
    if (block.kind === "title") {
      y += 2;
      writeWrapped(block.text, { bold: true, size: 11, color: [11, 50, 90] });
      continue;
    }
    if (block.kind === "field") {
      writeWrapped(`${block.label} : ${block.value || "—"}`, { size: 10 });
      continue;
    }
    if (block.kind === "blank") {
      writeWrapped(`${block.label} : ..............................................`, {
        size: 10,
      });
      continue;
    }
    writeWrapped(block.text, { size: 9.5 });
  }
}

export async function generateShipmentPdf(
  payload: string,
  fields: ParsedPayloadFields,
  language: Language = "fr"
): Promise<void> {
  const labels = PDF_LABELS[language] ?? PDF_LABELS.fr;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dividerX = pageWidth / 2;
  const leftPadding = 14;
  const panelPadding = 12;

  const qrPanelWidth = pageWidth / 2 - panelPadding * 2;
  const qrPanelHeight = pageHeight - panelPadding * 2;
  const qrSize = Math.min(qrPanelWidth, qrPanelHeight) * 0.92;
  const qrX = dividerX + (pageWidth / 2 - qrSize) / 2;
  const qrY = (pageHeight - qrSize) / 2;

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 800,
  });

  doc.setDrawColor(180);
  doc.setLineWidth(0.4);
  doc.line(dividerX, 10, dividerX, pageHeight - 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(labels.title, leftPadding, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(labels.subtitle, leftPadding, 25);

  if (fields.publicCode) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(labels.code, leftPadding, 33);
    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text(fields.publicCode, leftPadding, 40);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(labels.sender, leftPadding, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(fields.senderName, leftPadding, 58);
  doc.setFontSize(12);
  doc.text(fields.senderPhone, leftPadding, 64);
  if (fields.idDocNumber) {
    doc.setFontSize(10);
    doc.text(
      `${fields.idDocType === "cin" ? "CIN" : "Passport"}: ${fields.idDocNumber}`,
      leftPadding,
      70
    );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(labels.receiver, leftPadding, 80);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(fields.receiverName, leftPadding, 88);
  doc.setFontSize(12);
  doc.text(fields.receiverPhone, leftPadding, 94);

  let y = 104;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(labels.departure, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 5;
  const departureText = fields.departureAddress || "—";
  const departureLines = doc.splitTextToSize(
    departureText,
    dividerX - leftPadding - 10
  ) as string[];
  doc.text(departureLines, leftPadding, y);
  y += departureLines.length * 4.5 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(labels.delivery, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 5;
  const deliveryLines = doc.splitTextToSize(
    fields.address || "—",
    dividerX - leftPadding - 10
  ) as string[];
  doc.text(deliveryLines, leftPadding, y);
  y += deliveryLines.length * 4.5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(labels.items, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 5;
  const tItem = (key: keyof (typeof translations)["fr"]) =>
    translations[language][key] ?? translations.en[key] ?? String(key);
  const itemsText =
    fields.items.length > 0
      ? fields.items.map((id) => shipmentItemLabel(id, tItem)).join(", ")
      : "—";
  const itemLines = doc.splitTextToSize(
    itemsText,
    dividerX - leftPadding - 10
  ) as string[];
  doc.text(itemLines, leftPadding, y);
  y += itemLines.length * 4.5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(labels.oilLoad, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.text(`${fields.oilLiters} L`, leftPadding, y + 10);

  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  if (fields.publicCode) {
    doc.setFont("courier", "bold");
    doc.setFontSize(14);
    doc.text(fields.publicCode, dividerX + pageWidth / 4, qrY - 6, {
      align: "center",
    });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(labels.scanQr, dividerX + pageWidth / 4, pageHeight - panelPadding, {
    align: "center",
  });

  const legalBlocks = buildLegalDocument(language, fields);
  drawLegalPages(doc, legalBlocks, language);

  doc.save(`expedition-${fields.publicCode || Date.now()}.pdf`);
}
