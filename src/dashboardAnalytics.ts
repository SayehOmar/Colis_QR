import type { Shipment } from "./types";

export interface CityStat {
  name: string;
  count: number;
  share: number;
  country: string;
  regionName: string;
  postalCode: string;
}

/** Admin unit (department / state / region) for choropleth map matching. */
export interface RegionStat {
  name: string;
  count: number;
  share: number;
  country: string;
}

export interface TariffPoint {
  date: string;
  total: number;
}

export interface DashboardAnalytics {
  shipmentCount: number;
  totalTariff: number;
  totalWeight: number;
  totalOil: number;
  totalEstimateWeight: number;
  avgTariff: number;
  avgWeight: number;
  avgEstimateWeight: number;
  cities: CityStat[];
  regions: RegionStat[];
  topCity: CityStat | null;
  tariffSeries: TariffPoint[];
}

export interface StatsFilter {
  dateFrom: string;
  dateTo: string;
  country: string;
  city: string;
}

export const EMPTY_STATS_FILTER: StatsFilter = {
  dateFrom: "",
  dateTo: "",
  country: "",
  city: "",
};

function shipmentDay(timestamp: string): string {
  const trimmed = timestamp.trim();
  if (!trimmed) return "";
  const isoLike = trimmed.replace(" UTC", "Z").replace(" ", "T");
  const d = new Date(isoLike);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
}

export function filterShipments(
  shipments: Shipment[],
  filter: StatsFilter
): Shipment[] {
  const country = filter.country.trim().toLowerCase();
  const city = filter.city.trim().toLowerCase();
  return shipments.filter((s) => {
    const day = shipmentDay(s.timestamp);
    if (filter.dateFrom && day && day < filter.dateFrom) return false;
    if (filter.dateTo && day && day > filter.dateTo) return false;
    if (country) {
      const place = resolveShipmentPlace(s);
      if (place.country.toLowerCase() !== country) return false;
    }
    if (city) {
      const place = resolveShipmentPlace(s);
      if (!place.city.toLowerCase().includes(city)) return false;
    }
    return true;
  });
}

