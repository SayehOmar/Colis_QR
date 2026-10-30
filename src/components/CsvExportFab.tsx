import { useApolloClient } from "@apollo/client";
import { useMemo, useState } from "react";
import {
  EMPTY_STATS_FILTER,
  filterShipments,
  isStatsFilterActive,
  uniqueCities,
  uniqueCountries,
  uniqueScanners,
  type DashboardAnalytics,
  type StatsFilter,
} from "../dashboardAnalytics";
import {
  fetchAllEditLogChunked,
  fetchAllShipmentsChunked,
  type ShipmentEditEvent,
} from "../exportFetch";
import {
  downloadShipmentsWorkbook,
  type ExportSheetOptions,
} from "../exportShipmentsWorkbook";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";
import type { Shipment } from "../types";
import { StatsFilterBar } from "./StatsFilterBar";

/** Microsoft Excel brand green */
const EXCEL_GREEN = "#217346";

interface CsvExportFabProps {
  shipments: Shipment[];
  /** Server aggregates when exporting unfiltered full history. */
  fullStats?: DashboardAnalytics | null;
}

export function CsvExportFab({
  shipments,
  fullStats = null,
}: CsvExportFabProps) {
  const { t, language } = useLanguage();
  const client = useApolloClient();
  const locale = language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<StatsFilter>(EMPTY_STATS_FILTER);
  const [sheets, setSheets] = useState<ExportSheetOptions>({
    includeMap: true,
    includePlaces: true,
    includeTariff: true,
    includeWeightVolume: true,
    includePieChart: true,
    includeLineCharts: true,
    includeEditHistory: true,
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(
    null
  );

  const countries = useMemo(() => {
    const fromLoaded = uniqueCountries(shipments);
    const fromStats = (fullStats?.cities ?? [])
      .map((c) => c.country)
      .filter(Boolean);
    return Array.from(new Set([...fromLoaded, ...fromStats])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [shipments, fullStats]);
  const cities = useMemo(() => {
    const fromLoaded = uniqueCities(shipments, filter.country);
    const fromStats = (fullStats?.cities ?? [])
      .filter((c) => !filter.country || c.country === filter.country)
      .map((c) => c.name)
      .filter(Boolean);
    return Array.from(new Set([...fromLoaded, ...fromStats])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [shipments, filter.country, fullStats]);
  const scanners = useMemo(() => uniqueScanners(shipments), [shipments]);
  const filterActive = isStatsFilterActive(filter);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStatus(null);
    setProgress(null);
  };

  const toggleSheet = (key: keyof ExportSheetOptions) => {
    setSheets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownload = async () => {
    setBusy(true);
    setStatus(null);
    setProgress(null);
    try {
      setStatus(t("dashExportFetchingSlow"));
      const allRows = await fetchAllShipmentsChunked(client, (p) => {
        setProgress(p);
        setStatus(
          t("dashExportFetchingProgress")
            .replace("{loaded}", String(p.loaded))
            .replace("{total}", String(p.total))
        );
      });
      const rows = filterShipments(allRows, filter);
      const analyticsOverride =
        !filterActive && fullStats ? fullStats : null;

      if (rows.length === 0) {
        setStatus(t("dashExportNoRows"));
        return;
      }

      let editEvents: ShipmentEditEvent[] = [];
      if (sheets.includeEditHistory) {
        setStatus(t("dashExportFetchingEdits"));
        editEvents = await fetchAllEditLogChunked(client, (p) => {
          setProgress(p);
          setStatus(
            t("dashExportFetchingEditsProgress")
              .replace("{loaded}", String(p.loaded))
              .replace("{total}", String(p.total))
          );
        });
      }

      setStatus(t("dashExportBuilding"));
      const fieldLabel = (key: TranslationKey) => t(key);
      downloadShipmentsWorkbook({
        shipments: rows,
        options: sheets,
        locale,
        analyticsOverride,
        editEvents,
        labels: {
          sheetShipments: t("dashOrdersTitle"),
          sheetMap: t("dashMapTitle"),
          sheetPlaces: t("dashPlacesTitle"),
          sheetTariff: t("dashTariffTitle"),
          sheetWeight: t("dashWeightTitle"),
          sheetPie: t("dashExportSheetPie"),
          sheetTariffLine: t("dashExportSheetTariffLine"),
          sheetWeightLine: t("dashExportSheetWeightLine"),
          sheetEditHistory: t("dashExportSheetEditHistory"),
          shipmentCode: t("shipmentCode"),
          scannerName: t("scannerName"),
          delivered: t("deliveredCol"),
          senderName: t("senderName"),
          senderPhone: t("senderPhone"),
          receiverName: t("receiverName"),
          receiverPhone: t("receiverPhone"),
          country: t("locCountry"),
          region: t("locRegion"),
          city: t("locCity"),
          postal: t("locPostal"),
          address: t("address"),
          items: t("itemsTitle"),
          idDocType: t("dashFilterIdDocType"),
          idDocNumber: t("dashFilterIdDocNumber"),
          oil: t("oil"),
          estimateWeight: t("estimateWeightCol"),
          weight: t("weight"),
          tariff: t("tariff"),
          loggedTime: t("loggedTime"),
          lastEdited: t("lastEdited"),
          editCount: t("editCount"),
          count: t("dashExportCount"),
          sharePct: t("dashExportShare"),
          date: t("dashExportDate"),
          tariffTotal: t("dashTariffTotal"),
          tariffAvg: t("dashTariffAvg"),
          avgWeight: t("dashAvgWeight"),
          avgEstimateWeight: t("dashExportAvgEstimate"),
          totalOil: t("oil"),
          totalWeight: t("weight"),
          totalEstimateWeight: t("estimateWeightCol"),
          shipmentCount: t("dashShipments"),
          metric: t("dashExportMetric"),
          value: t("dashExportValue"),
          changedAt: t("changedAt"),
          editedBy: t("editedBy"),
          field: t("dashExportField"),
          oldValue: t("dashExportOldValue"),
          newValue: t("dashExportNewValue"),
          yes: t("yes"),
          no: t("no"),
          fieldLabels: {
            senderName: fieldLabel("senderName"),
            senderPhone: fieldLabel("senderPhone"),
            receiverName: fieldLabel("receiverName"),
            receiverPhone: fieldLabel("receiverPhone"),
            address: fieldLabel("address"),
            oilLiters: fieldLabel("oilLiters"),
            weightKg: fieldLabel("weight"),
            tariffAmount: fieldLabel("tariff"),
            items: fieldLabel("itemsTitle"),
            idDocType: fieldLabel("dashFilterIdDocType"),
            idDocNumber: fieldLabel("dashFilterIdDocNumber"),
            country: fieldLabel("locCountry"),
            regionName: fieldLabel("locRegion"),
            city: fieldLabel("locCity"),
            postalCode: fieldLabel("locPostal"),
            estimateWeightKg: fieldLabel("estimateWeightCol"),
            delivered: fieldLabel("deliveredCol"),
          },
        },
      });
      setStatus(t("dashExportDone").replace("{n}", String(rows.length)));
      setProgress(null);
    } catch {
      setStatus(t("actionFailed"));
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setStatus(null);
          setProgress(null);
        }}
        className="fixed bottom-5 left-5 z-[4000] flex h-14 w-14 items-center justify-center overflow-hidden rounded-full p-2.5 shadow-lg transition hover:scale-105"
        style={{ backgroundColor: EXCEL_GREEN }}
        aria-label={t("dashExportTitle")}
        title={t("dashExportTitle")}
      >
        <img
          src="/CSV.svg"
          alt=""
          aria-hidden
          className="h-full w-full object-contain"
          draggable={false}
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[4100] flex items-end justify-center bg-primary/25 p-4 backdrop-blur-[1px] sm:items-center">
          <div className="absolute inset-0" onClick={close} aria-hidden />
          <div
            className="relative z-10 flex max-h-[min(92vh,42rem)] w-[min(100%,28rem)] flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-export-title"
          >
            <div
              className="flex items-start justify-between gap-2 px-4 py-3 text-white"
              style={{ backgroundColor: EXCEL_GREEN }}
            >
              <div>
                <p id="csv-export-title" className="text-sm font-bold">
                  {t("dashExportTitle")}
                </p>
                <p className="text-[11px] opacity-90">{t("dashExportHint")}</p>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-50"
                aria-label={t("dashCloseDrawer")}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                {t("dashExportAllWarning")}
              </p>

              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                {t("dashFilterTitle")}
              </p>
              <StatsFilterBar
                filter={filter}
                onChange={setFilter}
                countries={countries}
                cities={cities}
                scanners={scanners}
                contactFilters
                defaultOpen
              />

              <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                {t("dashExportSheets")}
              </p>
              <div className="space-y-2 rounded-xl border border-outline-variant/50 bg-surface-container-low/60 p-3">
                {(
                  [
                    ["includeMap", "dashMapTitle"],
                    ["includePlaces", "dashPlacesTitle"],
                    ["includePieChart", "dashExportSheetPie"],
                    ["includeTariff", "dashTariffTitle"],
                    ["includeWeightVolume", "dashWeightTitle"],
                    ["includeLineCharts", "dashExportSheetLines"],
                    ["includeEditHistory", "dashExportSheetEditHistory"],
                  ] as const
                ).map(([key, labelKey]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-2 text-sm text-on-surface"
                  >
                    <input
                      type="checkbox"
                      checked={sheets[key]}
                      onChange={() => toggleSheet(key)}
                      disabled={busy}
                      className="h-4 w-4 rounded border-outline-variant accent-[#217346]"
                    />
                    <span>{t(labelKey)}</span>
                  </label>
                ))}
              </div>

              {progress ? (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${
                          progress.total > 0
                            ? Math.min(100, (progress.loaded / progress.total) * 100)
                            : 0
                        }%`,
                        backgroundColor: EXCEL_GREEN,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {status ? (
                <p className="mt-2 text-[11px] font-medium text-secondary">{status}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-2 border-t border-outline-variant/40 p-4">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="app-btn-ghost flex-1 text-xs disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDownload()}
                disabled={busy}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: EXCEL_GREEN }}
              >
                {busy ? "…" : t("dashExportDownload")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
