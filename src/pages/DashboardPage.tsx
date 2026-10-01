import { useQuery } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AddShipmentModal } from "../components/AddShipmentModal";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { StaticCopyCell } from "../components/CellCopyButton";
import { EditableCell } from "../components/EditableCell";
import { ExpandIcon } from "../components/ExpandIcon";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { CalendarNotesFab } from "../components/CalendarNotesFab";
import { DayNotesPreview } from "../components/DayNotesPreview";
import { StatsFilterBar } from "../components/StatsFilterBar";
import {
  computeDashboardAnalytics,
  EMPTY_STATS_FILTER,
  filterShipments,
  formatEuro,
  formatKg,
  formatLiters,
  uniqueCities,
  uniqueCountries,
  type DashboardAnalytics,
  type StatsFilter,
} from "../dashboardAnalytics";
import { SHIPMENTS_QUERY } from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";
import type { Shipment, ShipmentsQueryResult } from "../types";
import { ShipmentHeatMap } from "../components/ShipmentHeatMap";

const POLL_INTERVAL_MS = 2000;

type StatPanel = "weight" | "places" | "tariff" | "map" | "orders";

const PANEL_ITEMS: { id: StatPanel; label: TranslationKey; icon: string }[] = [
  { id: "weight", label: "dashWeightTitle", icon: "scale" },
  { id: "places", label: "dashPlacesTitle", icon: "location_on" },
  { id: "tariff", label: "dashTariffTitle", icon: "payments" },
  { id: "map", label: "dashMapTitle", icon: "map" },
  { id: "orders", label: "dashOrdersTitle", icon: "table_chart" },
];

function usePanelFilter(allShipments: Shipment[]) {
  const [filter, setFilter] = useState<StatsFilter>(EMPTY_STATS_FILTER);
  const filtered = useMemo(
    () => filterShipments(allShipments, filter),
    [allShipments, filter]
  );
  const analytics = useMemo(() => computeDashboardAnalytics(filtered), [filtered]);
  const countries = useMemo(() => uniqueCountries(allShipments), [allShipments]);
  const cities = useMemo(
    () => uniqueCities(allShipments, filter.country),
    [allShipments, filter.country]
  );
  return { filter, setFilter, filtered, analytics, countries, cities };
}

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

function ExpandButton({
  expanded,
  onClick,
  label,
}: {
  expanded: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant/70 bg-surface-container-lowest text-on-surface transition hover:border-secondary hover:text-secondary"
      aria-label={label}
      title={label}
    >
      <ExpandIcon expanded={expanded} className="h-3.5 w-3.5" />
    </button>
  );
}

