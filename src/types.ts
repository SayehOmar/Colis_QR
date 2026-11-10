export interface ShipmentFormData {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  /** Free-form street / building line (delivery). */
  streetAddress: string;
  country: string;
  regionId: string;
  regionName: string;
  city: string;
  postalCode: string;
  /** Composed delivery display/QR address. */
  address: string;
  /** Free-form street / building line (departure). */
  departureStreetAddress: string;
  departureCountry: string;
  departureRegionId: string;
  departureRegionName: string;
  departureCity: string;
  departurePostalCode: string;
  /** Composed departure display/QR address. */
  departureAddress: string;
  oilLiters: string;
  /** Client-declared estimated weight (kg), encoded in QR. */
  estimateWeightKg: string;
  /** Unique 12-char alphanumeric code printed on PDF / QR. */
  publicCode: string;
  items: string[];
  idDocType: "passport" | "cin";
  idDocNumber: string;
}

export interface ParsedPayloadFields {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  oilLiters: number;
  estimateWeightKg: number;
  publicCode: string;
  items: string[];
  idDocType: "passport" | "cin" | "";
  idDocNumber: string;
  country: string;
  regionName: string;
  city: string;
  postalCode: string;
  departureAddress: string;
  departureCountry: string;
  departureRegionName: string;
  departureCity: string;
  departurePostalCode: string;
}

export interface FieldEdit {
  field: string;
  initialValue: string;
  previousValue: string;
  editedAt: string;
  editedByUserId?: number | null;
  editedByName?: string;
}

export interface Shipment {
  id: number;
  publicCode: string;
  scannerId: number | null;
  scannerName?: string;
  delivered: boolean;
  deliveredAt?: string | null;
  deliveredByUserId?: number | null;
  deliveredByName?: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  country: string;
  regionName: string;
  city: string;
  postalCode: string;
  departureAddress: string;
  departureCountry: string;
  departureRegionName: string;
  departureCity: string;
  departurePostalCode: string;
  oilLiters: number;
  weightKg: number;
  estimateWeightKg: number;
  tariffAmount: number;
  timestamp: string;
  lastEditedAt: string | null;
  editCount: number;
  items: string;
  idDocType: string;
  idDocNumber: string;
  fieldEdits: FieldEdit[];
}

export interface ShipmentsQueryResult {
  shipments: Shipment[];
}
