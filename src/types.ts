export interface ShipmentFormData {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  oilLiters: string;
}

export interface ParsedPayloadFields {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  address: string;
  oilLiters: number;
}
