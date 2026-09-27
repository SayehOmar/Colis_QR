import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON as LeafletGeoJSON, MapContainer, useMap } from "react-leaflet";
import type { CityStat, RegionStat } from "../dashboardAnalytics";
import { frequencyHeatColor } from "../dashboardAnalytics";
import { useLanguage } from "../i18n/LanguageContext";
import {
  loadCountryGeoJson,
  MAP_COUNTRY_OPTIONS,
  matchFeatureCount,
  resolveMapCountryCode,
  type MapCountryCode,
  type MapFeatureCollection,
  type MapFeatureProperties,
} from "../mapGeoJson";
import "leaflet/dist/leaflet.css";

function FocusHotspotMap({
  data,
  countryCode,
  focusLabel,
}: {
  data: MapFeatureCollection;
  countryCode: MapCountryCode;
  /** Region or city name to zoom into (most frequent). */
  focusLabel: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    let cancelled = false;

    const focus = () => {
      if (cancelled) return;
      const el = map.getContainer();
      if (!el.clientWidth || !el.clientHeight) return;

      map.invalidateSize({ animate: false });

      const countryLayer = L.geoJSON(data as GeoJSON.GeoJsonObject);
      const countryBounds = countryLayer.getBounds();

      let targetBounds = countryBounds;
      let maxZoom = 11;

      if (focusLabel?.trim()) {
        const labelNorm = focusLabel
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const codeMatch = focusLabel.match(/\((\d{2,3}[A-Za-z]?)\)/);
        const adminCode = codeMatch?.[1]?.toUpperCase() ?? null;

        const matched = L.geoJSON(data as GeoJSON.GeoJsonObject, {
          filter: (feature) => {
            if (!feature?.properties) return false;
            const props = feature.properties as MapFeatureProperties;
            const name = String(props.name ?? "");
            const id = String(props.id ?? "").toUpperCase();
            const nameNorm = name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            const nameHit =
              Boolean(nameNorm) &&
              (nameNorm === labelNorm ||
                nameNorm.includes(labelNorm) ||
                labelNorm.includes(nameNorm));
            const idHit =
              Boolean(adminCode) &&
              (id === `${countryCode}${adminCode}` ||
                id.endsWith(adminCode!) ||
                id === adminCode);
            return nameHit || idHit;
          },
        });
        const hotBounds = matched.getBounds();
        matched.remove();
        if (hotBounds.isValid()) {
          targetBounds = hotBounds;
          maxZoom = 12;
        }
      }

      countryLayer.remove();
      if (!targetBounds.isValid()) return;

      map.fitBounds(targetBounds, {
        padding: [28, 28],
        maxZoom,
        animate: false,
      });
    };

    const t1 = window.setTimeout(focus, 0);
    const t2 = window.setTimeout(focus, 80);
    const t3 = window.setTimeout(focus, 250);
    window.addEventListener("resize", focus);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", focus);
    };
  }, [map, data, countryCode, focusLabel]);

  return null;
}

function CountryChoropleth({
  code,
  data,
  regions,
  maxCount,
}: {
  code: MapCountryCode;
  data: MapFeatureCollection;
  regions: RegionStat[];
  maxCount: number;
}) {
  const { t } = useLanguage();

  const styleFn = useMemo(() => {
    return (feature?: GeoJSON.Feature) => {
      const typed = feature as
        | GeoJSON.Feature<GeoJSON.Geometry, MapFeatureProperties>
        | undefined;
      const hit = typed ? matchFeatureCount(typed, code, regions) : null;
      const count = hit?.count ?? 0;
      return {
        color: count > 0 ? "#7F1D1D" : "#64748B",
        weight: count > 0 ? 1.4 : 0.7,
        fillColor: frequencyHeatColor(count, maxCount),
        fillOpacity: count > 0 ? 0.85 : 0.12,
      };
    };
  }, [code, regions, maxCount]);

  return (
    <LeafletGeoJSON
      key={`geo-${code}-${data.features.length}`}
      data={data as GeoJSON.GeoJsonObject}
      style={styleFn}
      onEachFeature={(feature, layer) => {
        const typed = feature as GeoJSON.Feature<
          GeoJSON.Geometry,
          MapFeatureProperties
        >;
        const name = String(typed.properties?.name ?? "—");
        const hit = matchFeatureCount(typed, code, regions);
        const count = hit?.count ?? 0;
        const share = hit ? Math.round(hit.share * 100) : 0;
        layer.bindPopup(
          `<div style="font-size:13px;line-height:1.35">
            <strong>${name}</strong><br/>
            <span style="color:#64748b">${code}</span><br/>
            <span style="color:#b91c1c;font-weight:600">${count} ${t("dashShipments")}${
              count > 0 ? ` · ${share}%` : ""
            }</span>
          </div>`
        );
      }}
    />
  );
}

function pickDefaultCountry(
  regions: RegionStat[],
  topCity: CityStat | null
): MapCountryCode {
  if (topCity) {
    const fromCity = resolveMapCountryCode(topCity.country);
    if (fromCity) return fromCity;
  }
  for (const region of regions) {
    const code = resolveMapCountryCode(region.country);
    if (code) return code;
  }
  return "FR";
}

