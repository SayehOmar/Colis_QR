import type { ParsedPayloadFields, ShipmentFormData } from "./types";

const PAYLOAD_FIELD_COUNT = 6;

export function buildPayloadString(data: ShipmentFormData): string {
  const oilLiters = parseOilLiters(data.oilLiters);
  return [
    data.senderName.trim(),
    data.senderPhone.trim(),
    data.receiverName.trim(),
    data.receiverPhone.trim(),
    data.address.trim(),
    String(oilLiters),
  ].join("|");
}

export function parsePayloadString(payload: string): ParsedPayloadFields {
  const parts = payload.split("|");
  if (parts.length !== PAYLOAD_FIELD_COUNT) {
    throw new Error(
      `Invalid QR payload: expected ${PAYLOAD_FIELD_COUNT} fields, got ${parts.length}`
    );
  }

  const oilLiters = parseOilLiters(parts[5]);
  return {
    senderName: parts[0].trim(),
    senderPhone: parts[1].trim(),
    receiverName: parts[2].trim(),
    receiverPhone: parts[3].trim(),
    address: parts[4].trim(),
    oilLiters,
  };
}

function parseOilLiters(value: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Oil liters must be a non-negative number");
  }
  return parsed;
}
