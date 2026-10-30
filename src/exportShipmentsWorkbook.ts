import * as XLSX from "xlsx";
import {
  computeDashboardAnalytics,
  resolveShipmentPlace,
  scannerLabel,
  type DashboardAnalytics,
} from "./dashboardAnalytics";
import type { ShipmentEditEvent } from "./exportFetch";
import { formatLocalDateTime } from "./i18n/formatDateTime";
import type { Shipment } from "./types";

export interface ExportSheetOptions {
  includeMap: boolean;
  includePlaces: boolean;
  includeTariff: boolean;
  includeWeightVolume: boolean;
  includePieChart: boolean;
  includeLineCharts: boolean;
  includeEditHistory: boolean;
}

export interface ExportLabels {
  sheetShipments: string;
  sheetMap: string;
  sheetPlaces: string;
  sheetTariff: string;
  sheetWeight: string;
  sheetPie: string;
  sheetTariffLine: string;
  sheetWeightLine: string;
  sheetEditHistory: string;
  shipmentCode: string;
  scannerName: string;
  delivered: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  country: string;
  region: string;
  city: string;
  postal: string;
  address: string;
  items: string;
  idDocType: string;
  idDocNumber: string;
  oil: string;
  estimateWeight: string;
  weight: string;
  tariff: string;
  loggedTime: string;
  lastEdited: string;
  editCount: string;
  count: string;
  sharePct: string;
  date: string;
  tariffTotal: string;
  tariffAvg: string;
  avgWeight: string;
  avgEstimateWeight: string;
  totalOil: string;
  totalWeight: string;
  totalEstimateWeight: string;
  shipmentCount: string;
  metric: string;
  value: string;
  changedAt: string;
  editedBy: string;
  field: string;
  oldValue: string;
  newValue: string;
  yes: string;
  no: string;
  /** GraphQL fieldKey → localized column label */
  fieldLabels: Record<string, string>;
}

function safeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
  let candidate = base;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` ${i}`;
    candidate = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    i += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function localizeCellValue(raw: string, labels: ExportLabels): string {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return labels.yes;
  if (v === "false" || v === "no" || v === "0") return labels.no;
  return raw;
}

function localizeFieldKey(fieldKey: string, labels: ExportLabels): string {
  return labels.fieldLabels[fieldKey] || fieldKey;
}

function shipmentsRows(shipments: Shipment[], labels: ExportLabels, locale: string) {
  return shipments.map((s) => {
    const place = resolveShipmentPlace(s);
    return {
      [labels.shipmentCode]: s.publicCode,
      [labels.scannerName]: scannerLabel(s),
      [labels.delivered]: s.delivered ? labels.yes : labels.no,
      [labels.senderName]: s.senderName,
      [labels.senderPhone]: s.senderPhone,
      [labels.receiverName]: s.receiverName,
      [labels.receiverPhone]: s.receiverPhone,
      [labels.country]: place.country,
      [labels.region]: place.regionName,
      [labels.city]: place.city,
      [labels.postal]: place.postalCode,
      [labels.address]: s.address,
      [labels.items]: s.items,
      [labels.idDocType]: s.idDocType,
      [labels.idDocNumber]: s.idDocNumber,
      [labels.oil]: Number(s.oilLiters) || 0,
      [labels.estimateWeight]: Number(s.estimateWeightKg) || 0,
      [labels.weight]: Number(s.weightKg) || 0,
      [labels.tariff]: Number(s.tariffAmount) || 0,
      [labels.loggedTime]: formatLocalDateTime(s.timestamp, locale),
      [labels.lastEdited]: formatLocalDateTime(s.lastEditedAt, locale),
      [labels.editCount]: s.editCount ?? 0,
    };
  });
}

function downloadBlob(filename: string, data: ArrayBuffer) {
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function appendJsonSheet(
  workbook: XLSX.WorkBook,
  usedNames: Set<string>,
  title: string,
  rows: Record<string, string | number>[]
) {
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(rows.length ? rows : [{ _: "" }]),
    safeSheetName(title, usedNames)
  );
}

function editHistoryRows(
  events: ShipmentEditEvent[],
  shipmentIds: Set<number>,
  labels: ExportLabels,
  locale: string
) {
  return events
    .filter((e) => shipmentIds.has(e.shipmentId))
    .map((e) => ({
      [labels.shipmentCode]: e.publicCode || String(e.shipmentId),
      [labels.field]: localizeFieldKey(e.fieldKey, labels),
      [labels.oldValue]: localizeCellValue(e.oldValue, labels),
      [labels.newValue]: localizeCellValue(e.newValue, labels),
      [labels.changedAt]: formatLocalDateTime(e.editedAt, locale),
      [labels.editedBy]: e.editedByName || "—",
    }));
}

