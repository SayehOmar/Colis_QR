import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { gql } from "@apollo/client";
import type { Shipment } from "./types";

export interface ShipmentEditEvent {
  id: number;
  shipmentId: number;
  publicCode: string;
  fieldKey: string;
  oldValue: string;
  newValue: string;
  editedAt: string;
  editedByUserId?: number | null;
  editedByName?: string;
}

const SHIPMENTS_EXPORT_PAGE = gql`
  query ShipmentsExportPage($limit: Int!, $afterId: Int) {
    shipmentsExportPage(limit: $limit, afterId: $afterId) {
      totalCount
      nextAfterId
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

const EDIT_LOG_PAGE = gql`
  query ShipmentEditLogPage($limit: Int!, $afterId: Int) {
    shipmentEditLogPage(limit: $limit, afterId: $afterId) {
      totalCount
      nextAfterId
      nodes {
        id
        shipmentId
        publicCode
        fieldKey
        oldValue
        newValue
        editedAt
        editedByUserId
        editedByName
      }
    }
  }
`;

const CHUNK = 150;
const EDIT_CHUNK = 400;
/** Pause between chunks so we don't hammer the API (big-tech style gentle export). */
const CHUNK_PAUSE_MS = 350;
const HARD_CAP = 20000;
const EDIT_HARD_CAP = 100000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export type ExportFetchProgress = {
  loaded: number;
  total: number;
};

/**
 * Cursor-paginated full export fetch. Soft on the server: small pages + delay.
 */
export async function fetchAllShipmentsChunked(
  client: ApolloClient<NormalizedCacheObject> | ApolloClient<object>,
  onProgress?: (p: ExportFetchProgress) => void
): Promise<Shipment[]> {
  const all: Shipment[] = [];
  let afterId: number | null = null;
  let total = 0;
  let guard = 0;

  type ExportPage = {
    totalCount: number;
    nextAfterId: number | null;
    nodes: Shipment[];
  };

  while (guard < Math.ceil(HARD_CAP / CHUNK) + 2) {
    guard += 1;
    const result: { data?: { shipmentsExportPage?: ExportPage | null } } =
      await client.query({
        query: SHIPMENTS_EXPORT_PAGE,
        variables: { limit: CHUNK, afterId },
        fetchPolicy: "network-only",
      });

    const page: ExportPage | null | undefined = result.data?.shipmentsExportPage;
    if (!page) break;

    total = page.totalCount || total;
    const nodes = page.nodes ?? [];
    all.push(...nodes);
    onProgress?.({ loaded: all.length, total: total || all.length });

    if (!page.nextAfterId || nodes.length === 0) break;
    if (all.length >= HARD_CAP) break;

    afterId = page.nextAfterId;
    await sleep(CHUNK_PAUSE_MS);
  }

  return all;
}

/**
 * Cursor-paginated full edit-history fetch for the change-log Excel sheet.
 */
export async function fetchAllEditLogChunked(
  client: ApolloClient<NormalizedCacheObject> | ApolloClient<object>,
  onProgress?: (p: ExportFetchProgress) => void
): Promise<ShipmentEditEvent[]> {
  const all: ShipmentEditEvent[] = [];
  let afterId: number | null = null;
  let total = 0;
  let guard = 0;

  type EditPage = {
    totalCount: number;
    nextAfterId: number | null;
    nodes: ShipmentEditEvent[];
  };

  while (guard < Math.ceil(EDIT_HARD_CAP / EDIT_CHUNK) + 2) {
    guard += 1;
    const result: { data?: { shipmentEditLogPage?: EditPage | null } } =
      await client.query({
        query: EDIT_LOG_PAGE,
        variables: { limit: EDIT_CHUNK, afterId },
        fetchPolicy: "network-only",
      });

    const page: EditPage | null | undefined = result.data?.shipmentEditLogPage;
    if (!page) break;

    total = page.totalCount || total;
    const nodes = page.nodes ?? [];
    all.push(...nodes);
    onProgress?.({ loaded: all.length, total: total || all.length });

    if (!page.nextAfterId || nodes.length === 0) break;
    if (all.length >= EDIT_HARD_CAP) break;

    afterId = page.nextAfterId;
    await sleep(CHUNK_PAUSE_MS);
  }

  return all;
}