export function uniqueCountries(shipments: Shipment[]): string[] {
  const set = new Set<string>();
  for (const s of shipments) {
    const c = resolveShipmentPlace(s).country;
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function uniqueCities(shipments: Shipment[], country?: string): string[] {
  const set = new Set<string>();
  const countryNorm = country?.trim().toLowerCase() ?? "";
  for (const s of shipments) {
    const place = resolveShipmentPlace(s);
    if (countryNorm && place.country.toLowerCase() !== countryNorm) continue;
    if (place.city && place.city.toLowerCase() !== "unknown") set.add(place.city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function normalizeCity(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Unknown";
  return trimmed
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Fallback when structured city was not stored (legacy rows). */
export function extractCityFromAddress(address: string): string {
  if (!address?.trim()) return "Unknown";
  const parts = address
    .split(/[,/|•\-–—]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 1) {
    const first = parts[0]!;
    const withoutPostal = first.replace(/^\d{4,5}\s+/, "").trim();
    if (withoutPostal) return normalizeCity(withoutPostal);
  }
  return "Unknown";
}

function extractRegionFromAddress(address: string): string {
  if (!address?.trim()) return "";
  const parts = address
    .split(/[,/|•\-–—]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  // "75001 Paris, Paris (75), France, street"
  if (parts.length >= 2) return parts[1]!;
  return "";
}

function cityKey(city: string, country: string, region: string): string {
  return `${city}|${country}|${region}`.toLowerCase();
}

export function resolveShipmentPlace(shipment: Shipment): {
  city: string;
  country: string;
  regionName: string;
  postalCode: string;
} {
  const city = shipment.city?.trim()
    ? normalizeCity(shipment.city)
    : extractCityFromAddress(shipment.address);
  const regionName =
    shipment.regionName?.trim() || extractRegionFromAddress(shipment.address);
  return {
    city,
    country: shipment.country?.trim() || "",
    regionName,
    postalCode: shipment.postalCode?.trim() || "",
  };
}

export function computeDashboardAnalytics(shipments: Shipment[]): DashboardAnalytics {
  const shipmentCount = shipments.length;
  const totalTariff = shipments.reduce((sum, s) => sum + (Number(s.tariffAmount) || 0), 0);
  const totalWeight = shipments.reduce((sum, s) => sum + (Number(s.weightKg) || 0), 0);
  const totalOil = shipments.reduce((sum, s) => sum + (Number(s.oilLiters) || 0), 0);
  const totalEstimateWeight = shipments.reduce(
    (sum, s) => sum + (Number(s.estimateWeightKg) || 0),
    0
  );

  const byDay = new Map<string, number>();
  for (const s of shipments) {
    const day = shipmentDay(s.timestamp) || "unknown";
    byDay.set(day, (byDay.get(day) ?? 0) + (Number(s.tariffAmount) || 0));
  }
  const tariffSeries = [...byDay.entries()]
    .filter(([date]) => date !== "unknown")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, total]) => ({ date, total }));

  const cityCounts = new Map<
    string,
    { name: string; count: number; country: string; regionName: string; postalCode: string }
  >();
  const regionCounts = new Map<string, { name: string; count: number; country: string }>();

  for (const shipment of shipments) {
    const place = resolveShipmentPlace(shipment);
    const cKey = cityKey(place.city, place.country, place.regionName);
    const existingCity = cityCounts.get(cKey);
    if (existingCity) {
      existingCity.count += 1;
    } else {
      cityCounts.set(cKey, {
        name: place.city,
        count: 1,
        country: place.country,
        regionName: place.regionName,
        postalCode: place.postalCode,
      });
    }

    const regionLabel = place.regionName || place.city;
    if (regionLabel && regionLabel.toLowerCase() !== "unknown") {
      const rKey = `${place.country}|${regionLabel}`.toLowerCase();
      const existingRegion = regionCounts.get(rKey);
      if (existingRegion) {
        existingRegion.count += 1;
      } else {
        regionCounts.set(rKey, {
          name: regionLabel,
          count: 1,
          country: place.country,
        });
      }
    }
  }

  const cities = [...cityCounts.values()]
    .map((entry) => ({
      name: entry.name,
      count: entry.count,
      share: shipmentCount > 0 ? entry.count / shipmentCount : 0,
      country: entry.country,
      regionName: entry.regionName,
      postalCode: entry.postalCode,
    }))
    .sort((a, b) => b.count - a.count);

  const regions = [...regionCounts.values()]
    .map((entry) => ({
      name: entry.name,
      count: entry.count,
      share: shipmentCount > 0 ? entry.count / shipmentCount : 0,
      country: entry.country,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    shipmentCount,
    totalTariff,
    totalWeight,
    totalOil,
    totalEstimateWeight,
    avgTariff: shipmentCount > 0 ? totalTariff / shipmentCount : 0,
    avgWeight: shipmentCount > 0 ? totalWeight / shipmentCount : 0,
    avgEstimateWeight: shipmentCount > 0 ? totalEstimateWeight / shipmentCount : 0,
    cities: cities.slice(0, 12),
    regions,
    topCity: cities[0] ?? null,
    tariffSeries,
  };
}

export function formatEuro(value: number): string {
  return `€${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatKg(value: number): string {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })} kg`;
}

export function formatLiters(value: number): string {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })} L`;
}

/** Heat color: low frequency = light peach, high = deep red (Power BI–style). */
export function frequencyHeatColor(count: number, maxCount: number): string {
  if (maxCount <= 0 || count <= 0) return "#E2E8F0";
  const t = Math.min(1, Math.max(0.08, count / maxCount));
  const r = Math.round(254 + (185 - 254) * t);
  const g = Math.round(226 + (28 - 226) * t);
  const b = Math.round(226 + (28 - 226) * t);
  return `rgb(${r},${g},${b})`;
}
