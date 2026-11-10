import { gql } from "@apollo/client";

export const SHIPMENTS_QUERY = gql`
  query Shipments {
    shipments {
      id
      publicCode
      scannerId
      scannerName
      delivered
      deliveredAt
      deliveredByUserId
      deliveredByName
      senderName
      senderPhone
      receiverName
      receiverPhone
      address
      country
      regionName
      city
      postalCode
      departureAddress
      departureCountry
      departureRegionName
      departureCity
      departurePostalCode
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
      fieldEdits {
        field
        initialValue
        previousValue
        editedAt
        editedByUserId
        editedByName
      }
    }
  }
`;

/** Full-history search when the orders table filter is active. */
export const SHIPMENTS_FILTERED_QUERY = gql`
  query ShipmentsFiltered(
    $dateFrom: String
    $dateTo: String
    $country: String
    $city: String
    $scannedBy: String
    $publicCode: String
    $senderName: String
    $receiverName: String
    $senderPhone: String
    $receiverPhone: String
    $idDocType: String
    $idDocNumber: String
    $timeZone: String
    $limit: Int
  ) {
    shipmentsFiltered(
      dateFrom: $dateFrom
      dateTo: $dateTo
      country: $country
      city: $city
      scannedBy: $scannedBy
      publicCode: $publicCode
      senderName: $senderName
      receiverName: $receiverName
      senderPhone: $senderPhone
      receiverPhone: $receiverPhone
      idDocType: $idDocType
      idDocNumber: $idDocNumber
      timeZone: $timeZone
      limit: $limit
    ) {
      totalCount
      nodes {
        id
        publicCode
        scannerId
        scannerName
        delivered
        deliveredAt
        deliveredByUserId
        deliveredByName
        senderName
        senderPhone
        receiverName
        receiverPhone
        address
        country
        regionName
        city
        postalCode
        departureAddress
        departureCountry
        departureRegionName
        departureCity
        departurePostalCode
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
        fieldEdits {
          field
          initialValue
          previousValue
          editedAt
          editedByUserId
          editedByName
        }
      }
    }
  }
`;

/** Full-tenant aggregates for dashboard cards (silent poll / page refresh). */
export const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    dashboardStats {
      shipmentCount
      totalTariff
      totalWeight
      totalOil
      totalEstimateWeight
      avgTariff
      avgWeight
      avgEstimateWeight
      cities {
        name
        count
        share
        country
        regionName
        postalCode
      }
      regions {
        name
        count
        share
        country
      }
      topCity {
        name
        count
        share
        country
        regionName
        postalCode
      }
      tariffSeries {
        date
        total
      }
      weightSeries {
        date
        weight
        oil
        estimate
        count
      }
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
