import { useQuery } from "@apollo/client";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AddShipmentModal } from "../components/AddShipmentModal";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { StaticCopyCell } from "../components/CellCopyButton";
import { DeliveredCell } from "../components/DeliveredCell";
import { EditableCell } from "../components/EditableCell";
import { ExpandIcon } from "../components/ExpandIcon";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { CalendarNotesFab } from "../components/CalendarNotesFab";
import { CsvExportFab } from "../components/CsvExportFab";
import { DayNotesPreview } from "../components/DayNotesPreview";
import { StatsFilterBar } from "../components/StatsFilterBar";
import {
  computeDashboardAnalytics,
  EMPTY_STATS_FILTER,
  filterShipments,
  formatEuro,
  formatKg,
  formatLiters,
  isStatsFilterActive,
  uniqueCities,
  uniqueCountries,
  uniqueScanners,
  type DashboardAnalytics,
  type StatsFilter,
} from "../dashboardAnalytics";
import { TeamPanel } from "../components/TeamPanel";
import {
  DASHBOARD_STATS_QUERY,
  SHIPMENTS_FILTERED_QUERY,
  SHIPMENTS_QUERY,
} from "../graphql";
import { formatLocalDateTime, localDayKey } from "../i18n/formatDateTime";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";
import type { Shipment, ShipmentsQueryResult } from "../types";
import { ShipmentHeatMap } from "../components/ShipmentHeatMap";
import { useDashboardTour } from "../onboarding/DashboardTourProvider";

const POLL_INTERVAL_MS = 5000;
/** Silent full-tenant aggregates for weight / places / tariff / map. */
const STATS_POLL_INTERVAL_MS = 25000;

type StatPanel = "weight" | "places" | "tariff" | "map" | "orders";

const PANEL_ITEMS: { id: StatPanel; label: TranslationKey; icon: string }[] = [
  { id: "weight", label: "dashWeightTitle", icon: "scale" },
  { id: "places", label: "dashPlacesTitle", icon: "location_on" },
  { id: "tariff", label: "dashTariffTitle", icon: "payments" },
  { id: "map", label: "dashMapTitle", icon: "map" },
  { id: "orders", label: "dashOrdersTitle", icon: "table_chart" },
];

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function usePanelFilter(
  allShipments: Shipment[],
  fullStats: DashboardAnalytics | null = null,
) {
  const [filter, setFilter] = useState<StatsFilter>(EMPTY_STATS_FILTER);
  const filtered = useMemo(
    () => filterShipments(allShipments, filter),
    [allShipments, filter],
  );
  const filterActive = isStatsFilterActive(filter);
  const analytics = useMemo(() => {
    if (!filterActive && fullStats) return fullStats;
    return computeDashboardAnalytics(filtered, { cityLimit: Infinity });
  }, [filtered, filterActive, fullStats]);
  const countries = useMemo(
    () => uniqueCountries(allShipments),
    [allShipments],
  );
  const cities = useMemo(
    () => uniqueCities(allShipments, filter.country),
    [allShipments, filter.country],
  );
  const scanners = useMemo(() => uniqueScanners(allShipments), [allShipments]);
  return {
    filter,
    setFilter,
    filtered,
    analytics,
    countries,
    cities,
    scanners,
  };
}

/**
 * Orders table: latest 500 by default; when a filter is set, search full history.
 */
