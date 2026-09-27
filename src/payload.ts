import type { ParsedPayloadFields, ShipmentFormData } from "./types";
import {
  generateShipmentCode,
  isValidShipmentCode,
  normalizeShipmentCode,
} from "./shipmentCode";

/** Core fields kept for phone-app compatibility; extras are optional trailing fields. */
const PAYLOAD_CORE_FIELDS = 6;

export function buildAddressLine(data: {
  streetAddress: string;
  city: string;
  postalCode: string;
  regionName: string;
  country: string;
}): string {
  const place = [data.postalCode.trim(), data.city.trim()].filter(Boolean).join(" ");
  const parts = [
    place,
    data.regionName.trim(),
    data.country.trim(),
    data.streetAddress.trim(),
  ].filter(Boolean);
  return parts.join(", ");
}

export function buildPayloadString(data: ShipmentFormData): string {
  const oilLiters = parseNonNegative(data.oilLiters, "Oil liters");
  const estimateWeightKg = parseNonNegative(data.estimateWeightKg, "Estimate weight");
  const address = data.address.trim() || buildAddressLine(data);
  const items = data.items.map((item) => item.trim()).filter(Boolean).join(",");
  const idDoc = `${data.idDocType}:${data.idDocNumber.trim()}`;
  const publicCode = isValidShipmentCode(data.publicCode)
    ? normalizeShipmentCode(data.publicCode)
    : generateShipmentCode();
  return [
    data.senderName.trim(),
    data.senderPhone.trim(),
    data.receiverName.trim(),
    data.receiverPhone.trim(),
    address,
    String(oilLiters),
    items,
    idDoc,
    data.country.trim(),
    data.regionName.trim(),
    data.city.trim(),
    data.postalCode.trim(),
    String(estimateWeightKg),
    publicCode,
  ].join("|");
}

export function parsePayloadString(payload: string): ParsedPayloadFields {
  const parts = payload.split("|");
  if (parts.length < PAYLOAD_CORE_FIELDS) {
    throw new Error(
      `Invalid QR payload: expected at least ${PAYLOAD_CORE_FIELDS} fields, got ${parts.length}`
    );
  }

  const oilLiters = parseNonNegative(parts[5]!, "Oil liters");
  const items =
    parts[6]
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  const idRaw = parts[7]?.trim() ?? "";
  let idDocType: ParsedPayloadFields["idDocType"] = "";
  let idDocNumber = "";
  if (idRaw.includes(":")) {
    const [type, ...rest] = idRaw.split(":");
    if (type === "passport" || type === "cin") {
      idDocType = type;
    }
    idDocNumber = rest.join(":").trim();
  }

  const rawCode = parts[13]?.trim() ?? "";
  const publicCode = isValidShipmentCode(rawCode)
    ? normalizeShipmentCode(rawCode)
    : "";

  return {
    senderName: parts[0]!.trim(),
    senderPhone: parts[1]!.trim(),
    receiverName: parts[2]!.trim(),
    receiverPhone: parts[3]!.trim(),
    address: parts[4]!.trim(),
    oilLiters,
    items,
    idDocType,
    idDocNumber,
    country: parts[8]?.trim() ?? "",
    regionName: parts[9]?.trim() ?? "",
    city: parts[10]?.trim() ?? "",
    postalCode: parts[11]?.trim() ?? "",
    estimateWeightKg: parts[12]
      ? parseNonNegative(parts[12], "Estimate weight")
      : 0,
    publicCode,
  };
}

function parseNonNegative(value: string, label: string): number {
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number`);
  }
  return parsed;
}
