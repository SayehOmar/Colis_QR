import { gql } from "@apollo/client";

export const SHIPMENTS_QUERY = gql`
  query Shipments {
    shipments {
      id
      senderName
      senderPhone
      receiverName
      receiverPhone
      address
      country
      regionName
      city
      postalCode
      oilLiters
      weightKg
      estimateWeightKg
      tariffAmount
      timestamp
      lastEditedAt
      editCount
      items
      idDocType
      idDocNumber
    }
  }
`;

export const UPDATE_SHIPMENT_CELL = gql`
  mutation UpdateShipmentCell($shipmentId: Int!, $field: String!, $value: String!) {
    updateShipmentCell(shipmentId: $shipmentId, field: $field, value: $value) {
      success
      message
    }
  }
`;

export const CREATE_MANUAL_SHIPMENT = gql`
  mutation CreateManualShipment(
    $senderName: String!
    $senderPhone: String!
    $receiverName: String!
    $receiverPhone: String!
    $address: String!
    $oilLiters: Float!
    $weightKg: Float!
    $tariffAmount: Float!
    $items: String
    $idDocType: String
    $idDocNumber: String
    $country: String
    $regionName: String
    $city: String
    $postalCode: String
    $estimateWeightKg: Float
  ) {
    createManualShipment(
      senderName: $senderName
      senderPhone: $senderPhone
      receiverName: $receiverName
      receiverPhone: $receiverPhone
      address: $address
      oilLiters: $oilLiters
      weightKg: $weightKg
      tariffAmount: $tariffAmount
      items: $items
      idDocType: $idDocType
      idDocNumber: $idDocNumber
      country: $country
      regionName: $regionName
      city: $city
      postalCode: $postalCode
      estimateWeightKg: $estimateWeightKg
    ) {
      success
      message
    }
  }
`;

export const CALENDAR_NOTES_QUERY = gql`
  query CalendarNotes {
    calendarNotes {
      id
      noteDate
      noteText
      originCountry
      originRegionName
      originCity
      country
      regionName
      city
      createdAt
      updatedAt
    }
  }
`;

export const UPSERT_CALENDAR_NOTE = gql`
  mutation UpsertCalendarNote(
    $noteDate: String!
    $noteText: String!
    $originCountry: String
    $originRegionName: String
    $originCity: String
    $country: String
    $regionName: String
    $city: String
  ) {
    upsertCalendarNote(
      noteDate: $noteDate
      noteText: $noteText
      originCountry: $originCountry
      originRegionName: $originRegionName
      originCity: $originCity
      country: $country
      regionName: $regionName
      city: $city
    ) {
      success
      message
    }
  }
`;

export const DELETE_CALENDAR_NOTE = gql`
  mutation DeleteCalendarNote($noteId: Int!) {
    deleteCalendarNote(noteId: $noteId) {
      success
      message
    }
  }
`;