function useOrdersFilter(
  recentShipments: Shipment[],
  fullStats: DashboardAnalytics | null = null,
) {
  const [filter, setFilter] = useState<StatsFilter>(EMPTY_STATS_FILTER);
  const filterActive = isStatsFilterActive(filter);
  const debouncedFilter = useDebouncedValue(filter, 350);
  const debouncedActive = isStatsFilterActive(debouncedFilter);
  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    [],
  );

  const { data, loading } = useQuery<{
    shipmentsFiltered: { nodes: Shipment[]; totalCount: number };
  }>(SHIPMENTS_FILTERED_QUERY, {
    variables: {
      dateFrom: debouncedFilter.dateFrom || null,
      dateTo: debouncedFilter.dateTo || null,
      country: debouncedFilter.country || null,
      city: debouncedFilter.city || null,
      scannedBy: debouncedFilter.scannedBy || null,
      publicCode: debouncedFilter.publicCode || null,
      senderName: debouncedFilter.senderName || null,
      receiverName: debouncedFilter.receiverName || null,
      senderPhone: debouncedFilter.senderPhone || null,
      receiverPhone: debouncedFilter.receiverPhone || null,
      idDocType: debouncedFilter.idDocType || null,
      idDocNumber: debouncedFilter.idDocNumber || null,
      timeZone,
      limit: 500,
    },
    skip: !debouncedActive,
    fetchPolicy: "network-only",
  });

  // Wait for debounce before switching off the latest-500 view.
  const filtered = debouncedActive
    ? (data?.shipmentsFiltered?.nodes ?? [])
    : recentShipments;
  const matchCount = debouncedActive
    ? (data?.shipmentsFiltered?.totalCount ?? 0)
    : recentShipments.length;
  const filterLoading =
    filterActive &&
    (filter !== debouncedFilter || (debouncedActive && loading));

  const countries = useMemo(() => {
    const fromLoaded = uniqueCountries(recentShipments);
    const fromStats = (fullStats?.cities ?? [])
      .map((c) => c.country)
      .filter(Boolean);
    return Array.from(new Set([...fromLoaded, ...fromStats])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [recentShipments, fullStats]);
  const cities = useMemo(() => {
    const fromLoaded = uniqueCities(recentShipments, filter.country);
    const fromStats = (fullStats?.cities ?? [])
      .filter((c) => !filter.country || c.country === filter.country)
      .map((c) => c.name)
      .filter(Boolean);
    return Array.from(new Set([...fromLoaded, ...fromStats])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [recentShipments, filter.country, fullStats]);
  const scanners = useMemo(
    () => uniqueScanners(recentShipments),
    [recentShipments],
  );

  return {
    filter,
    setFilter,
    filtered,
    matchCount,
    filterLoading,
    countries,
    cities,
    scanners,
  };
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

type WeightDayPoint = {
  date: string;
  weight: number;
  oil: number;
  estimate: number;
  count: number;
};

function buildWeightSeries(shipments: Shipment[]): WeightDayPoint[] {
  const byDay = new Map<string, WeightDayPoint>();
  for (const s of shipments) {
    const date = localDayKey(s.timestamp) || "unknown";
    const entry = byDay.get(date) ?? {
      date,
      weight: 0,
      oil: 0,
      estimate: 0,
      count: 0,
    };
    entry.weight += Number(s.weightKg) || 0;
    entry.oil += Number(s.oilLiters) || 0;
    entry.estimate += Number(s.estimateWeightKg) || 0;
    entry.count += 1;
    byDay.set(date, entry);
  }
  return [...byDay.values()]
    .filter((p) => p.date !== "unknown")
    .sort((a, b) => a.date.localeCompare(b.date));
}

function weightExtraStats(series: WeightDayPoint[], totalWeight: number) {
  if (series.length === 0) {
    return {
      peak: null as WeightDayPoint | null,
      quiet: null as WeightDayPoint | null,
      activeDays: 0,
      avgPerDay: 0,
      periodDeltaPct: null as number | null,
    };
  }
  let peak = series[0]!;
  let quiet = series[0]!;
  for (const p of series) {
    if (p.weight > peak.weight) peak = p;
    if (p.weight < quiet.weight) quiet = p;
  }
  const first = series[0]!;
  const last = series[series.length - 1]!;
  let periodDeltaPct: number | null = null;
  if (first.weight > 0) {
    periodDeltaPct = ((last.weight - first.weight) / first.weight) * 100;
  } else if (last.weight > 0) {
    periodDeltaPct = 100;
  } else {
    periodDeltaPct = 0;
  }
  return {
    peak,
    quiet,
    activeDays: series.length,
    avgPerDay: totalWeight / series.length,
    periodDeltaPct,
  };
}

function WeightGauge({
  weightPct,
  size,
  animate,
}: {
  weightPct: number;
  size: "sm" | "lg";
  animate?: boolean;
}) {
  const trackRef = useRef<SVGPathElement | null>(null);
  const arcRef = useRef<SVGPathElement | null>(null);
  const displayPct = useCountUp(weightPct, Boolean(animate), 1200);
  const clamped = Math.min(100, Math.max(0, weightPct));

  useLayoutEffect(() => {
    const arc = arcRef.current;
    const track = trackRef.current;
    if (!arc) return;
    const len = track?.getTotalLength() || arc.getTotalLength() || Math.PI * 50;
    const offset = len * (1 - clamped / 100);
    arc.style.strokeDasharray = `${len}`;
    if (!animate) {
      arc.style.transition = "none";
      arc.style.strokeDashoffset = `${offset}`;
      return;
    }
    arc.style.transition = "none";
    arc.style.strokeDashoffset = `${len}`;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        arc.style.transition =
          "stroke-dashoffset 1.25s cubic-bezier(0.22, 1, 0.36, 1)";
        arc.style.strokeDashoffset = `${offset}`;
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [animate, clamped]);

  return (
    <div
      className={`relative mx-auto w-full ${
        size === "lg" ? "max-w-[22rem]" : "max-w-[11rem]"
      }`}
      style={{ aspectRatio: "120 / 78" }}
    >
      <svg
        viewBox="0 0 120 78"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <path
          ref={trackRef}
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          ref={arcRef}
          d="M10 60 A50 50 0 0 1 110 60"
          fill="none"
          stroke="#00A8A8"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-[6%] flex justify-center">
        <p
          className={`font-extrabold tabular-nums leading-none text-on-surface ${
            size === "lg" ? "text-5xl sm:text-6xl" : "text-2xl"
          }`}
        >
          {Math.round(displayPct)}%
        </p>
      </div>
    </div>
  );
}

function WeightPanel({
  analytics,
  weightPct,
  weightGoal,
  shipments = [],
  expanded,
}: {
  analytics: DashboardAnalytics;
  weightPct: number;
  weightGoal: number;
  shipments?: Shipment[];
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  const animate = Boolean(expanded);
  const series = useMemo(() => {
    if (analytics.weightSeries && analytics.weightSeries.length > 0) {
      return analytics.weightSeries;
    }
    return buildWeightSeries(shipments);
  }, [analytics.weightSeries, shipments]);
  const extras = useMemo(
    () => weightExtraStats(series, analytics.totalWeight),
    [series, analytics.totalWeight],
  );

  const totalWeight = useCountUp(analytics.totalWeight, animate);
  const totalOil = useCountUp(analytics.totalOil, animate);
  const totalEstimate = useCountUp(analytics.totalEstimateWeight, animate);
  const avgWeight = useCountUp(analytics.avgWeight, animate);
  const avgEstimate = useCountUp(analytics.avgEstimateWeight, animate);
  const shipmentCount = useCountUp(analytics.shipmentCount, animate);
  const avgOil =
    analytics.shipmentCount > 0
      ? analytics.totalOil / analytics.shipmentCount
      : 0;
  const avgOilAnim = useCountUp(avgOil, animate);
  const peakVal = useCountUp(extras.peak?.weight ?? 0, animate);
  const quietVal = useCountUp(extras.quiet?.weight ?? 0, animate);
  const avgPerDay = useCountUp(extras.avgPerDay, animate);
  const daysCount = useCountUp(extras.activeDays, animate);
  const delta = useCountUp(extras.periodDeltaPct ?? 0, animate);
  const goalAnim = useCountUp(weightGoal, animate);

  if (!expanded) {
    return (
      <div>
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
              {t("estimateWeightCol")}:{" "}
              {formatKg(analytics.totalEstimateWeight)}
            </span>
          ) : null}
        </div>
        <WeightGauge weightPct={weightPct} size="sm" />
        <p className="mt-2 text-center text-xs text-on-surface-variant">
          {formatKg(analytics.totalWeight)} / {formatKg(weightGoal)}
        </p>
      </div>
    );
  }

  const deltaLabel =
    extras.periodDeltaPct == null
      ? "—"
      : `${extras.periodDeltaPct >= 0 ? "+" : ""}${delta.toFixed(0)}%`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("weight")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-secondary sm:text-4xl">
            {formatKg(totalWeight)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("oil")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-tertiary sm:text-4xl">
            {formatLiters(totalOil)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("estimateWeightCol")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary sm:text-4xl">
            {formatKg(totalEstimate)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashShipments")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-on-surface sm:text-4xl">
            {Math.round(shipmentCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashAvgWeight")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-on-surface sm:text-3xl">
            {formatKg(avgWeight)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t("dashWeightAvgOil")}: {formatLiters(avgOilAnim)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashWeightAvgEstimate")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">
            {formatKg(avgEstimate)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashWeightPeakDay")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-secondary sm:text-3xl">
            {formatKg(peakVal)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {extras.peak?.date ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/50 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashWeightPeriodChange")}
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl ${
              (extras.periodDeltaPct ?? 0) >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {deltaLabel}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t("dashWeightAvgPerDay")}: {formatKg(avgPerDay)}
            {" · "}
            {Math.round(daysCount)} {t("dashTariffActiveDays")}
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
        <div className="flex flex-col justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-4 sm:p-6">
          <WeightGauge weightPct={weightPct} size="lg" animate />
          <p className="mt-3 text-center text-sm text-on-surface-variant">
            <span className="font-semibold tabular-nums text-on-surface">
              {formatKg(totalWeight)}
            </span>
            {" / "}
            {formatKg(goalAnim)}
          </p>
          <p className="mt-1 text-center text-xs text-on-surface-variant">
            {t("dashWeightQuietDay")}: {formatKg(quietVal)}
            {extras.quiet ? ` · ${extras.quiet.date}` : ""}
          </p>
        </div>
        <div className="flex min-h-0 flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-3 sm:p-5">
          <WeightTrendChart series={series} animate />
        </div>
      </div>
    </div>
  );
}

type WeightFocus = "all" | "weight" | "oil";

function WeightTrendChart({
  series,
  animate = false,
}: {
  series: WeightDayPoint[];
  animate?: boolean;
}) {
  const { t } = useLanguage();
  const gradId = useId().replace(/:/g, "");
  const weightLineRef = useRef<SVGPathElement | null>(null);
  const oilLineRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const [focus, setFocus] = useState<WeightFocus>("all");
  const seriesKey = series
    .map((p) => `${p.date}:${p.weight}:${p.oil}`)
    .join("|");

  const showWeight = focus === "all" || focus === "weight";
  const showOil = focus === "all" || focus === "oil";

  useLayoutEffect(() => {
    if (!animate) return;
    const lines = [
      showWeight ? weightLineRef.current : null,
      showOil ? oilLineRef.current : null,
    ].filter(Boolean) as SVGPathElement[];
    const area = showWeight ? areaRef.current : null;
    for (const line of lines) {
      const length = line.getTotalLength();
      line.style.transition = "none";
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
    }
    if (area) {
      area.style.transition = "none";
      area.style.opacity = "0";
    }
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        for (const line of lines) {
          line.style.transition =
            "stroke-dashoffset 1.35s cubic-bezier(0.22, 1, 0.36, 1)";
          line.style.strokeDashoffset = "0";
        }
        if (area) {
          area.style.transition = "opacity 0.85s ease 0.45s";
          area.style.opacity = "1";
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [animate, seriesKey, focus, showWeight, showOil]);

  if (series.length < 2) {
    return (
      <p className="mt-3 text-xs text-on-surface-variant">
        {t("dashWeightNoTrend")}
      </p>
    );
  }

  const maxW = Math.max(...series.map((p) => p.weight), 1);
  const maxO = Math.max(...series.map((p) => p.oil), 1);
  const w = 960;
  const h = 320;
  const padX = 16;
  const padY = 20;
  const weightPoints = series.map((p, i) => {
    const x = padX + (i / (series.length - 1)) * (w - padX * 2);
    const y = h - padY - (p.weight / maxW) * (h - padY * 2);
    return { x, y, ...p };
  });
  const oilPoints = series.map((p, i) => {
    const x = padX + (i / (series.length - 1)) * (w - padX * 2);
    const y = h - padY - (p.oil / maxO) * (h - padY * 2);
    return { x, y, ...p };
  });
  const weightLine = weightPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  const oilLine = oilPoints
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  const area = `${weightLine} L${weightPoints[weightPoints.length - 1]!.x} ${h} L${weightPoints[0]!.x} ${h} Z`;
  const first = series[0]!;
  const last = series[series.length - 1]!;

  const selectFocus = (next: WeightFocus, event: ReactMouseEvent) => {
    event.stopPropagation();
    setFocus(next);
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      onClick={() => setFocus("all")}
    >
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
          {t("dashWeightTrend")}
        </p>
        <div className="flex gap-2 text-[10px] font-semibold">
          <button
            type="button"
            onClick={(e) => selectFocus("weight", e)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition ${
              focus === "weight"
                ? "bg-[#00A8A8]/15 text-[#007a7a] ring-1 ring-[#00A8A8]/40"
                : focus === "oil"
                  ? "text-on-surface-variant/40"
                  : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#00A8A8]" />
            {t("weight")}
          </button>
          <button
            type="button"
            onClick={(e) => selectFocus("oil", e)}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 transition ${
              focus === "oil"
                ? "bg-[#FF7A00]/15 text-[#c45a00] ring-1 ring-[#FF7A00]/40"
                : focus === "weight"
                  ? "text-on-surface-variant/40"
                  : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-[#FF7A00]" />
            {t("oil")}
          </button>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-0 w-full flex-1 cursor-pointer"
        preserveAspectRatio="none"
        onClick={() => setFocus("all")}
      >
        <defs>
          <linearGradient
            id={`weightFill-${gradId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#00A8A8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#00A8A8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={w} height={h} fill="transparent" />
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={w - padX}
            y1={h - padY - f * (h - padY * 2)}
            y2={h - padY - f * (h - padY * 2)}
            stroke="currentColor"
            className="text-outline-variant/40"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}
        {showWeight ? (
          <path
            ref={areaRef}
            d={area}
            fill={`url(#weightFill-${gradId})`}
            style={animate ? { opacity: 0 } : undefined}
            onClick={(e) => selectFocus("weight", e)}
          />
        ) : null}
        {showWeight ? (
          <path
            ref={weightLineRef}
            d={weightLine}
            fill="none"
            stroke="#00A8A8"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            onClick={(e) => selectFocus("weight", e)}
          />
        ) : null}
        {showOil ? (
          <path
            ref={oilLineRef}
            d={oilLine}
            fill="none"
            stroke="#FF7A00"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cursor-pointer"
            onClick={(e) => selectFocus("oil", e)}
          />
        ) : null}
        {/* Wider invisible hit targets for easier line clicks */}
        {showWeight ? (
          <path
            d={weightLine}
            fill="none"
            stroke="transparent"
            strokeWidth="18"
            className="cursor-pointer"
            onClick={(e) => selectFocus("weight", e)}
          />
        ) : null}
        {showOil ? (
          <path
            d={oilLine}
            fill="none"
            stroke="transparent"
            strokeWidth="18"
            className="cursor-pointer"
            onClick={(e) => selectFocus("oil", e)}
          />
        ) : null}
        {showWeight
          ? weightPoints.map((p) => (
              <circle
                key={`w-${p.date}`}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#00A8A8"
                className="tariff-point-pop cursor-pointer"
                onClick={(e) => selectFocus("weight", e)}
              />
            ))
          : null}
        {showOil
          ? oilPoints.map((p) => (
              <circle
                key={`o-${p.date}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="#FF7A00"
                className="tariff-point-pop cursor-pointer"
                onClick={(e) => selectFocus("oil", e)}
              />
            ))
          : null}
      </svg>
      <div className="mt-1 flex shrink-0 justify-between text-[10px] text-on-surface-variant sm:text-xs">
        <span>
          {first.date}
          {showWeight ? ` · ${formatKg(first.weight)}` : ""}
          {showOil ? ` · ${formatLiters(first.oil)}` : ""}
        </span>
        <span>
          {last.date}
          {showWeight ? ` · ${formatKg(last.weight)}` : ""}
          {showOil ? ` · ${formatLiters(last.oil)}` : ""}
        </span>
      </div>
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

  if (!expanded) {
    const cities = analytics.cities.slice(0, 5);
    if (cities.length === 0) {
      return (
        <p className="text-xs text-on-surface-variant">{t("dashNoCities")}</p>
      );
    }
    return (
      <ul className="space-y-3">
        {cities.map((city) => (
          <li key={`${city.name}-${city.country}-${city.regionName}`}>
            <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
              <span className="font-semibold text-on-surface">
                {city.name}
                {(city.regionName || city.country) && (
                  <span className="ml-1 font-normal text-on-surface-variant">
                    (
                    {[city.regionName, city.country].filter(Boolean).join(", ")}
                    )
                  </span>
                )}
              </span>
              <span className="text-on-surface-variant">
                {city.count}/{analytics.shipmentCount} ·{" "}
                {analytics.shipmentCount > 0
                  ? Math.round((city.count / analytics.shipmentCount) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-container">
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-full flex-1 rounded-sm ${
                    i < Math.round(city.share * 20)
                      ? "bg-tertiary"
                      : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return <PlacesExpandedPanel analytics={analytics} />;
}

function PlacesExpandedPanel({ analytics }: { analytics: DashboardAnalytics }) {
  const { t } = useLanguage();
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const cities = analytics.cities;
  const regions = analytics.regions;
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    for (const c of cities) if (c.country) set.add(c.country);
    return set.size;
  }, [cities]);

  const topCity = cities[0] ?? null;
  const topRegion = regions[0] ?? null;
  const top3Share = cities.slice(0, 3).reduce((sum, c) => sum + c.share, 0);
  const maxCount = Math.max(...cities.map((c) => c.count), 1);

  const shipmentCount = useCountUp(analytics.shipmentCount, true);
  const cityCount = useCountUp(cities.length, true);
  const regionCount = useCountUp(regions.length, true);
  const countryCount = useCountUp(uniqueCountries, true);
  const topCityCount = useCountUp(topCity?.count ?? 0, true);
  const topCityShare = useCountUp((topCity?.share ?? 0) * 100, true);
  const topRegionCount = useCountUp(topRegion?.count ?? 0, true);
  const top3ShareAnim = useCountUp(top3Share * 100, true);

  if (cities.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">{t("dashNoCities")}</p>
    );
  }

  const cityKey = (c: (typeof cities)[number]) =>
    `${c.name}|${c.country}|${c.regionName}`;

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto"
      onClick={() => setFocusKey(null)}
    >
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashShipments")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-on-surface sm:text-4xl">
            {Math.round(shipmentCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesCities")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-tertiary sm:text-4xl">
            {Math.round(cityCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesRegions")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary sm:text-4xl">
            {Math.round(regionCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesCountries")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-secondary sm:text-4xl">
            {Math.round(countryCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTopCities")}
          </p>
          <p className="mt-1 truncate text-xl font-extrabold text-on-surface sm:text-2xl">
            {topCity?.name ?? "—"}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {Math.round(topCityCount)} · {topCityShare.toFixed(0)}%
            {topCity?.country ? ` · ${topCity.country}` : ""}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesTopRegion")}
          </p>
          <p className="mt-1 truncate text-xl font-extrabold text-on-surface sm:text-2xl">
            {topRegion?.name ?? "—"}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {Math.round(topRegionCount)}
            {topRegion?.country ? ` · ${topRegion.country}` : ""}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesTopShare")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-tertiary sm:text-3xl">
            {topCityShare.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t("dashPlacesOfTotal")}
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/50 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesTop3")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">
            {top3ShareAnim.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t("dashPlacesConcentration")}
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className="flex min-h-[18rem] flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-3 sm:p-5 lg:min-h-0"
          onClick={() => setFocusKey(null)}
        >
          <p className="mb-3 shrink-0 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesRanking")}
          </p>
          <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {cities.map((city, index) => {
              const key = cityKey(city);
              const focused = focusKey === key;
              const dimmed = focusKey != null && !focused;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusKey(focused ? null : key);
                    }}
                    className={`w-full rounded-xl px-2 py-2 text-left transition ${
                      focused
                        ? "bg-tertiary/10 ring-1 ring-tertiary/40"
                        : dimmed
                          ? "opacity-35 hover:opacity-70"
                          : "hover:bg-surface-container"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="min-w-0 font-semibold text-on-surface">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-surface-container text-[10px] font-bold text-on-surface-variant">
                          {index + 1}
                        </span>
                        {city.name}
                        {(city.regionName || city.country) && (
                          <span className="ml-1 font-normal text-on-surface-variant">
                            (
                            {[city.regionName, city.country]
                              .filter(Boolean)
                              .join(", ")}
                            )
                          </span>
                        )}
                      </span>
                      <PlaceCountLabel
                        count={city.count}
                        total={analytics.shipmentCount}
                      />
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="places-bar-grow h-full rounded-full bg-tertiary"
                        style={{
                          width: `${(city.count / maxCount) * 100}%`,
                          animationDelay: `${Math.min(index, 12) * 0.05}s`,
                        }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className="flex min-h-[18rem] flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-3 sm:p-5 lg:min-h-0"
          onClick={() => setFocusKey(null)}
        >
          <p className="mb-3 shrink-0 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashPlacesRegionsRanking")}
          </p>
          <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {regions.length === 0 ? (
              <li className="text-xs text-on-surface-variant">
                {t("dashNoCities")}
              </li>
            ) : (
              regions.map((region, index) => {
                const key = `region|${region.name}|${region.country}`;
                const focused = focusKey === key;
                const dimmed = focusKey != null && !focused;
                const regionMax = Math.max(...regions.map((r) => r.count), 1);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusKey(focused ? null : key);
                      }}
                      className={`w-full rounded-xl px-2 py-2 text-left transition ${
                        focused
                          ? "bg-primary/10 ring-1 ring-primary/40"
                          : dimmed
                            ? "opacity-35 hover:opacity-70"
                            : "hover:bg-surface-container"
                      }`}
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="min-w-0 font-semibold text-on-surface">
                          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-surface-container text-[10px] font-bold text-on-surface-variant">
                            {index + 1}
                          </span>
                          {region.name}
                          {region.country ? (
                            <span className="ml-1 font-normal text-on-surface-variant">
                              ({region.country})
                            </span>
                          ) : null}
                        </span>
                        <PlaceCountLabel
                          count={region.count}
                          total={analytics.shipmentCount}
                        />
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                        <div
                          className="places-bar-grow h-full rounded-full bg-primary"
                          style={{
                            width: `${(region.count / regionMax) * 100}%`,
                            animationDelay: `${Math.min(index, 12) * 0.05}s`,
                          }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <PlacesPieChart
          cities={cities}
          shipmentTotal={analytics.shipmentCount}
          focusKey={focusKey}
          onFocusKeyChange={setFocusKey}
          cityKey={cityKey}
        />
      </div>
    </div>
  );
}

const PIE_COLORS = [
  "#00A8A8",
  "#FF7A00",
  "#0F766E",
  "#F59E0B",
  "#334155",
  "#14B8A6",
  "#EA580C",
  "#64748B",
];

type PieSlice = {
  key: string;
  label: string;
  detail: string;
  count: number;
  share: number;
  color: string;
  start: number;
  end: number;
  mid: number;
};

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function slicePath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  const span = end - start;
  if (span <= 0.0001) return "";
  if (span >= Math.PI * 2 - 0.0001) {
    // Full circle as two semicircles
    const mid = start + Math.PI;
    const a = polar(cx, cy, r, start);
    const b = polar(cx, cy, r, mid);
    const c = polar(cx, cy, r, start + Math.PI * 2);
    return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 1 1 ${b.x} ${b.y} A ${r} ${r} 0 1 1 ${c.x} ${c.y} Z`;
  }
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const large = span > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y} Z`;
}

function PlacesPieChart({
  cities,
  shipmentTotal,
  focusKey,
  onFocusKeyChange,
  cityKey,
}: {
  cities: DashboardAnalytics["cities"];
  shipmentTotal: number;
  focusKey: string | null;
  onFocusKeyChange: (key: string | null) => void;
  cityKey: (c: DashboardAnalytics["cities"][number]) => string;
}) {
  const { t } = useLanguage();
  const maskId = useId().replace(/:/g, "");
  const revealRef = useRef<SVGCircleElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  const slices = useMemo((): PieSlice[] => {
    if (cities.length === 0) return [];
    const TOP = 7;
    const top = cities.slice(0, TOP);
    const rest = cities.slice(TOP);
    const denom = shipmentTotal > 0 ? shipmentTotal : 1;
    const items: {
      key: string;
      label: string;
      detail: string;
      count: number;
      share: number;
    }[] = top.map((c) => ({
      key: cityKey(c),
      label: c.name,
      detail: [c.regionName, c.country].filter(Boolean).join(", "),
      count: c.count,
      share: c.count / denom,
    }));
    if (rest.length > 0) {
      const count = rest.reduce((s, c) => s + c.count, 0);
      items.push({
        key: "__other__",
        label: t("dashPlacesOther"),
        detail: t("dashPlacesOtherDetail").replace("{n}", String(rest.length)),
        count,
        share: count / denom,
      });
    }
    const pieTotal = items.reduce((s, i) => s + i.count, 0) || 1;
    // SVG angles: 0 = 3 o'clock; start at 12 o'clock (-π/2), sweep clockwise.
    let angle = -Math.PI / 2;
    return items.map((item, i) => {
      const span = (item.count / pieTotal) * Math.PI * 2;
      const start = angle;
      const end = angle + span;
      const mid = start + span / 2;
      angle = end;
      return {
        ...item,
        color: PIE_COLORS[i % PIE_COLORS.length]!,
        start,
        end,
        mid,
      };
    });
  }, [cities, cityKey, shipmentTotal, t]);

  useLayoutEffect(() => {
    const circle = revealRef.current;
    if (!circle || slices.length === 0) return;
    const r = 55;
    const circ = 2 * Math.PI * r;
    circle.style.transition = "none";
    circle.style.strokeDasharray = `${circ}`;
    circle.style.strokeDashoffset = `${circ}`;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        circle.style.transition =
          "stroke-dashoffset 1.45s cubic-bezier(0.22, 1, 0.36, 1)";
        circle.style.strokeDashoffset = "0";
        window.setTimeout(() => setRevealed(true), 1450);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      setRevealed(false);
    };
  }, [slices]);

  if (slices.length === 0) return null;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const baseR = 86;
  const selected = slices.find((s) => s.key === focusKey) ?? null;
  const popup = selected ? polar(cx, cy, baseR * 0.42, selected.mid) : null;

  return (
    <div
      className="flex min-h-[18rem] flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-3 sm:p-5 lg:min-h-0"
      onClick={() => onFocusKeyChange(null)}
    >
      <p className="mb-3 shrink-0 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
        {t("dashPlacesPieTitle")}
      </p>
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto">
        <div className="relative mx-auto aspect-square w-full max-w-[220px] shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={t("dashPlacesPieTitle")}
          >
            <defs>
              <mask id={`pie-reveal-${maskId}`}>
                <circle
                  ref={revealRef}
                  cx={cx}
                  cy={cy}
                  r={55}
                  fill="none"
                  stroke="white"
                  strokeWidth={110}
                  strokeDasharray={2 * Math.PI * 55}
                  strokeDashoffset={2 * Math.PI * 55}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              </mask>
            </defs>
            <g mask={`url(#pie-reveal-${maskId})`}>
              {slices.map((slice) => {
                const focused = focusKey === slice.key;
                const dimmed = focusKey != null && !focused;
                const explode = focused ? 10 : 0;
                const ox = Math.cos(slice.mid) * explode;
                const oy = Math.sin(slice.mid) * explode;
                const r = focused ? baseR + 6 : baseR;
                const d = slicePath(
                  cx + ox,
                  cy + oy,
                  r,
                  slice.start,
                  slice.end,
                );
                if (!d) return null;
                return (
                  <path
                    key={slice.key}
                    d={d}
                    fill={slice.color}
                    opacity={dimmed ? 0.28 : 1}
                    className="cursor-pointer transition-[opacity,transform] duration-300 ease-out"
                    style={{
                      filter: focused
                        ? "drop-shadow(0 4px 10px rgba(15,23,42,0.28))"
                        : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusKeyChange(focused ? null : slice.key);
                    }}
                  />
                );
              })}
            </g>
            {/* Soft hole for donut look */}
            <circle
              cx={cx}
              cy={cy}
              r={34}
              fill="rgb(var(--color-surface-container-lowest))"
            />
            {selected && popup && revealed ? (
              <foreignObject
                x={Math.min(Math.max(popup.x - 72, 4), size - 148)}
                y={Math.min(Math.max(popup.y - 40, 4), size - 84)}
                width={144}
                height={80}
              >
                <div
                  className="places-pie-popup rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="truncate text-xs font-bold text-on-surface">
                    {selected.label}
                  </p>
                  {selected.detail ? (
                    <p className="truncate text-[10px] text-on-surface-variant">
                      {selected.detail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-extrabold tabular-nums text-on-surface">
                    {selected.count}/{shipmentTotal} ·{" "}
                    {Math.round(selected.share * 100)}%
                  </p>
                </div>
              </foreignObject>
            ) : null}
          </svg>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-1.5">
          {slices.map((slice) => {
            const focused = focusKey === slice.key;
            const dimmed = focusKey != null && !focused;
            return (
              <button
                key={slice.key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFocusKeyChange(focused ? null : slice.key);
                }}
                className={`inline-flex w-full max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                  focused
                    ? "border-outline-variant bg-surface-container-lowest shadow-sm"
                    : dimmed
                      ? "border-transparent opacity-40"
                      : "border-transparent hover:bg-surface-container"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate font-semibold text-on-surface">
                  {slice.label}
                </span>
                <span className="shrink-0 tabular-nums text-on-surface-variant">
                  {Math.round(slice.share * 100)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlaceCountLabel({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const countAnim = useCountUp(count, true, 900);
  const pctAnim = useCountUp(pct, true, 900);
  return (
    <span className="shrink-0 tabular-nums text-on-surface-variant">
      {Math.round(countAnim)}/{total} · {pctAnim.toFixed(0)}%
    </span>
  );
}

function useCountUp(target: number, enabled: boolean, durationMs = 1100) {
  const [value, setValue] = useState(() => (enabled ? 0 : target));

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    setValue(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, durationMs]);

  return value;
}

function tariffExtraStats(
  series: DashboardAnalytics["tariffSeries"],
  totalTariff: number,
) {
  if (series.length === 0) {
    return {
      peak: null as { date: string; total: number } | null,
      quiet: null as { date: string; total: number } | null,
      activeDays: 0,
      avgPerDay: 0,
      periodDeltaPct: null as number | null,
    };
  }
  let peak = series[0]!;
  let quiet = series[0]!;
  for (const p of series) {
    if (p.total > peak.total) peak = p;
    if (p.total < quiet.total) quiet = p;
  }
  const first = series[0]!;
  const last = series[series.length - 1]!;
  let periodDeltaPct: number | null = null;
  if (first.total > 0) {
    periodDeltaPct = ((last.total - first.total) / first.total) * 100;
  } else if (last.total > 0) {
    periodDeltaPct = 100;
  } else {
    periodDeltaPct = 0;
  }
  return {
    peak,
    quiet,
    activeDays: series.length,
    avgPerDay: totalTariff / series.length,
    periodDeltaPct,
  };
}

function TariffPanel({
  analytics,
  expanded,
}: {
  analytics: DashboardAnalytics;
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  const animate = Boolean(expanded);
  const total = useCountUp(analytics.totalTariff, animate);
  const avg = useCountUp(analytics.avgTariff, animate);
  const avgWeight = useCountUp(analytics.avgWeight, animate);
  const shipmentCount = useCountUp(analytics.shipmentCount, animate);
  const extras = useMemo(
    () => tariffExtraStats(analytics.tariffSeries, analytics.totalTariff),
    [analytics.tariffSeries, analytics.totalTariff],
  );
  const peakVal = useCountUp(extras.peak?.total ?? 0, animate);
  const quietVal = useCountUp(extras.quiet?.total ?? 0, animate);
  const avgPerDay = useCountUp(extras.avgPerDay, animate);
  const daysCount = useCountUp(extras.activeDays, animate);
  const delta = useCountUp(extras.periodDeltaPct ?? 0, animate);

  if (!expanded) {
    return (
      <div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-container-low p-3 sm:p-5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
              {t("dashTariffTotal")}
            </p>
            <p className="mt-1 text-lg font-extrabold text-primary">
              {formatEuro(analytics.totalTariff)}
            </p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3 sm:p-5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
              {t("dashTariffAvg")}
            </p>
            <p className="mt-1 text-lg font-extrabold text-tertiary">
              {formatEuro(analytics.avgTariff)}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/50 p-3 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashAvgWeight")}
          </p>
          <p className="mt-1 text-base font-bold text-on-surface">
            {formatKg(analytics.avgWeight)}
          </p>
        </div>
        <TariffTrendChart series={analytics.tariffSeries} expanded={false} />
      </div>
    );
  }

  const deltaLabel =
    extras.periodDeltaPct == null
      ? "—"
      : `${extras.periodDeltaPct >= 0 ? "+" : ""}${delta.toFixed(0)}%`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffTotal")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary sm:text-4xl">
            {formatEuro(total)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffAvg")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-tertiary sm:text-4xl">
            {formatEuro(avg)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashShipments")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-on-surface sm:text-4xl">
            {Math.round(shipmentCount).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashAvgWeight")}
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-on-surface sm:text-4xl">
            {formatKg(avgWeight)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffPeakDay")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary sm:text-3xl">
            {formatEuro(peakVal)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {extras.peak?.date ?? "—"}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffQuietDay")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-on-surface sm:text-3xl">
            {formatEuro(quietVal)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {extras.quiet?.date ?? "—"}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffAvgPerDay")}
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-tertiary sm:text-3xl">
            {formatEuro(avgPerDay)}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {Math.round(daysCount)} {t("dashTariffActiveDays")}
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/50 p-4 sm:p-5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
            {t("dashTariffPeriodChange")}
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl ${
              (extras.periodDeltaPct ?? 0) >= 0
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {deltaLabel}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {t("dashTariffFirstVsLast")}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-low/40 p-3 sm:p-5">
        <TariffTrendChart series={analytics.tariffSeries} expanded animate />
      </div>
    </div>
  );
}

function TariffTrendChart({
  series,
  expanded,
  animate = false,
}: {
  series: DashboardAnalytics["tariffSeries"];
  expanded?: boolean;
  animate?: boolean;
}) {
  const { t } = useLanguage();
  const gradId = useId().replace(/:/g, "");
  const lineRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);
  const seriesKey = series.map((p) => `${p.date}:${p.total}`).join("|");

  useLayoutEffect(() => {
    if (!animate) return;
    const line = lineRef.current;
    const area = areaRef.current;
    if (!line) return;

    const length = line.getTotalLength();
    line.style.transition = "none";
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;
    if (area) {
      area.style.transition = "none";
      area.style.opacity = "0";
    }

    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        line.style.transition =
          "stroke-dashoffset 1.35s cubic-bezier(0.22, 1, 0.36, 1)";
        line.style.strokeDashoffset = "0";
        if (area) {
          area.style.transition = "opacity 0.85s ease 0.45s";
          area.style.opacity = "1";
        }
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [animate, seriesKey]);

  if (series.length < 2) {
    return (
      <p className="mt-3 text-xs text-on-surface-variant">
        {t("dashTariffNoTrend")}
      </p>
    );
  }

  const max = Math.max(...series.map((p) => p.total), 1);
  const w = expanded ? 960 : 200;
  const h = expanded ? 320 : 60;
  const padX = expanded ? 16 : 4;
  const padY = expanded ? 20 : 4;
  const points = series.map((p, i) => {
    const x = padX + (i / (series.length - 1)) * (w - padX * 2);
    const y = h - padY - (p.total / max) * (h - padY * 2);
    return { x, y, ...p };
  });
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1]!.x} ${h} L${points[0]!.x} ${h} Z`;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const strokeW = expanded ? 3.5 : 2.5;

  return (
    <div
      className={`flex min-h-0 flex-col ${expanded ? "h-full" : "mt-4 h-20"}`}
    >
      <p className="mb-1 shrink-0 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
        {t("dashTariffTrend")}
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`w-full ${expanded ? "min-h-0 flex-1" : "h-[calc(100%-1rem)]"}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id={`tariffFill-${gradId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FF7A00" stopOpacity="0" />
          </linearGradient>
        </defs>
        {expanded ? (
          <>
            {[0.25, 0.5, 0.75].map((f) => (
              <line
                key={f}
                x1={padX}
                x2={w - padX}
                y1={h - padY - f * (h - padY * 2)}
                y2={h - padY - f * (h - padY * 2)}
                stroke="currentColor"
                className="text-outline-variant/40"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            ))}
          </>
        ) : null}
        <path
          ref={areaRef}
          d={area}
          fill={`url(#tariffFill-${gradId})`}
          style={animate ? { opacity: 0 } : undefined}
        />
        <path
          ref={lineRef}
          d={line}
          fill="none"
          stroke="#FF7A00"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {expanded
          ? points.map((p) => (
              <circle
                key={p.date}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="#FF7A00"
                className="tariff-point-pop"
              />
            ))
          : null}
      </svg>
      <div className="mt-1 flex shrink-0 justify-between text-[10px] text-on-surface-variant sm:text-xs">
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
    <div className={expanded ? "h-full min-h-0" : undefined}>
      <ShipmentHeatMap
        regions={analytics.regions}
        topCity={analytics.topCity}
        expanded={expanded}
        mapInstanceKey={mapInstanceKey}
      />
    </div>
  );
}

function OrdersPanel({
  shipments,
  loading,
}: {
  shipments: Shipment[];
  loading: boolean;
}) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const isEmployee = user?.account_role === "employee";
  // Backend caps recent rows at 500; table shows them all (virtual scroll later if needed).
  const visible = shipments.slice(0, 500);
  return (
    <div className="h-full min-h-0 overflow-auto">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead className="bg-primary text-left text-xs uppercase tracking-wide text-on-primary">
          <tr>
            <th
              className="sticky top-0 z-10 bg-primary px-2 py-3 text-center"
              data-tour="delivered"
            >
              {t("deliveredCol")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("shipmentCode")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("scannerName")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("senderDetails")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("receiverDetails")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={5}>
              {t("deliveryAddress")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("itemsTitle")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3" colSpan={2}>
              {t("idDocTitle")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("oil")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("estimateWeightCol")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("weight")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("tariff")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("loggedTime")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("lastEdited")}
            </th>
            <th className="sticky top-0 z-10 bg-primary px-3 py-3">
              {t("editCount")}
            </th>
          </tr>
          <tr className="bg-slate-800 text-[10px] normal-case text-slate-200">
            <th className="sticky top-10 z-10 min-w-[3.5rem] bg-slate-800 px-2 py-2" />
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2" />
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">
              {t("name")}
            </th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">
              {t("phone")}
            </th>
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">
              {t("name")}
            </th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">
              {t("phone")}
            </th>
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2">
              {t("locCountry")}
            </th>
            <th className="sticky top-10 z-10 min-w-[9rem] bg-slate-800 px-3 py-2">
              {t("locRegion")}
            </th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">
              {t("locCity")}
            </th>
            <th className="sticky top-10 z-10 min-w-[6rem] bg-slate-800 px-3 py-2">
              {t("locPostal")}
            </th>
            <th className="sticky top-10 z-10 min-w-[16rem] bg-slate-800 px-3 py-2">
              {t("address")}
            </th>
            <th className="sticky top-10 z-10 min-w-[14rem] bg-slate-800 px-3 py-2">
              {t("itemsTitle")}
            </th>
            <th className="sticky top-10 z-10 min-w-[5rem] bg-slate-800 px-3 py-2">
              {t("idCin")} / {t("idPassport")}
            </th>
            <th className="sticky top-10 z-10 min-w-[8rem] bg-slate-800 px-3 py-2">
              N°
            </th>
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
              <td
                colSpan={22}
                className="px-4 py-10 text-center text-on-surface-variant"
              >
                {loading ? t("loading") : t("noShipments")}
              </td>
            </tr>
          ) : (
            visible.map((shipment) => {
              const editByField = Object.fromEntries(
                (shipment.fieldEdits ?? []).map((e) => [e.field, e]),
              );
              const canEdit =
                !isEmployee ||
                (user?.id != null && shipment.scannerId === user.id);
              const isDelivered = Boolean(shipment.delivered);
              return (
                <tr
                  key={shipment.id}
                  className={`align-top ${
                    isDelivered
                      ? "bg-emerald-200/55 hover:bg-emerald-200/70 [&_td]:bg-emerald-200/55"
                      : "hover:bg-surface-container-low/60"
                  }`}
                >
                  <DeliveredCell
                    shipmentId={shipment.id}
                    delivered={isDelivered}
                    deliveredAt={shipment.deliveredAt}
                    deliveredByName={shipment.deliveredByName}
                    edit={editByField.delivered}
                    readOnly={!canEdit}
                  />
                  <StaticCopyCell
                    value={shipment.publicCode || "—"}
                    className="whitespace-nowrap font-mono text-xs font-bold text-primary"
                  />
                  <StaticCopyCell
                    value={
                      shipment.scannerName ||
                      (shipment.scannerId != null
                        ? `#${shipment.scannerId}`
                        : "—")
                    }
                    className="whitespace-nowrap text-on-surface-variant"
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="senderName"
                    value={shipment.senderName}
                    edit={editByField.senderName}
                    className="font-medium"
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="senderPhone"
                    value={shipment.senderPhone}
                    edit={editByField.senderPhone}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="receiverName"
                    value={shipment.receiverName}
                    edit={editByField.receiverName}
                    className="font-medium"
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="receiverPhone"
                    value={shipment.receiverPhone}
                    edit={editByField.receiverPhone}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="country"
                    value={shipment.country || ""}
                    edit={editByField.country}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="regionName"
                    value={shipment.regionName || ""}
                    edit={editByField.regionName}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="city"
                    value={shipment.city || ""}
                    edit={editByField.city}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="postalCode"
                    value={shipment.postalCode || ""}
                    edit={editByField.postalCode}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="address"
                    value={shipment.address}
                    edit={editByField.address}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="items"
                    value={(shipment.items || "").replace(/,/g, ", ")}
                    edit={editByField.items}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="idDocType"
                    value={shipment.idDocType || ""}
                    edit={editByField.idDocType}
                    className="uppercase"
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="idDocNumber"
                    value={shipment.idDocNumber || ""}
                    edit={editByField.idDocNumber}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="oilLiters"
                    value={shipment.oilLiters}
                    edit={editByField.oilLiters}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="estimateWeightKg"
                    value={shipment.estimateWeightKg ?? 0}
                    edit={editByField.estimateWeightKg}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="weightKg"
                    value={shipment.weightKg}
                    edit={editByField.weightKg}
                    readOnly={!canEdit}
                  />
                  <EditableCell
                    shipmentId={shipment.id}
                    field="tariffAmount"
                    value={shipment.tariffAmount}
                    edit={editByField.tariffAmount}
                    readOnly={!canEdit}
                  />
                  <StaticCopyCell
                    value={formatLocalDateTime(shipment.timestamp, locale)}
                    className="whitespace-nowrap text-on-surface-variant"
                  />
                  <StaticCopyCell
                    value={
                      shipment.lastEditedAt
                        ? formatLocalDateTime(shipment.lastEditedAt, locale)
                        : t("never")
                    }
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
  const { startTour } = useDashboardTour();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState<StatPanel | null>(null);
  const { data, loading, error } = useQuery<ShipmentsQueryResult>(
    SHIPMENTS_QUERY,
    {
      pollInterval: POLL_INTERVAL_MS,
    },
  );
  const { data: statsData } = useQuery<{ dashboardStats: DashboardAnalytics }>(
    DASHBOARD_STATS_QUERY,
    {
      pollInterval: STATS_POLL_INTERVAL_MS,
      fetchPolicy: "cache-and-network",
    },
  );

  const shipments = data?.shipments ?? [];
  const fullStats = statsData?.dashboardStats ?? null;
  const weightFilter = usePanelFilter(shipments, fullStats);
  const placesFilter = usePanelFilter(shipments, fullStats);
  const tariffFilter = usePanelFilter(shipments, fullStats);
  const mapFilter = usePanelFilter(shipments, fullStats);
  const ordersFilter = useOrdersFilter(shipments, fullStats);
  const showSkeleton = usePageSkeleton(!loading || Boolean(data), 500);

  const weightGoal = Math.max(
    1000,
    Math.ceil(weightFilter.analytics.totalWeight / 500) * 500 || 1000,
  );
  const weightPct = Math.min(
    100,
    Math.round((weightFilter.analytics.totalWeight / weightGoal) * 100),
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

  const panelTitle = (id: StatPanel) =>
    t(PANEL_ITEMS.find((p) => p.id === id)!.label);

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
            <p className="text-sm font-semibold text-on-surface">
              {t("dashDrawerHint")}
            </p>
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
                <ExpandIcon
                  expanded={expanded === item.id}
                  className="h-3.5 w-3.5"
                />
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
              <p className="text-sm text-on-surface-variant">
                {t("dashboardSubtitle")}
              </p>
              {user ? (
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {user.name || user.email}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="nav" />
            <button
              type="button"
              data-tour="guide"
              onClick={() => startTour()}
              className="app-btn-ghost inline-flex items-center gap-1 text-xs"
              title={t("tourGuide")}
              aria-label={t("tourGuide")}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden
              >
                help
              </span>
              {t("tourGuide")}
            </button>
            <Link to="/profile" className="app-btn-ghost text-xs">
              {t("profileTitle")}
            </Link>
            {user?.account_role !== "employee" ? (
              <Link to="/billing" className="app-btn-ghost text-xs">
                {t("billingManage")}
              </Link>
            ) : null}
            <Link to="/" className="app-btn-ghost text-xs">
              {t("backToHome")}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="app-btn-ghost text-xs"
            >
              {t("logout")}
            </button>
            <button
              type="button"
              data-tour="add-shipment"
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
          {user?.account_role === "employer" ? <TeamPanel /> : null}
          {user?.account_role === "employee" && user.employer_name ? (
            <p className="rounded-xl border border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              {t("workerEmployerBanner").replace("{name}", user.employer_name)}
            </p>
          ) : null}
          {/* 1. Shipments table — full width */}
          <section className="app-card overflow-hidden" data-tour="orders">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3">
              <h2 className="text-sm font-bold text-on-surface">
                {t("dashOrdersTitle")}
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-xs text-on-surface-variant">
                  {t("autoRefresh")}
                </p>
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
                scanners={ordersFilter.scanners}
                contactFilters
                matchCount={ordersFilter.matchCount}
              />
            </div>
            <div className="max-h-[28rem]">
              <OrdersPanel
                shipments={ordersFilter.filtered}
                loading={loading || ordersFilter.filterLoading}
              />
            </div>
          </section>

          {/* 2. Map + most frequent places */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <section
              className="app-card relative overflow-hidden p-0"
              data-tour="map"
            >
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">
                    {t("dashMapTitle")}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {t("dashMapSupport")}
                  </p>
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
                  scanners={mapFilter.scanners}
                />
              </div>
              {expanded !== null ? (
                <div className="flex h-72 items-center justify-center bg-surface-container-low text-sm text-on-surface-variant sm:h-80">
                  {expanded === "map"
                    ? t("dashMapFullscreenHint")
                    : t("dashMapPausedHint")}
                </div>
              ) : (
                <MapPanel
                  analytics={mapFilter.analytics}
                  mapInstanceKey="card"
                />
              )}
            </section>

            <section className="app-card p-5" data-tour="places">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">
                  {t("dashPlacesTitle")}
                </h2>
                <div className="flex items-center gap-1.5">
                  <Icon
                    name="location_on"
                    className="text-[18px] text-tertiary"
                  />
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
                scanners={placesFilter.scanners}
                compact
              />
              <PlacesPanel analytics={placesFilter.analytics} />
            </section>
          </div>

          {/* 3. Today + next day notes */}
          <DayNotesPreview />

          {/* 4. Tariff + weight */}
          <div className="grid gap-5 md:grid-cols-2">
            <section className="app-card p-5" data-tour="tariff">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">
                  {t("dashTariffTitle")}
                </h2>
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
                scanners={tariffFilter.scanners}
                compact
              />
              <TariffPanel analytics={tariffFilter.analytics} />
            </section>

            <section className="app-card p-5" data-tour="weight">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-on-surface">
                  {t("dashWeightTitle")}
                </h2>
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
                scanners={weightFilter.scanners}
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
      <CsvExportFab shipments={shipments} fullStats={fullStats} />

      {/* Fullscreen expanded statistic */}
      {expanded && (
        <div className="fixed inset-0 z-[5000] flex bg-primary/50 backdrop-blur-sm">
          <div className="stat-expand-overlay flex h-full w-full flex-col overflow-hidden bg-surface-container-lowest shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3 sm:px-6">
              <h2 className="text-lg font-extrabold text-on-surface">
                {panelTitle(expanded)}
              </h2>
              <ExpandButton
                expanded
                onClick={() => setExpanded(null)}
                label={t("dashCollapse")}
              />
            </div>
            <div
              className={`min-h-0 flex-1 ${
                expanded === "orders"
                  ? "overflow-hidden p-0"
                  : expanded === "tariff" ||
                      expanded === "map" ||
                      expanded === "weight" ||
                      expanded === "places"
                    ? "flex flex-col overflow-hidden p-4 sm:p-6"
                    : "overflow-auto p-4 sm:p-6"
              }`}
            >
              {expanded === "weight" && (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <StatsFilterBar
                    filter={weightFilter.filter}
                    onChange={weightFilter.setFilter}
                    countries={weightFilter.countries}
                    cities={weightFilter.cities}
                    scanners={weightFilter.scanners}
                  />
                  <div className="min-h-0 flex-1">
                    <WeightPanel
                      analytics={weightFilter.analytics}
                      weightPct={weightPct}
                      weightGoal={weightGoal}
                      shipments={weightFilter.filtered}
                      expanded
                    />
                  </div>
                </div>
              )}
              {expanded === "places" && (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <StatsFilterBar
                    filter={placesFilter.filter}
                    onChange={placesFilter.setFilter}
                    countries={placesFilter.countries}
                    cities={placesFilter.cities}
                    scanners={placesFilter.scanners}
                  />
                  <div className="min-h-0 flex-1">
                    <PlacesPanel analytics={placesFilter.analytics} expanded />
                  </div>
                </div>
              )}
              {expanded === "tariff" && (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <StatsFilterBar
                    filter={tariffFilter.filter}
                    onChange={tariffFilter.setFilter}
                    countries={tariffFilter.countries}
                    cities={tariffFilter.cities}
                    scanners={tariffFilter.scanners}
                  />
                  <div className="min-h-0 flex-1">
                    <TariffPanel analytics={tariffFilter.analytics} expanded />
                  </div>
                </div>
              )}
              {expanded === "map" && (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                  <StatsFilterBar
                    filter={mapFilter.filter}
                    onChange={mapFilter.setFilter}
                    countries={mapFilter.countries}
                    cities={mapFilter.cities}
                    scanners={mapFilter.scanners}
                  />
                  <div className="min-h-0 flex-1 overflow-hidden">
                    <MapPanel
                      analytics={mapFilter.analytics}
                      expanded
                      mapInstanceKey="fullscreen"
                    />
                  </div>
                </div>
              )}
              {expanded === "orders" && (
                <div className="flex h-full flex-col p-2 sm:p-4">
                  <StatsFilterBar
                    filter={ordersFilter.filter}
                    onChange={ordersFilter.setFilter}
                    countries={ordersFilter.countries}
                    cities={ordersFilter.cities}
                    scanners={ordersFilter.scanners}
                    contactFilters
                    matchCount={ordersFilter.matchCount}
                  />
                  <div className="min-h-0 flex-1">
                    <OrdersPanel
                      shipments={ordersFilter.filtered}
                      loading={loading || ordersFilter.filterLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddShipmentModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
