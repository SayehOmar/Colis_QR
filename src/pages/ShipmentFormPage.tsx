import { Turnstile } from "@marsidev/react-turnstile";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import {
  COUNTRY_OPTIONS,
  type CountryCode,
  getCities,
  getRegionLabelKey,
  getRegions,
  primaryPostalCode,
} from "../data/locations";
import { validateShipmentPartyFields } from "../formValidation";
import { useLanguage } from "../i18n/LanguageContext";
import { buildAddressLine, buildPayloadString, parsePayloadString } from "../payload";
import { generateShipmentPdf } from "../pdf";
import { generateShipmentCode } from "../shipmentCode";
import {
  cacheCustomShipmentItem,
  loadAllShipmentItems,
} from "../shipmentItems";
import type { TranslationKey } from "../i18n/translations";
import type { ShipmentFormData } from "../types";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const TURNSTILE_ENABLED =
  (import.meta.env.VITE_TURNSTILE_ENABLED ?? "false").toLowerCase() === "true";

const initialForm: ShipmentFormData = {
  senderName: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  streetAddress: "",
  country: "",
  regionId: "",
  regionName: "",
  city: "",
  postalCode: "",
  address: "",
  oilLiters: "0",
  estimateWeightKg: "",
  publicCode: "",
  items: [],
  idDocType: "cin",
  idDocNumber: "",
};

function validateIdDoc(
  type: "passport" | "cin",
  value: string
): TranslationKey | null {
  const trimmed = value.trim();
  if (!trimmed) return "idDocRequired";
  if (type === "cin") {
    if (!/^\d{8}$/.test(trimmed)) return "idCinInvalid";
  } else if (!/^[A-Za-z0-9]{6,12}$/.test(trimmed)) {
    return "idPassportInvalid";
  }
  return null;
}