/** Build a multi-sheet workbook (.xlsx) from filtered shipments and trigger download. */
export function downloadShipmentsWorkbook(input: {
  shipments: Shipment[];
  options: ExportSheetOptions;
  labels: ExportLabels;
  locale: string;
  filename?: string;
  /** Prefer server aggregates when exporting unfiltered full data. */
  analyticsOverride?: DashboardAnalytics | null;
  editEvents?: ShipmentEditEvent[];
}) {
  const { shipments, options, labels, locale } = input;
  const analytics =
    input.analyticsOverride ??
    computeDashboardAnalytics(shipments, { cityLimit: Infinity });
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  appendJsonSheet(
    workbook,
    usedNames,
    labels.sheetShipments,
    shipmentsRows(shipments, labels, locale)
  );

  if (options.includeEditHistory) {
    const idSet = new Set(shipments.map((s) => s.id));
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetEditHistory,
      editHistoryRows(input.editEvents ?? [], idSet, labels, locale)
    );
  }

  if (options.includeMap) {
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetMap,
      analytics.regions.map((r) => ({
        [labels.region]: r.name,
        [labels.country]: r.country,
        [labels.count]: r.count,
        [labels.sharePct]: Math.round(r.share * 1000) / 10,
      }))
    );
  }

  if (options.includePlaces) {
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetPlaces,
      analytics.cities.map((c) => ({
        [labels.city]: c.name,
        [labels.region]: c.regionName,
        [labels.country]: c.country,
        [labels.postal]: c.postalCode,
        [labels.count]: c.count,
        [labels.sharePct]: Math.round(c.share * 1000) / 10,
      }))
    );
  }

  if (options.includePieChart) {
    // Pie-ready table: category + value (Excel Insert → Pie Chart).
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetPie,
      analytics.cities.map((c) => ({
        [labels.city]: c.name,
        [labels.count]: c.count,
        [labels.sharePct]: Math.round(c.share * 1000) / 10,
        [labels.country]: c.country,
        [labels.region]: c.regionName,
      }))
    );
  }

  if (options.includeTariff) {
    const summary = [
      { [labels.metric]: labels.tariffTotal, [labels.value]: analytics.totalTariff },
      { [labels.metric]: labels.tariffAvg, [labels.value]: analytics.avgTariff },
      { [labels.metric]: labels.avgWeight, [labels.value]: analytics.avgWeight },
      { [labels.metric]: labels.shipmentCount, [labels.value]: analytics.shipmentCount },
    ];
    const daily = analytics.tariffSeries.map((p) => ({
      [labels.date]: p.date,
      [labels.tariff]: p.total,
    }));
    const sheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.sheet_add_json(sheet, daily.length ? daily : [{ [labels.date]: "" }], {
      origin: "A7",
    });
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      safeSheetName(labels.sheetTariff, usedNames)
    );
  }

  if (options.includeWeightVolume) {
    const summary = [
      { [labels.metric]: labels.totalWeight, [labels.value]: analytics.totalWeight },
      {
        [labels.metric]: labels.totalEstimateWeight,
        [labels.value]: analytics.totalEstimateWeight,
      },
      { [labels.metric]: labels.totalOil, [labels.value]: analytics.totalOil },
      { [labels.metric]: labels.avgWeight, [labels.value]: analytics.avgWeight },
      {
        [labels.metric]: labels.avgEstimateWeight,
        [labels.value]: analytics.avgEstimateWeight,
      },
      { [labels.metric]: labels.shipmentCount, [labels.value]: analytics.shipmentCount },
    ];
    const series =
      analytics.weightSeries ??
      computeDashboardAnalytics(shipments, { cityLimit: Infinity }).weightSeries ??
      [];
    const daily = series.map((p) => ({
      [labels.date]: p.date,
      [labels.weight]: p.weight,
      [labels.estimateWeight]: p.estimate,
      [labels.oil]: p.oil,
      [labels.shipmentCount]: p.count,
    }));
    const sheet = XLSX.utils.json_to_sheet(summary);
    XLSX.utils.sheet_add_json(
      sheet,
      daily.length ? daily : [{ [labels.date]: "" }],
      { origin: "A9" }
    );
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      safeSheetName(labels.sheetWeight, usedNames)
    );
  }

  if (options.includeLineCharts) {
    // Dedicated line-chart sheets (date + series columns) for Excel charts.
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetTariffLine,
      analytics.tariffSeries.map((p) => ({
        [labels.date]: p.date,
        [labels.tariff]: p.total,
      }))
    );
    const weightSeries =
      analytics.weightSeries ??
      computeDashboardAnalytics(shipments, { cityLimit: Infinity }).weightSeries ??
      [];
    appendJsonSheet(
      workbook,
      usedNames,
      labels.sheetWeightLine,
      weightSeries.map((p) => ({
        [labels.date]: p.date,
        [labels.weight]: p.weight,
        [labels.oil]: p.oil,
        [labels.estimateWeight]: p.estimate,
      }))
    );
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  // e.g. crossmed-export-2026-10-30_205712.xlsx (local date + time)
  const stampLabel = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = input.filename ?? `crossmed-export-${stampLabel}.xlsx`;
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  downloadBlob(filename, buffer);
}