export function ShipmentHeatMap({
  regions,
  topCity = null,
  expanded = false,
  mapInstanceKey = "map",
}: {
  regions: RegionStat[];
  topCity?: CityStat | null;
  expanded?: boolean;
  mapInstanceKey?: string;
}) {
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<MapCountryCode>(() =>
    pickDefaultCountry(regions, topCity)
  );
  /** Only render the map when this matches selectedCountry — prevents stale layers. */
  const [activeMap, setActiveMap] = useState<{
    code: MapCountryCode;
    data: MapFeatureCollection;
    epoch: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const epochRef = useRef(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const preferred = pickDefaultCountry(regions, topCity);
    setSelectedCountry((current) => {
      const currentHasData = regions.some(
        (r) => resolveMapCountryCode(r.country) === current
      );
      return currentHasData ? current : preferred;
    });
  }, [regions, topCity]);

  const filteredRegions = useMemo(
    () =>
      regions.filter((r) => resolveMapCountryCode(r.country) === selectedCountry),
    [regions, selectedCountry]
  );

  const maxCount = useMemo(
    () => Math.max(0, ...filteredRegions.map((r) => r.count), 0),
    [filteredRegions]
  );

  const topRegion = filteredRegions[0] ?? null;
  const focusCity =
    topCity && resolveMapCountryCode(topCity.country) === selectedCountry
      ? topCity
      : null;
  /** Prefer the admin unit of the most frequent city so the map aims there. */
  const focusLabel =
    focusCity?.regionName?.trim() ||
    focusCity?.name?.trim() ||
    topRegion?.name ||
    null;

  const countryLabelKey =
    MAP_COUNTRY_OPTIONS.find((o) => o.code === selectedCountry)?.labelKey ??
    "countryFrance";

  useEffect(() => {
    const requestCode = selectedCountry;
    const requestId = ++requestIdRef.current;
    epochRef.current += 1;
    const nextEpoch = epochRef.current;

    setActiveMap(null);
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const data = await loadCountryGeoJson(requestCode);
        // Ignore stale responses from a previous country click
        if (requestId !== requestIdRef.current) return;
        setActiveMap({ code: requestCode, data, epoch: nextEpoch });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : "Map load failed");
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    })();
  }, [selectedCountry]);

  const heightClass = expanded
    ? "h-[calc(100vh-7rem)] min-h-[480px]"
    : "h-72 sm:h-80";

  const mapReady =
    activeMap !== null &&
    activeMap.code === selectedCountry &&
    !loading;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest ${heightClass}`}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-outline-variant/40 bg-surface-container-lowest px-3 py-2">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
          {t("dashMapFilter")}
        </span>
        {MAP_COUNTRY_OPTIONS.map((option) => {
          const active = option.code === selectedCountry;
          const hasData = regions.some(
            (r) => resolveMapCountryCode(r.country) === option.code
          );
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                if (option.code !== selectedCountry) {
                  setSelectedCountry(option.code);
                }
              }}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                active
                  ? "border-primary bg-primary text-on-primary shadow-sm"
                  : "border-outline-variant/80 bg-surface-container-low text-on-surface hover:border-secondary"
              } ${hasData && !active ? "ring-1 ring-tertiary/35" : ""}`}
              title={t(option.labelKey)}
            >
              {option.code}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-surface-container">
        {mapReady && activeMap ? (
          <MapContainer
            key={`${mapInstanceKey}-${activeMap.code}-${activeMap.epoch}-${expanded ? "full" : "card"}`}
            center={[46.5, 2.5]}
            zoom={5}
            className="!absolute inset-0 h-full w-full"
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={expanded}
            attributionControl={false}
            zoomControl={false}
          >
            <FocusHotspotMap
              data={activeMap.data}
              countryCode={activeMap.code}
              focusLabel={focusLabel}
            />
            <CountryChoropleth
              code={activeMap.code}
              data={activeMap.data}
              regions={filteredRegions}
              maxCount={maxCount}
            />
          </MapContainer>
        ) : null}

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-container text-sm text-on-surface-variant">
            {t("loading")}
          </div>
        )}

        {error && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Legend in document flow — cannot clip outside the card */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-outline-variant/40 bg-surface-container-lowest px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
            {t(countryLabelKey)}
          </p>
          <p className="truncate text-xs font-semibold text-on-surface">
            {focusCity
              ? `${focusCity.name}${
                  focusCity.postalCode ? ` (${focusCity.postalCode})` : ""
                } · ${focusCity.count}`
              : topRegion
                ? `${topRegion.name} · ${topRegion.count}`
                : t("dashNoCities")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="h-2 w-12 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #E2E8F0 0%, #FECACA 40%, #B91C1C 100%)",
            }}
          />
          <span className="max-w-[7rem] text-[10px] leading-tight text-on-surface-variant">
            {t("dashHeatLegend")}
          </span>
        </div>
      </div>
    </div>
  );
}
