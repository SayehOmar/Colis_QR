import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { ParsedPayloadFields } from "./types";

const PDF_LABELS = {
  title: "EXPÉDITION TRANSFRONTALIÈRE",
  subtitle: "Logistique France / Tunisie",
  sender: "EXPÉDITEUR",
  receiver: "DESTINATAIRE",
  oilLoad: "CHARGEMENT HUILE",
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
  const qrSize = Math.min(qrPanelWidth, qrPanelHeight);
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
  doc.setFontSize(32);
  doc.text(PDF_LABELS.title, leftPadding, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.text(PDF_LABELS.subtitle, leftPadding, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(PDF_LABELS.sender, leftPadding, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.text(fields.senderName, leftPadding, 64);
  doc.setFontSize(22);
  doc.text(fields.senderPhone, leftPadding, 76);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(PDF_LABELS.receiver, leftPadding, 94);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(28);
  doc.text(fields.receiverName, leftPadding, 106);
  doc.setFontSize(22);
  doc.text(fields.receiverPhone, leftPadding, 118);
  doc.setFontSize(20);
  doc.text(fields.address, leftPadding, 132, {
    maxWidth: dividerX - leftPadding - 10,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(PDF_LABELS.oilLoad, leftPadding, 162);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(36);
  doc.text(`${fields.oilLiters} L`, leftPadding, 178);

  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(16);
  doc.text(
    PDF_LABELS.scanQr,
    dividerX + pageWidth / 4,
    pageHeight - panelPadding,
    { align: "center" }
  );

  doc.save(`expedition-${Date.now()}.pdf`);
}
