import franceRaw from "./france.json";
import germanyRaw from "./germany.json";
import italyRaw from "./italy.json";
import spainRaw from "./spain.json";
import tunisiaRaw from "./tunisia.json";
import algeriaRaw from "./algeria.json";
import moroccoRaw from "./morocco.json";

export type CountryCode = "FR" | "DE" | "IT" | "ES" | "TN" | "DZ" | "MA";

export interface LocationCity {
  name: string;
  /** Raw value from dataset (may be a single code or a range like 70173-70599). */
  postalCode: string;
}

export interface LocationRegion {
  id: string;
  name: string;
  code?: string;
  cities: LocationCity[];
}

export interface CountryLocationConfig {
  code: CountryCode;
  /** i18n key for the mid-level admin unit (department / state / region). */
  regionLabelKey:
    | "locDepartment"
    | "locState"
    | "locRegion"
    | "locCommunity"
    | "locGovernorate"
    | "locWilaya";
  cityLabelKey: "locCity";
  regions: LocationRegion[];
}

type FranceDept = {
  department: string;
  department_code: string;
  cities: { city: string; postal_code: string }[];
};

type StateBundle = {
  state: string;
  cities: { name: string; postal_code: string }[];
};

function normalizeStateBundle(entries: StateBundle[]): LocationRegion[] {
  return entries.map((entry) => ({
    id: entry.state,
    name: entry.state,
    cities: entry.cities.map((city) => ({
      name: city.name,
      postalCode: city.postal_code,
    })),
  }));
}

const franceRegions: LocationRegion[] = (franceRaw as FranceDept[]).map((dept) => ({
  id: dept.department_code,
  name: `${dept.department} (${dept.department_code})`,
  code: dept.department_code,
  cities: dept.cities.map((city) => ({
    name: city.city,
    postalCode: city.postal_code,
  })),
}));

export const LOCATION_COUNTRIES: Record<CountryCode, CountryLocationConfig> = {
  FR: {
    code: "FR",
    regionLabelKey: "locDepartment",
    cityLabelKey: "locCity",
    regions: franceRegions,
  },
  DE: {
    code: "DE",
    regionLabelKey: "locState",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((germanyRaw as { germany: StateBundle[] }).germany),
  },
  IT: {
    code: "IT",
    regionLabelKey: "locRegion",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((italyRaw as { italy: StateBundle[] }).italy),
  },
  ES: {
    code: "ES",
    regionLabelKey: "locCommunity",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((spainRaw as { spain: StateBundle[] }).spain),
  },
  TN: {
    code: "TN",
    regionLabelKey: "locGovernorate",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((tunisiaRaw as { tunisia: StateBundle[] }).tunisia),
  },
  DZ: {
    code: "DZ",
    regionLabelKey: "locWilaya",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((algeriaRaw as { algeria: StateBundle[] }).algeria),
  },
  MA: {
    code: "MA",
    regionLabelKey: "locRegion",
    cityLabelKey: "locCity",
    regions: normalizeStateBundle((moroccoRaw as { morocco: StateBundle[] }).morocco),
  },
};

export const COUNTRY_OPTIONS: {
  code: CountryCode;
  nameKey:
    | "countryFrance"
    | "countryGermany"
    | "countryItaly"
    | "countrySpain"
    | "countryTunisia"
    | "countryAlgeria"
    | "countryMorocco";
}[] = [
  { code: "FR", nameKey: "countryFrance" },
  { code: "DE", nameKey: "countryGermany" },
  { code: "IT", nameKey: "countryItaly" },
  { code: "ES", nameKey: "countrySpain" },
  { code: "TN", nameKey: "countryTunisia" },
  { code: "DZ", nameKey: "countryAlgeria" },
  { code: "MA", nameKey: "countryMorocco" },
];

/** Prefer a concrete code when dataset stores a range. */
export function primaryPostalCode(postalCode: string): string {
  const trimmed = postalCode.trim();
  if (!trimmed) return "";
  if (trimmed.includes("-")) {
    return trimmed.split("-")[0]!.trim();
  }
  return trimmed;
}

export function getRegions(country: CountryCode | ""): LocationRegion[] {
  if (!country) return [];
  return LOCATION_COUNTRIES[country]?.regions ?? [];
}

export function getCities(
  country: CountryCode | "",
  regionId: string
): LocationCity[] {
  if (!country || !regionId) return [];
  return (
    LOCATION_COUNTRIES[country]?.regions.find((region) => region.id === regionId)
      ?.cities ?? []
  );
}

export function getRegionLabelKey(
  country: CountryCode | ""
): CountryLocationConfig["regionLabelKey"] {
  if (!country) return "locDepartment";
  return LOCATION_COUNTRIES[country]?.regionLabelKey ?? "locDepartment";
}

/** Map stored DB values (codes or common names) to a known country code. */
export function resolveCountryCode(raw: string | null | undefined): CountryCode | "" {
  const value = (raw ?? "").trim();
  if (!value) return "";
  const upper = value.toUpperCase();
  if ((Object.keys(LOCATION_COUNTRIES) as CountryCode[]).includes(upper as CountryCode)) {
    return upper as CountryCode;
  }
  const aliases: Record<string, CountryCode> = {
    france: "FR",
    germany: "DE",
    deutschland: "DE",
    italy: "IT",
    italie: "IT",
    italia: "IT",
    spain: "ES",
    espagne: "ES",
    espana: "ES",
    españa: "ES",
    tunisia: "TN",
    tunisie: "TN",
    algeria: "DZ",
    algérie: "DZ",
    algerie: "DZ",
    morocco: "MA",
    maroc: "MA",
  };
  return aliases[value.toLowerCase()] ?? "";
}