function WeightPanel({
  analytics,
  weightPct,
  weightGoal,
  expanded,
}: {
  analytics: DashboardAnalytics;
  weightPct: number;
  weightGoal: number;
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={expanded ? "p-2" : ""}>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[11px] font-semibold text-secondary">
          {t("weight")}: {formatKg(analytics.totalWeight)}
        </span>
        <span className="rounded-full bg-tertiary-container px-2.5 py-1 text-[11px] font-semibold text-on-tertiary-fixed">
          {t("oil")}: {formatLiters(analytics.totalOil)}
        </span>
        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-on-surface">
          {analytics.shipmentCount} {t("dashShipments")}
        </span>
        {analytics.totalEstimateWeight > 0 ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {t("estimateWeightCol")}: {formatKg(analytics.totalEstimateWeight)}
          </span>
        ) : null}
      </div>
      <div
        className={`relative mx-auto flex items-end justify-center ${
          expanded ? "h-48 w-72" : "h-28 w-44"
        }`}
      >
        <svg viewBox="0 0 120 70" className="absolute inset-0 h-full w-full">
          <path
            d="M10 60 A50 50 0 0 1 110 60"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M10 60 A50 50 0 0 1 110 60"
            fill="none"
            stroke="#00A8A8"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(weightPct / 100) * 157} 157`}
          />
        </svg>
        <div className="relative mb-1 text-center">
          <p className={`font-extrabold text-on-surface ${expanded ? "text-5xl" : "text-2xl"}`}>
            {weightPct}%
          </p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-on-surface-variant">
        {formatKg(analytics.totalWeight)} / {formatKg(weightGoal)}
      </p>
    </div>
  );
}

function PlacesPanel({
  analytics,
  expanded,
}: {
  analytics: DashboardAnalytics;
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  const cities = expanded ? analytics.cities : analytics.cities.slice(0, 5);
  if (cities.length === 0) {
    return <p className="text-xs text-on-surface-variant">{t("dashNoCities")}</p>;
  }
  return (
    <ul className={`space-y-3 ${expanded ? "max-w-xl" : ""}`}>
      {cities.map((city) => (
        <li key={`${city.name}-${city.country}-${city.regionName}`}>
          <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-on-surface">
              {city.name}
              {(city.regionName || city.country) && (
                <span className="ml-1 font-normal text-on-surface-variant">
                  ({[city.regionName, city.country].filter(Boolean).join(", ")})
                </span>
              )}
            </span>
            <span className="text-on-surface-variant">
              {city.count} · {Math.round(city.share * 100)}%
            </span>
          </div>
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-container">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className={`h-full flex-1 rounded-sm ${
                  i < Math.round(city.share * 20) ? "bg-tertiary" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TariffPanel({
  analytics,
  expanded,
}: {
  analytics: DashboardAnalytics;
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={expanded ? "max-w-2xl" : ""}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-container-low p-3 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffTotal")}
          </p>
          <p
            className={`mt-1 font-extrabold text-primary ${
              expanded ? "text-3xl" : "text-lg"
            }`}
          >
            {formatEuro(analytics.totalTariff)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffAvg")}
          </p>
          <p
            className={`mt-1 font-extrabold text-tertiary ${
              expanded ? "text-3xl" : "text-lg"
            }`}
          >
            {formatEuro(analytics.avgTariff)}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/50 p-3 sm:p-5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
          {t("dashAvgWeight")}
        </p>
        <p className={`mt-1 font-bold text-on-surface ${expanded ? "text-2xl" : "text-base"}`}>
          {formatKg(analytics.avgWeight)}
        </p>
      </div>
      <TariffTrendChart series={analytics.tariffSeries} expanded={expanded} />
    </div>
  );
}

function TariffTrendChart({
  series,
  expanded,
}: {
  series: DashboardAnalytics["tariffSeries"];
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  if (series.length < 2) {
    return (
      <p className="mt-3 text-xs text-on-surface-variant">{t("dashTariffNoTrend")}</p>
    );
  }
  const max = Math.max(...series.map((p) => p.total), 1);
  const w = 200;
  const h = 60;
  const pad = 4;
  const points = series.map((p, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.total / max) * (h - pad * 2);
    return { x, y, ...p };
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1]!.x} ${h} L${points[0]!.x} ${h} Z`;
  const first = series[0]!;
  const last = series[series.length - 1]!;

  return (
    <div className={`mt-4 ${expanded ? "h-32" : "h-20"}`}>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
        {t("dashTariffTrend")}
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[calc(100%-1rem)] w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="tariffFillLive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#tariffFillLive)" />
        <path d={line} fill="none" stroke="#FF7A00" strokeWidth="2.5" />
      </svg>
      <div className="mt-0.5 flex justify-between text-[10px] text-on-surface-variant">
        <span>
          {first.date} · {formatEuro(first.total)}
        </span>
        <span>
          {last.date} · {formatEuro(last.total)}
        </span>
      </div>
    </div>
  );
}

function MapPanel({
  analytics,
  expanded,
  mapInstanceKey,
}: {
  analytics: DashboardAnalytics;
  expanded?: boolean;
  mapInstanceKey?: string;
}) {
  return (
    <ShipmentHeatMap
      regions={analytics.regions}
      topCity={analytics.topCity}
      expanded={expanded}
      mapInstanceKey={mapInstanceKey}
    />
  );
}

function OrdersPanel({
  shipments,
  loading,
}: {
  shipments: Shipment[];
  loading: boolean;
}) {
  const { t } = useLanguage();
  // Backend already caps at 100; keep a hard UI cap for expand performance.
  const visible = shipments.slice(0, 100);
  return (
    <div className="h-full min-h-0 overflow-auto">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-primary text-left text-xs uppercase tracking-wide text-on-primary">
          <tr>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("shipmentCode")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("scannerId")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("senderDetails")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("receiverDetails")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={5}>
              {t("deliveryAddress")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("itemsTitle")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("idDocTitle")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("oil")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("estimateWeightCol")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("weight")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("tariff")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("loggedTime")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("lastEdited")}</th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">{t("editCount")}</th>
          </tr>
          <tr className="bg-slate-800 text-[10px] normal-case text-slate-200">
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">{t("name")}</th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">{t("phone")}</th>
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">{t("name")}</th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">{t("phone")}</th>
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2">{t("locCountry")}</th>
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">{t("locRegion")}</th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">{t("locCity")}</th>
            <th className="sticky top-10 z-10 min-w-[6rem] bg-slate-800 px-3 py-2">{t("locPostal")}</th>
            <th className="sticky top-10 z-10 min-w-[16rem] bg-slate-800 px-3 py-2">{t("address")}</th>
            <th className="sticky top-10 z-10 min-w-[14rem] bg-slate-800 px-3 py-2">{t("itemsTitle")}</th>
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2">{t("idCin")} / {t("idPassport")}</th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">N°</th>
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[4rem] bg-slate-800 px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30 bg-surface-container-lowest">
          {visible.length === 0 ? (
            <tr>
              <td colSpan={21} className="px-4 py-10 text-center text-on-surface-variant">
                {loading ? t("loading") : t("noShipments")}
              </td>
            </tr>
          ) : (
            visible.map((shipment) => {
              const editByField = Object.fromEntries(
                (shipment.fieldEdits ?? []).map((e) => [e.field, e]),
              );
              return (
              <tr key={shipment.id} className="align-top hover:bg-surface-container-low/60">
                <StaticCopyCell
                  value={shipment.publicCode || "—"}
                  className="whitespace-nowrap font-mono text-xs font-bold text-primary"
                />
                <StaticCopyCell
                  value={shipment.scannerId ?? "—"}
                  className="whitespace-nowrap text-on-surface-variant"
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="senderName"
                  value={shipment.senderName}
                  edit={editByField.senderName}
                  className="font-medium"
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="senderPhone"
                  value={shipment.senderPhone}
                  edit={editByField.senderPhone}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="receiverName"
                  value={shipment.receiverName}
                  edit={editByField.receiverName}
                  className="font-medium"
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="receiverPhone"
                  value={shipment.receiverPhone}
                  edit={editByField.receiverPhone}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="country"
                  value={shipment.country || ""}
                  edit={editByField.country}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="regionName"
                  value={shipment.regionName || ""}
                  edit={editByField.regionName}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="city"
                  value={shipment.city || ""}
                  edit={editByField.city}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="postalCode"
                  value={shipment.postalCode || ""}
                  edit={editByField.postalCode}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="address"
                  value={shipment.address}
                  edit={editByField.address}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="items"
                  value={(shipment.items || "").replace(/,/g, ", ")}
                  edit={editByField.items}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="idDocType"
                  value={shipment.idDocType || ""}
                  edit={editByField.idDocType}
                  className="uppercase"
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="idDocNumber"
                  value={shipment.idDocNumber || ""}
                  edit={editByField.idDocNumber}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="oilLiters"
                  value={shipment.oilLiters}
                  edit={editByField.oilLiters}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="estimateWeightKg"
                  value={shipment.estimateWeightKg ?? 0}
                  edit={editByField.estimateWeightKg}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="weightKg"
                  value={shipment.weightKg}
                  edit={editByField.weightKg}
                />
                <EditableCell
                  shipmentId={shipment.id}
                  field="tariffAmount"
                  value={shipment.tariffAmount}
                  edit={editByField.tariffAmount}
                />
                <StaticCopyCell
                  value={shipment.timestamp}
                  className="whitespace-nowrap text-on-surface-variant"
                />
                <StaticCopyCell
                  value={shipment.lastEditedAt ?? t("never")}
                  className="whitespace-nowrap text-on-surface-variant"
                />
                <StaticCopyCell
                  value={shipment.editCount}
                  className="text-center font-semibold text-tertiary"
                />
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<StatPanel | null>(null);
  const { data, loading, error } = useQuery<ShipmentsQueryResult>(SHIPMENTS_QUERY, {
    pollInterval: POLL_INTERVAL_MS,
  });

  const shipments = data?.shipments ?? [];
  const weightFilter = usePanelFilter(shipments);
  const placesFilter = usePanelFilter(shipments);
  const tariffFilter = usePanelFilter(shipments);
  const mapFilter = usePanelFilter(shipments);
  const ordersFilter = usePanelFilter(shipments);
  const showSkeleton = usePageSkeleton(!loading || Boolean(data), 500);

  const weightGoal = Math.max(
    1000,
    Math.ceil(weightFilter.analytics.totalWeight / 500) * 500 || 1000
  );
  const weightPct = Math.min(
    100,
    Math.round((weightFilter.analytics.totalWeight / weightGoal) * 100)
  );

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const toggleExpand = (panel: StatPanel) => {
    setExpanded((current) => (current === panel ? null : panel));
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (showSkeleton) {
    return <PageSkeleton variant="dashboard" />;
  }

  const panelTitle = (id: StatPanel) => t(PANEL_ITEMS.find((p) => p.id === id)!.label);

  return (
    <div className="app-page relative">
      <PageSeo
        title={t("seoDashboardTitle")}
        description={t("seoDashboardDescription")}
        path="/dashboard"
        noindex
      />
      {/* Left stats drawer */}
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-primary/30 backdrop-blur-[2px]"
          aria-label={t("dashCloseDrawer")}
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100%,300px)] flex-col border-r border-outline-variant/50 bg-surface-container-lowest shadow-xl transition-transform duration-300 ${
          drawerOpen ? "translate-x-0 stats-drawer-panel" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-4 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              {t("dashDrawerTitle")}
            </p>
            <p className="text-sm font-semibold text-on-surface">{t("dashDrawerHint")}</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="app-btn-ghost h-8 w-8 p-0"
            aria-label={t("dashCloseDrawer")}
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {PANEL_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleExpand(item.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                expanded === item.id
                  ? "bg-primary text-on-primary"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <Icon name={item.icon} className="text-[20px]" />
              {t(item.label)}
              <span className="ml-auto opacity-70">
                <ExpandIcon expanded={expanded === item.id} className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-outline-variant/40 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface shadow-sm transition hover:border-secondary hover:text-secondary"
              aria-label={t("dashOpenDrawer")}
              title={t("dashOpenDrawer")}
            >
              <Icon name="menu" className="text-[22px]" />
            </button>
            <div>
              <Breadcrumbs
                className="mb-1"
                items={[
                  { label: t("breadcrumbHome"), to: "/" },
                  { label: t("breadcrumbDashboard") },
                ]}
              />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-on-surface">
                  <Link to="/" className="text-primary hover:underline">
                    {t("brandName")}
                  </Link>
                  <span className="text-on-surface-variant">
                    {" "}
                    · {t("dashboardTitle")}
                  </span>
                </h1>
              </div>
              <p className="text-sm text-on-surface-variant">{t("dashboardSubtitle")}</p>
              {user ? (
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {user.name || user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="nav" />
            <Link to="/profile" className="app-btn-ghost text-xs">
              {t("profileTitle")}
            </Link>
            <Link to="/billing" className="app-btn-ghost text-xs">
              {t("billingManage")}
            </Link>
            <Link to="/" className="app-btn-ghost text-xs">
              {t("backToHome")}
            </Link>
            <button type="button" onClick={handleLogout} className="app-btn-ghost text-xs">
              {t("logout")}
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="app-btn-orange px-3 py-2 text-xs"
            >
              {t("addEntry")}
            </button>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  error ? "bg-red-500" : "bg-emerald-500"
                }`}
              />
              {error
                ? t("backendUnreachable")
                : loading
                  ? t("connecting")
                  : t("livePolling")}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {t("backendError")}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* 1. Shipments table — full width */}
          <section className="app-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3">
              <h2 className="text-sm font-bold text-on-surface">{t("dashOrdersTitle")}</h2>
              <div className="flex items-center gap-3">
                <p className="text-xs text-on-surface-variant">{t("autoRefresh")}</p>
                <ExpandButton
                  expanded={false}
                  onClick={() => toggleExpand("orders")}
                  label={t("dashExpand")}
                />
              </div>
            </div>
            <div className="px-4 pt-3">
              <StatsFilterBar
                filter={ordersFilter.filter}
                onChange={ordersFilter.setFilter}
                countries={ordersFilter.countries}
                cities={ordersFilter.cities}
                contactFilters
              />
            </div>
            <div className="max-h-[28rem]">
              <OrdersPanel shipments={ordersFilter.filtered} loading={loading} />
            </div>
          </section>

          {/* 2. Map + most frequent places */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section className="app-card relative overflow-hidden p-0">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">{t("dashMapTitle")}</h2>
                  <p className="text-xs text-on-surface-variant">{t("dashMapSupport")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-secondary">
                    {t("dashMapPlaceholder")}
                  </span>
                  <ExpandButton
                    expanded={false}
                    onClick={() => toggleExpand("map")}
                    label={t("dashExpand")}
                  />
                </div>
              </div>
              <div className="px-4 pt-3">
                <StatsFilterBar
                  filter={mapFilter.filter}
                  onChange={mapFilter.setFilter}
                  countries={mapFilter.countries}
                  cities={mapFilter.cities}
                />
              </div>
              {expanded !== null ? (
                <div className="flex h-72 items-center justify-center bg-surface-container-low text-sm text-on-surface-variant sm:h-80">
                  {expanded === "map"
                    ? t("dashMapFullscreenHint")
                    : t("dashMapPausedHint")}
                </div>
              ) : (
                <MapPanel analytics={mapFilter.analytics} mapInstanceKey="card" />
              )}
            </section>

            <section className="app-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">{t("dashPlacesTitle")}</h2>
                <div className="flex items-center gap-1.5">
                  <Icon name="location_on" className="text-[18px] text-tertiary" />
                  <ExpandButton
                    expanded={false}
                    onClick={() => toggleExpand("places")}
                    label={t("dashExpand")}
                  />
                </div>
              </div>
              <StatsFilterBar
                filter={placesFilter.filter}
                onChange={placesFilter.setFilter}
                countries={placesFilter.countries}
                cities={placesFilter.cities}
                compact
              />
              <PlacesPanel analytics={placesFilter.analytics} />
            </section>
          </div>

          {/* 3. Today + next day notes */}
          <DayNotesPreview />

          {/* 4. Tariff + weight */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="app-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">{t("dashTariffTitle")}</h2>
                <div className="flex items-center gap-1.5">
                  <Icon name="payments" className="text-[18px] text-primary" />
                  <ExpandButton
                    expanded={false}
                    onClick={() => toggleExpand("tariff")}
                    label={t("dashExpand")}
                  />
                </div>
              </div>
              <StatsFilterBar
                filter={tariffFilter.filter}
                onChange={tariffFilter.setFilter}
                countries={tariffFilter.countries}
                cities={tariffFilter.cities}
                compact
              />
              <TariffPanel analytics={tariffFilter.analytics} />
            </section>

            <section className="app-card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">{t("dashWeightTitle")}</h2>
                <div className="flex items-center gap-1.5">
                  <Icon name="scale" className="text-[18px] text-secondary" />
                  <ExpandButton
                    expanded={false}
                    onClick={() => toggleExpand("weight")}
                    label={t("dashExpand")}
                  />
                </div>
              </div>
              <StatsFilterBar
                filter={weightFilter.filter}
                onChange={weightFilter.setFilter}
                countries={weightFilter.countries}
                cities={weightFilter.cities}
                compact
              />
              <WeightPanel
                analytics={weightFilter.analytics}
                weightPct={weightPct}
                weightGoal={weightGoal}
              />
            </section>
          </div>
        </div>
      </main>

      <CalendarNotesFab />

      {/* Fullscreen expanded statistic */}
      {expanded && (
        <div className="fixed inset-0 z-[5000] flex bg-primary/50 backdrop-blur-sm">
          <div className="stat-expand-overlay flex h-full w-full flex-col overflow-hidden bg-surface-container-lowest shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3 sm:px-6">
              <h2 className="text-lg font-extrabold text-on-surface">{panelTitle(expanded)}</h2>
              <ExpandButton
                expanded
                onClick={() => setExpanded(null)}
                label={t("dashCollapse")}
              />
            </div>
            <div
              className={`min-h-0 flex-1 ${
                expanded === "orders" ? "overflow-hidden p-0" : "overflow-auto p-4 sm:p-6"
              }`}
            >
              {expanded === "weight" && (
                <>
                  <StatsFilterBar
                    filter={weightFilter.filter}
                    onChange={weightFilter.setFilter}
                    countries={weightFilter.countries}
                    cities={weightFilter.cities}
                  />
                  <WeightPanel
                    analytics={weightFilter.analytics}
                    weightPct={weightPct}
                    weightGoal={weightGoal}
                    expanded
                  />
                </>
              )}
              {expanded === "places" && (
                <>
                  <StatsFilterBar
                    filter={placesFilter.filter}
                    onChange={placesFilter.setFilter}
                    countries={placesFilter.countries}
                    cities={placesFilter.cities}
                  />
                  <PlacesPanel analytics={placesFilter.analytics} expanded />
                </>
              )}
              {expanded === "tariff" && (
                <>
                  <StatsFilterBar
                    filter={tariffFilter.filter}
                    onChange={tariffFilter.setFilter}
                    countries={tariffFilter.countries}
                    cities={tariffFilter.cities}
                  />
                  <TariffPanel analytics={tariffFilter.analytics} expanded />
                </>
              )}
              {expanded === "map" && (
                <div className="h-full p-2 sm:p-4">
                  <StatsFilterBar
                    filter={mapFilter.filter}
                    onChange={mapFilter.setFilter}
                    countries={mapFilter.countries}
                    cities={mapFilter.cities}
                  />
                  <MapPanel
                    analytics={mapFilter.analytics}
                    expanded
                    mapInstanceKey="fullscreen"
                  />
                </div>
              )}
              {expanded === "orders" && (
                <div className="flex h-full flex-col p-2 sm:p-4">
                  <StatsFilterBar
                    filter={ordersFilter.filter}
                    onChange={ordersFilter.setFilter}
                    countries={ordersFilter.countries}
                    cities={ordersFilter.cities}
                    contactFilters
                  />
                  <div className="min-h-0 flex-1">
                    <OrdersPanel shipments={ordersFilter.filtered} loading={loading} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && <AddShipmentModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
