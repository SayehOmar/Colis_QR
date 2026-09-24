import type { TranslationKey } from "./i18n/translations";

/** Letters, spaces, hyphens, apostrophes — no digits. */
const NAME_PATTERN = /^[\p{L}\s'.-]+$/u;

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  if (/\d/.test(trimmed)) return false;
  return NAME_PATTERN.test(trimmed);
}

export function isValidPostalCode(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Allow ranges like 70173-70599 and alphanumerics (FR/TN/MA/DZ/DE/IT/ES)
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{1,14}$/.test(trimmed);
}

export function isNonEmptyAddress(value: string): boolean {
  return value.trim().length >= 5;
}

export type FormValidationError = TranslationKey;

export function validateShipmentPartyFields(input: {
  senderName: string;
  receiverName: string;
  streetOrAddress: string;
  postalCode: string;
  country: string;
  regionIdOrName: string;
  city: string;
}): FormValidationError | null {
  if (!isValidPersonName(input.senderName)) return "nameInvalid";
  if (!isValidPersonName(input.receiverName)) return "nameInvalid";
  if (!input.country.trim() || !input.regionIdOrName.trim() || !input.city.trim()) {
    return "locIncomplete";
  }
  if (!isValidPostalCode(input.postalCode)) return "postalRequired";
  if (!isNonEmptyAddress(input.streetOrAddress)) return "addressRequired";
  return null;
}
