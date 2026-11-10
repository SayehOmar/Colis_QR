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

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}

export type FormValidationError = TranslationKey;

export type ShipmentFieldKey =
  | "senderName"
  | "senderPhone"
  | "idDocNumber"
  | "receiverName"
  | "receiverPhone"
  | "departureCountry"
  | "departureRegionId"
  | "departureCity"
  | "departurePostalCode"
  | "departureStreetAddress"
  | "country"
  | "regionId"
  | "city"
  | "postalCode"
  | "streetAddress"
  | "oilLiters"
  | "estimateWeightKg"
  | "items";

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

/** Collect every missing/invalid mandatory field for red borders. */
export function collectShipmentFieldErrors(input: {
  senderName: string;
  senderPhone: string;
  idDocType: "passport" | "cin";
  idDocNumber: string;
  receiverName: string;
  receiverPhone: string;
  departureCountry: string;
  departureRegionId: string;
  departureCity: string;
  departurePostalCode: string;
  departureStreetAddress: string;
  country: string;
  regionId: string;
  city: string;
  postalCode: string;
  streetAddress: string;
  oilLiters: string;
  estimateWeightKg: string;
  items: string[];
}): { errors: Partial<Record<ShipmentFieldKey, true>>; messageKey: FormValidationError | null } {
  const errors: Partial<Record<ShipmentFieldKey, true>> = {};

  if (!isValidPersonName(input.senderName)) errors.senderName = true;
  if (!isValidPhone(input.senderPhone)) errors.senderPhone = true;
  if (!input.idDocNumber.trim()) {
    errors.idDocNumber = true;
  } else if (input.idDocType === "cin") {
    if (!/^\d{8}$/.test(input.idDocNumber.trim())) errors.idDocNumber = true;
  } else if (!/^[A-Za-z0-9]{6,12}$/.test(input.idDocNumber.trim())) {
    errors.idDocNumber = true;
  }

  if (!isValidPersonName(input.receiverName)) errors.receiverName = true;
  if (!isValidPhone(input.receiverPhone)) errors.receiverPhone = true;

  if (!input.departureCountry.trim()) errors.departureCountry = true;
  if (!input.departureRegionId.trim()) errors.departureRegionId = true;
  if (!input.departureCity.trim()) errors.departureCity = true;
  if (!isValidPostalCode(input.departurePostalCode)) errors.departurePostalCode = true;
  if (!isNonEmptyAddress(input.departureStreetAddress)) {
    errors.departureStreetAddress = true;
  }

  if (!input.country.trim()) errors.country = true;
  if (!input.regionId.trim()) errors.regionId = true;
  if (!input.city.trim()) errors.city = true;
  if (!isValidPostalCode(input.postalCode)) errors.postalCode = true;
  if (!isNonEmptyAddress(input.streetAddress)) errors.streetAddress = true;

  if (!input.oilLiters.trim()) {
    errors.oilLiters = true;
  } else {
    const oil = Number(input.oilLiters.trim().replace(",", "."));
    if (!Number.isFinite(oil) || oil < 0) errors.oilLiters = true;
  }

  if (!input.estimateWeightKg.trim()) {
    errors.estimateWeightKg = true;
  } else {
    const weight = Number(input.estimateWeightKg.trim().replace(",", "."));
    if (!Number.isFinite(weight) || weight <= 0) errors.estimateWeightKg = true;
  }

  if (input.items.length === 0) errors.items = true;

  let messageKey: FormValidationError | null = null;
  if (errors.senderName || errors.receiverName) messageKey = "nameInvalid";
  else if (errors.senderPhone || errors.receiverPhone) messageKey = "phoneRequired";
  else if (errors.idDocNumber) {
    messageKey =
      input.idDocType === "cin"
        ? input.idDocNumber.trim()
          ? "idCinInvalid"
          : "idDocRequired"
        : input.idDocNumber.trim()
          ? "idPassportInvalid"
          : "idDocRequired";
  } else if (
    errors.departureCountry ||
    errors.departureRegionId ||
    errors.departureCity ||
    errors.country ||
    errors.regionId ||
    errors.city
  ) {
    messageKey = "locIncomplete";
  } else if (errors.departurePostalCode || errors.postalCode) {
    messageKey = "postalRequired";
  } else if (errors.departureStreetAddress || errors.streetAddress) {
    messageKey = "addressRequired";
  } else if (errors.estimateWeightKg) {
    messageKey = input.estimateWeightKg.trim()
      ? "estimateWeightInvalid"
      : "estimateWeightRequired";
  } else if (errors.oilLiters) messageKey = "oilRequired";
  else if (errors.items) messageKey = "itemsRequired";

  return { errors, messageKey };
}
