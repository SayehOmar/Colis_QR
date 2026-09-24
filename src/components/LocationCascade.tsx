import { useMemo } from "react";
import {
  COUNTRY_OPTIONS,
  type CountryCode,
  getCities,
  getRegionLabelKey,
  getRegions,
  primaryPostalCode,
} from "../data/locations";
import { useLanguage } from "../i18n/LanguageContext";

export interface LocationSelection {
  country: CountryCode | "";
  regionId: string;
  regionName: string;
  city: string;
  postalCode: string;
}

interface LocationCascadeProps {
  value: LocationSelection;
  onChange: (next: LocationSelection) => void;
  /** When false, postal code field is hidden (calendar notes). */
  showPostal?: boolean;
  required?: boolean;
  compact?: boolean;
  idPrefix?: string;
}

export function emptyLocationSelection(): LocationSelection {
  return {
    country: "",
    regionId: "",
    regionName: "",
    city: "",
    postalCode: "",
  };
}

export function LocationCascade({
  value,
  onChange,
  showPostal = true,
  required = false,
  compact = false,
  idPrefix = "loc",
}: LocationCascadeProps) {
  const { t } = useLanguage();
  const country = value.country;
  const regions = useMemo(() => getRegions(country), [country]);
  const cities = useMemo(
    () => getCities(country, value.regionId),
    [country, value.regionId]
  );
  const regionLabelKey = getRegionLabelKey(country);
  const selectedCity = cities.find((city) => city.name === value.city);
  const postalHint = selectedCity?.postalCode ?? "";

  const regionEnabled = Boolean(country);
  const cityEnabled = Boolean(value.regionId);
  const postalEnabled = Boolean(value.city);

  const setCountry = (code: string) => {
    onChange({
      country: code as CountryCode | "",
      regionId: "",
      regionName: "",
      city: "",
      postalCode: "",
    });
  };

  const setRegion = (regionId: string) => {
    const region = regions.find((entry) => entry.id === regionId);
    onChange({
      ...value,
      regionId,
      regionName: region?.name ?? "",
      city: "",
      postalCode: "",
    });
  };

  const setCity = (cityName: string) => {
    const city = cities.find((entry) => entry.name === cityName);
    onChange({
      ...value,
      city: cityName,
      postalCode: city ? primaryPostalCode(city.postalCode) : "",
    });
  };

  const gridClass = compact
    ? "grid gap-2"
    : showPostal
      ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      : "grid gap-3 sm:grid-cols-3";

  return (
    <div className={gridClass}>
      <label className="app-label text-xs">
        {t("locCountry")}
        <select
          id={`${idPrefix}-country`}
          required={required}
          value={value.country}
          onChange={(e) => setCountry(e.target.value)}
          className="app-input"
        >
          <option value="">{t("locSelectCountry")}</option>
          {COUNTRY_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {t(option.nameKey)}
            </option>
          ))}
        </select>
      </label>

      <label className="app-label text-xs">
        {t(regionLabelKey)}
        <select
          id={`${idPrefix}-region`}
          required={required}
          disabled={!regionEnabled}
          value={value.regionId}
          onChange={(e) => setRegion(e.target.value)}
          className="app-input disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {regionEnabled ? t("locSelectRegion") : t("locSelectCountryFirst")}
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </label>

      <label className="app-label text-xs">
        {t("locCity")}
        <select
          id={`${idPrefix}-city`}
          required={required}
          disabled={!cityEnabled}
          value={value.city}
          onChange={(e) => setCity(e.target.value)}
          className="app-input disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {cityEnabled ? t("locSelectCity") : t("locSelectRegionFirst")}
          </option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </label>

      {showPostal ? (
        <label className="app-label text-xs">
          {t("locPostal")}
          <input
            id={`${idPrefix}-postal`}
            required={required}
            disabled={!postalEnabled}
            value={value.postalCode}
            onChange={(e) =>
              onChange({ ...value, postalCode: e.target.value })
            }
            className="app-input disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={postalEnabled ? postalHint : t("locSelectCityFirst")}
          />
        </label>
      ) : null}
    </div>
  );
}

/** Resolve regionId from stored region name when loading from DB. */
export function locationFromStored(fields: {
  country?: string;
  regionName?: string;
  city?: string;
  postalCode?: string;
}): LocationSelection {
  const country = (fields.country ?? "") as CountryCode | "";
  const regionName = fields.regionName ?? "";
  const regions = country ? getRegions(country) : [];
  const region =
    regions.find((r) => r.name === regionName || r.id === regionName) ?? null;
  return {
    country: COUNTRY_OPTIONS.some((o) => o.code === country) ? country : "",
    regionId: region?.id ?? "",
    regionName: region?.name ?? regionName,
    city: fields.city ?? "",
    postalCode: fields.postalCode ?? "",
  };
}