export default function ShipmentFormPage() {
  const { t } = useLanguage();
  const showSkeleton = usePageSkeleton(true, 400);
  const [form, setForm] = useState<ShipmentFormData>(initialForm);
  const [itemCatalog, setItemCatalog] = useState(() => loadAllShipmentItems());
  const [customItem, setCustomItem] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const country = form.country as CountryCode | "";
  const regions = useMemo(() => getRegions(country), [country]);
  const cities = useMemo(
    () => getCities(country, form.regionId),
    [country, form.regionId]
  );
  const regionLabelKey = getRegionLabelKey(country);
  const selectedCity = cities.find((city) => city.name === form.city);
  const postalHint = selectedCity?.postalCode ?? "";

  useEffect(() => {
    const countryLabel = form.country
      ? t(
          COUNTRY_OPTIONS.find((option) => option.code === form.country)?.nameKey ??
            "countryFrance"
        )
      : "";
    const address = buildAddressLine({
      streetAddress: form.streetAddress,
      city: form.city,
      postalCode: form.postalCode,
      regionName: form.regionName,
      country: countryLabel,
    });
    setForm((current) =>
      current.address === address ? current : { ...current, address }
    );
  }, [
    form.streetAddress,
    form.city,
    form.postalCode,
    form.regionName,
    form.country,
    t,
  ]);

  const setCountry = (code: string) => {
    setForm((current) => ({
      ...current,
      country: code,
      regionId: "",
      regionName: "",
      city: "",
      postalCode: "",
    }));
  };

  const setRegion = (regionId: string) => {
    const region = regions.find((entry) => entry.id === regionId);
    setForm((current) => ({
      ...current,
      regionId,
      regionName: region?.name ?? "",
      city: "",
      postalCode: "",
    }));
  };

  const setCity = (cityName: string) => {
    const city = cities.find((entry) => entry.name === cityName);
    setForm((current) => ({
      ...current,
      city: cityName,
      postalCode: city ? primaryPostalCode(city.postalCode) : "",
    }));
  };

  const toggleItem = (item: string) => {
    setForm((current) => {
      const exists = current.items.some(
        (entry) => entry.toLowerCase() === item.toLowerCase()
      );
      return {
        ...current,
        items: exists
          ? current.items.filter((entry) => entry.toLowerCase() !== item.toLowerCase())
          : [...current.items, item],
      };
    });
  };

  const addCustomItem = () => {
    const saved = cacheCustomShipmentItem(customItem);
    if (!saved) return;
    setItemCatalog(loadAllShipmentItems());
    setForm((current) => {
      const exists = current.items.some(
        (entry) => entry.toLowerCase() === saved.toLowerCase()
      );
      return exists ? current : { ...current, items: [...current.items, saved] };
    });
    setCustomItem("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.country || !form.regionId || !form.city) {
      setError(t("locIncomplete"));
      return;
    }
    const partyError = validateShipmentPartyFields({
      senderName: form.senderName,
      receiverName: form.receiverName,
      streetOrAddress: form.streetAddress || form.address,
      postalCode: form.postalCode,
      country: form.country,
      regionIdOrName: form.regionId,
      city: form.city,
    });
    if (partyError) {
      setError(t(partyError));
      return;
    }
    if (!form.estimateWeightKg.trim()) {
      setError(t("estimateWeightRequired"));
      return;
    }
    try {
      const estimate = Number(form.estimateWeightKg.trim().replace(",", "."));
      if (!Number.isFinite(estimate) || estimate <= 0) {
        setError(t("estimateWeightInvalid"));
        return;
      }
    } catch {
      setError(t("estimateWeightInvalid"));
      return;
    }
    if (form.items.length === 0) {
      setError(t("itemsRequired"));
      return;
    }
    const idError = validateIdDoc(form.idDocType, form.idDocNumber);
    if (idError) {
      setError(t(idError));
      return;
    }

    if (TURNSTILE_ENABLED) {
      if (!TURNSTILE_SITE_KEY) {
        setError(t("turnstileMissing"));
        return;
      }
      if (!turnstileToken) {
        setError(t("turnstileRequired"));
        return;
      }
    }

    setIsGenerating(true);
    try {
      const publicCode = generateShipmentCode();
      const payload = buildPayloadString({ ...form, publicCode });
      const parsed = parsePayloadString(payload);
      await generateShipmentPdf(payload, parsed);
      setForm(initialForm);
      setTurnstileToken(null);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("pdfError");
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (showSkeleton) {
    return <PageSkeleton variant="form" />;
  }

  const regionEnabled = Boolean(form.country);
  const cityEnabled = Boolean(form.country && form.regionId);
  const postalEnabled = Boolean(form.country && form.regionId && form.city);

  return (
    <div className="app-page">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold tracking-tight text-primary">
              {t("brandName")}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">
              {t("title")}
            </h1>
            <p className="app-muted mt-1 max-w-2xl text-sm">{t("subtitle")}</p>
            <Link to="/" className="mt-2 inline-block text-sm text-secondary hover:underline">
              {t("backToHome")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="light" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="app-card space-y-8 p-5 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Sender */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-tertiary">{t("senderDetails")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-label sm:col-span-2">
                  {t("fullName")}
                  <input
                    required
                    value={form.senderName}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, senderName: e.target.value }))
                    }
                    className="app-input"
                  />
                </label>
                <label className="app-label sm:col-span-2">
                  {t("phone")}
                  <input
                    required
                    type="tel"
                    value={form.senderPhone}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, senderPhone: e.target.value }))
                    }
                    className="app-input"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <p className="mb-3 text-sm font-bold text-on-surface">{t("idDocTitle")}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((c) => ({ ...c, idDocType: "cin", idDocNumber: "" }))
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      form.idDocType === "cin"
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant bg-surface-container-lowest text-on-surface"
                    }`}
                  >
                    {t("idCin")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((c) => ({
                        ...c,
                        idDocType: "passport",
                        idDocNumber: "",
                      }))
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      form.idDocType === "passport"
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant bg-surface-container-lowest text-on-surface"
                    }`}
                  >
                    {t("idPassport")}
                  </button>
                </div>
                <label className="app-label">
                  {form.idDocType === "cin" ? t("idCinNumber") : t("idPassportNumber")}
                  <input
                    required
                    inputMode={form.idDocType === "cin" ? "numeric" : "text"}
                    maxLength={form.idDocType === "cin" ? 8 : 12}
                    pattern={form.idDocType === "cin" ? "\\d{8}" : "[A-Za-z0-9]{6,12}"}
                    value={form.idDocNumber}
                    onChange={(e) => {
                      const value =
                        form.idDocType === "cin"
                          ? e.target.value.replace(/\D/g, "").slice(0, 8)
                          : e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
                      setForm((c) => ({ ...c, idDocNumber: value }));
                    }}
                    className="app-input"
                    placeholder={
                      form.idDocType === "cin" ? "12345678" : "X1234567"
                    }
                  />
                </label>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  {form.idDocType === "cin" ? t("idCinHint") : t("idPassportHint")}
                </p>
              </div>
            </section>

            {/* Receiver */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-secondary">{t("receiverDetails")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-label sm:col-span-2">
                  {t("fullName")}
                  <input
                    required
                    value={form.receiverName}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, receiverName: e.target.value }))
                    }
                    className="app-input"
                  />
                </label>
                <label className="app-label sm:col-span-2">
                  {t("phone")}
                  <input
                    required
                    type="tel"
                    value={form.receiverPhone}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, receiverPhone: e.target.value }))
                    }
                    className="app-input"
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Delivery address = dropdowns + free text, one combined result */}
          <section className="space-y-4 border-t border-outline-variant/40 pt-6">
            <div>
              <h2 className="text-lg font-bold text-primary">{t("deliveryAddress")}</h2>
              <p className="text-sm text-on-surface-variant">{t("locSupport")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="app-label">
                {t("locCountry")}
                <select
                  required
                  value={form.country}
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

              <label className="app-label">
                {t(regionLabelKey)}
                <select
                  required
                  disabled={!regionEnabled}
                  value={form.regionId}
                  onChange={(e) => setRegion(e.target.value)}
                  className="app-input disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60"
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

              <label className="app-label">
                {t("locCity")}
                <select
                  required
                  disabled={!cityEnabled}
                  value={form.city}
                  onChange={(e) => setCity(e.target.value)}
                  className="app-input disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60"
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

              <label className="app-label">
                {t("locPostal")}
                <input
                  required
                  disabled={!postalEnabled}
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, postalCode: e.target.value }))
                  }
                  className="app-input disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60"
                  placeholder={postalEnabled ? postalHint : t("locSelectCityFirst")}
                />
                {postalEnabled && postalHint.includes("-") ? (
                  <span className="mt-1 block text-[11px] text-on-surface-variant">
                    {t("locPostalRangeHint")}: {postalHint}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
              <label className="app-label">
                {t("streetAddress")}
                <textarea
                  required
                  rows={3}
                  value={form.streetAddress}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, streetAddress: e.target.value }))
                  }
                  className="app-input"
                  placeholder={t("streetAddressHint")}
                />
                <span className="mt-1 block text-[11px] text-on-surface-variant">
                  {t("streetAddressHelp")}
                </span>
              </label>

              <div className="mt-4 rounded-lg border border-secondary/25 bg-surface-container-lowest px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                  {t("deliveryAddressCombined")}
                </p>
                <p className="mt-1 text-sm font-medium text-on-surface">
                  {form.address || t("addressPreviewHint")}
                </p>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="space-y-4 border-t border-outline-variant/40 pt-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-on-surface">{t("itemsTitle")}</h2>
                <p className="text-sm text-on-surface-variant">{t("itemsSupport")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="app-label min-w-[160px]">
                  {t("oilVolume")}
                  <input
                    required
                    inputMode="decimal"
                    value={form.oilLiters}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, oilLiters: e.target.value }))
                    }
                    className="app-input"
                  />
                </label>
                <label className="app-label min-w-[180px]">
                  {t("estimateWeight")}
                  <input
                    required
                    inputMode="decimal"
                    value={form.estimateWeightKg}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, estimateWeightKg: e.target.value }))
                    }
                    className="app-input"
                    placeholder={t("estimateWeightHint")}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {itemCatalog.map((item) => {
                const selected = form.items.some(
                  (entry) => entry.toLowerCase() === item.toLowerCase()
                );
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleItem(item)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "bg-tertiary text-on-tertiary"
                        : "border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="app-label flex-1">
                {t("itemsCustom")}
                <input
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomItem();
                    }
                  }}
                  className="app-input"
                  placeholder={t("itemsCustomHint")}
                />
              </label>
              <button
                type="button"
                onClick={addCustomItem}
                className="app-btn-ghost shrink-0"
              >
                {t("itemsAddCustom")}
              </button>
            </div>
            {form.items.length > 0 ? (
              <p className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">{t("itemsSelected")}: </span>
                {form.items.join(", ")}
              </p>
            ) : null}
          </section>

          {TURNSTILE_ENABLED && (
            <div className="flex justify-center border-t border-outline-variant/40 pt-6">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: "light" }}
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={isGenerating} className="app-btn-orange w-full py-3.5">
            {isGenerating
              ? t("generating")
              : TURNSTILE_ENABLED
                ? t("verifyPrint")
                : t("generatePdf")}
          </button>
          <p className="text-center text-xs text-on-surface-variant">{t("noCloudDb")}</p>
        </form>
      </div>
    </div>
  );
}
