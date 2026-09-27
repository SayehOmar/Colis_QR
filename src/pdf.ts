import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { ParsedPayloadFields } from "./types";

const PDF_LABELS = {
  title: "EXPÉDITION TRANSFRONTALIÈRE",
  subtitle: "Logistique Europe / Afrique du Nord",
  code: "CODE EXPÉDITION",
  sender: "EXPÉDITEUR",
  receiver: "DESTINATAIRE",
  oilLoad: "CHARGEMENT HUILE",
  items: "ARTICLES",
  idDoc: "PIÈCE D'IDENTITÉ",
  scanQr: "Scanner le code QR",
} as const;

export async function generateShipmentPdf(
  payload: string,
  fields: ParsedPayloadFields
): Promise<void> {
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
  doc.setFontSize(28);
  doc.text(PDF_LABELS.title, leftPadding, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(PDF_LABELS.subtitle, leftPadding, 28);

  if (fields.publicCode) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(PDF_LABELS.code, leftPadding, 36);
    doc.setFont("courier", "bold");
    doc.setFontSize(18);
    doc.text(fields.publicCode, leftPadding, 44);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(PDF_LABELS.sender, leftPadding, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.text(fields.senderName, leftPadding, 66);
  doc.setFontSize(14);
  doc.text(fields.senderPhone, leftPadding, 74);
  if (fields.idDocNumber) {
    doc.setFontSize(12);
    doc.text(
      `${fields.idDocType === "cin" ? "CIN" : "Passport"}: ${fields.idDocNumber}`,
      leftPadding,
      82
    );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(PDF_LABELS.receiver, leftPadding, 94);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.text(fields.receiverName, leftPadding, 104);
  doc.setFontSize(14);
  doc.text(fields.receiverPhone, leftPadding, 112);
  doc.setFontSize(12);
  doc.text(fields.address, leftPadding, 122, {
    maxWidth: dividerX - leftPadding - 10,
  });

  let y = 140;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(PDF_LABELS.items, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  y += 8;
  const itemsText = fields.items.length > 0 ? fields.items.join(", ") : "—";
  doc.text(itemsText, leftPadding, y, {
    maxWidth: dividerX - leftPadding - 10,
  });

  y += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(PDF_LABELS.oilLoad, leftPadding, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.text(`${fields.oilLiters} L`, leftPadding, y + 12);

  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  if (fields.publicCode) {
    doc.setFont("courier", "bold");
    doc.setFontSize(16);
    doc.text(
      fields.publicCode,
      dividerX + pageWidth / 4,
      qrY - 6,
      { align: "center" }
    );
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(
    PDF_LABELS.scanQr,
    dividerX + pageWidth / 4,
    pageHeight - panelPadding,
    { align: "center" }
  );

  doc.save(`expedition-${fields.publicCode || Date.now()}.pdf`);
}
