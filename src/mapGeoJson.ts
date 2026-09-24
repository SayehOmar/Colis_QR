/**
 * Load country GeoJSON admin boundaries from /maps/*.json and cache them in
 * IndexedDB on the user's PC so large files are not re-fetched every visit.
 */

export type MapCountryCode = "FR" | "DE" | "IT" | "ES" | "TN" | "DZ" | "MA";

export const MAP_COUNTRY_OPTIONS: {
  code: MapCountryCode;
  labelKey:
    | "countryFrance"
    | "countryGermany"
    | "countryItaly"
    | "countrySpain"
    | "countryTunisia"
    | "countryAlgeria"
    | "countryMorocco";
}[] = [
  { code: "FR", labelKey: "countryFrance" },
  { code: "DE", labelKey: "countryGermany" },
  { code: "IT", labelKey: "countryItaly" },
  { code: "ES", labelKey: "countrySpain" },
  { code: "TN", labelKey: "countryTunisia" },
  { code: "DZ", labelKey: "countryAlgeria" },
  { code: "MA", labelKey: "countryMorocco" },
];

export interface MapFeatureProperties {
  source?: string;
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export type MapFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  MapFeatureProperties
>;

const DB_NAME = "crossmed-geojson-maps";
const DB_VERSION = 1;
const STORE = "collections";
/** Bump when GeoJSON files under public/maps change. */
const CACHE_REVISION = "v1";

const FILE_BY_CODE: Record<MapCountryCode, string> = {
  FR: "/maps/fr.json",
  DE: "/maps/de.json",
  IT: "/maps/it.json",
  ES: "/maps/es.json",
  TN: "/maps/tn.json",
  DZ: "/maps/dz.json",
  MA: "/maps/ma.json",
};

const memoryCache = new Map<MapCountryCode, MapFeatureCollection>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function idbGet(key: string): Promise<MapFeatureCollection | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as MapFeatureCollection | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: MapFeatureCollection): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Quota / private mode — memory cache still works for the session
  }
}

export function resolveMapCountryCode(country: string): MapCountryCode | null {
  const raw = country.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const compact = upper.normalize("NFD").replace(/\p{Diacritic}/gu, "");

  if (upper === "FR" || compact.includes("FRANCE")) return "FR";
  if (
    upper === "DE" ||
    compact.includes("GERMANY") ||
    compact.includes("ALLEMAGNE") ||
    compact.includes("DEUTSCHLAND")
  )
    return "DE";
  if (
    upper === "IT" ||
    compact.includes("ITALY") ||
    compact.includes("ITALIE") ||
    compact.includes("ITALIA")
  )
    return "IT";
  if (
    upper === "ES" ||
    compact.includes("SPAIN") ||
    compact.includes("ESPAGNE") ||
    compact.includes("ESPANA")
  )
    return "ES";
  if (upper === "TN" || compact.includes("TUNIS")) return "TN";
  if (upper === "DZ" || compact.includes("ALGER")) return "DZ";
  if (upper === "MA" || compact.includes("MOROCCO") || compact.includes("MAROC")) return "MA";
  return null;
}

/** Strip accents, punctuation, and trailing department codes like "(75)". */
export function normalizeAdminName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s*\(\s*\d{1,3}\s*\)\s*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Extract "75" from "Paris (75)" or raw department codes. */
export function extractAdminCode(value: string): string | null {
  const paren = value.match(/\((\d{1,3}[A-Za-z]?)\)\s*$/);
  if (paren?.[1]) return paren[1].toUpperCase().padStart(2, "0");
  const only = value.trim();
  if (/^\d{1,3}[A-Za-z]?$/.test(only)) return only.toUpperCase().padStart(2, "0");
  return null;
}

export async function loadCountryGeoJson(
  code: MapCountryCode
): Promise<MapFeatureCollection> {
  const cachedMem = memoryCache.get(code);
  if (cachedMem) return cachedMem;

  const cacheKey = `${CACHE_REVISION}:${code}`;
  const fromDisk = await idbGet(cacheKey);
  if (fromDisk?.features?.length) {
    memoryCache.set(code, fromDisk);
    return fromDisk;
  }

  const url = FILE_BY_CODE[code];
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download map ${code} (${response.status})`);
  }
  const data = (await response.json()) as MapFeatureCollection;
  if (!data?.features?.length) {
    throw new Error(`Map ${code} has no features`);
  }

  memoryCache.set(code, data);
  void idbSet(cacheKey, data);
  return data;
}

export interface RegionMatchInput {
  name: string;
  country: string;
  count: number;
  share: number;
}

/**
 * Find the shipment region that matches a GeoJSON admin feature.
 */
export function matchFeatureCount(
  feature: GeoJSON.Feature<GeoJSON.Geometry, MapFeatureProperties>,
  countryCode: MapCountryCode,
  regionStats: RegionMatchInput[]
): RegionMatchInput | null {
  const props = feature.properties ?? {};
  const featureName = String(props.name ?? "");
  const featureId = String(props.id ?? "").toUpperCase();
  const featureNorm = normalizeAdminName(featureName);

  let best: RegionMatchInput | null = null;

  for (const region of regionStats) {
    if (resolveMapCountryCode(region.country) !== countryCode) continue;

    const regionNorm = normalizeAdminName(region.name);
    const code = extractAdminCode(region.name);

    const nameHit =
      Boolean(regionNorm) &&
      Boolean(featureNorm) &&
      (regionNorm === featureNorm ||
        featureNorm.includes(regionNorm) ||
        regionNorm.includes(featureNorm));

    const idHit =
      Boolean(code) &&
      (featureId === `${countryCode}${code}` ||
        featureId.endsWith(code!) ||
        featureId === code);

    if (nameHit || idHit) {
      if (!best || region.count > best.count) best = region;
    }
  }

  return best;
}
