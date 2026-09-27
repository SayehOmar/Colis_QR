/** 12-character uppercase alphanumeric shipment code (A–Z, 0–9). */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShipmentCode(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return out;
}

export function isValidShipmentCode(value: string): boolean {
  return /^[A-Za-z0-9]{12}$/.test(value.trim());
}

export function normalizeShipmentCode(value: string): string {
  return value.trim().toUpperCase();
}
