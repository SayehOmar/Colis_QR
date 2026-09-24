export interface ShipmentFormData {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  /** Free-form street / building line. */
  streetAddress: string;
  country: string;
  regionId: string;
  regionName: string;
  city: string;
  postalCode: string;
  /** Composed display/QR address. */
  address: string;
  oilLiters: string;
  /** Client-declared estimated weight (kg), encoded in QR. */
  estimateWeightKg: string;
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
  items: string[];
  idDocType: "passport" | "cin" | "";
  idDocNumber: string;
  country: string;
  regionName: string;
  city: string;
  postalCode: string;
}

export interface Shipment {
  id: number;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  country: string;
  regionName: string;
  city: string;
  postalCode: string;
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
}

export interface ShipmentsQueryResult {
  shipments: Shipment[];
}
