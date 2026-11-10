import { Turnstile } from "@marsidev/react-turnstile";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { LegalAcceptModal } from "../components/LegalAcceptModal";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import {
  COUNTRY_OPTIONS,
  type CountryCode,
  getCities,
  getRegionLabelKey,
  getRegions,
  primaryPostalCode,
} from "../data/locations";
import {
  collectShipmentFieldErrors,
  type ShipmentFieldKey,
} from "../formValidation";
import { useLanguage } from "../i18n/LanguageContext";
import { buildLegalDocument } from "../legalAttestation";
import { buildAddressLine, buildPayloadString, parsePayloadString } from "../payload";
import { generateShipmentPdf } from "../pdf";
import { generateShipmentCode } from "../shipmentCode";
import {
  cacheCustomShipmentItem,
  loadAllShipmentItems,
  shipmentItemLabel,
} from "../shipmentItems";
import { turnstileEnabled, turnstileSiteKey } from "../config";
import type { ParsedPayloadFields, ShipmentFormData } from "../types";

const TURNSTILE_SITE_KEY = turnstileSiteKey;
const TURNSTILE_ENABLED = turnstileEnabled;

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
  departureStreetAddress: "",
  departureCountry: "",
  departureRegionId: "",
  departureRegionName: "",
  departureCity: "",
  departurePostalCode: "",
  departureAddress: "",
  oilLiters: "0",
  estimateWeightKg: "",
  publicCode: "",
  items: [],
  idDocType: "cin",
  idDocNumber: "",
};

function RequiredMark() {
  return <span className="ms-0.5 text-red-600">*</span>;
}

function fieldClass(hasError: boolean | undefined): string {
  return hasError
    ? "app-input border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500"
    : "app-input";
}

export default function ShipmentFormPage() {
  const { t, language } = useLanguage();
  const showSkeleton = usePageSkeleton(true, 400);
  const [form, setForm] = useState<ShipmentFormData>(initialForm);
  const [itemCatalog, setItemCatalog] = useState(() => loadAllShipmentItems());
  const [customItem, setCustomItem] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ShipmentFieldKey, true>>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<ParsedPayloadFields | null>(
    null
  );

  const country = form.country as CountryCode | "";
  const departureCountry = form.departureCountry as CountryCode | "";
  const regions = useMemo(() => getRegions(country), [country]);
  const departureRegions = useMemo(
    () => getRegions(departureCountry),
    [departureCountry]
  );
  const cities = useMemo(
    () => getCities(country, form.regionId),
    [country, form.regionId]
  );
  const departureCities = useMemo(
    () => getCities(departureCountry, form.departureRegionId),
    [departureCountry, form.departureRegionId]
  );
  const regionLabelKey = getRegionLabelKey(country);
  const departureRegionLabelKey = getRegionLabelKey(departureCountry);
  const selectedCity = cities.find((city) => city.name === form.city);
  const selectedDepartureCity = departureCities.find(
    (city) => city.name === form.departureCity
  );
  const postalHint = selectedCity?.postalCode ?? "";
  const departurePostalHint = selectedDepartureCity?.postalCode ?? "";

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

  useEffect(() => {
    const countryLabel = form.departureCountry
      ? t(
          COUNTRY_OPTIONS.find(
            (option) => option.code === form.departureCountry
          )?.nameKey ?? "countryFrance"
        )
      : "";
    const departureAddress = buildAddressLine({
      streetAddress: form.departureStreetAddress,
      city: form.departureCity,
      postalCode: form.departurePostalCode,
      regionName: form.departureRegionName,
      country: countryLabel,
    });
    setForm((current) =>
      current.departureAddress === departureAddress
        ? current
        : { ...current, departureAddress }
    );
  }, [
    form.departureStreetAddress,
    form.departureCity,
    form.departurePostalCode,
    form.departureRegionName,
    form.departureCountry,
    t,
  ]);

  const setDeliveryCountry = (code: string) => {
    setForm((current) => ({
      ...current,
      country: code,
      regionId: "",
      regionName: "",
      city: "",
      postalCode: "",
    }));
  };

  const setDeliveryRegion = (regionId: string) => {
    const region = regions.find((entry) => entry.id === regionId);
    setForm((current) => ({
      ...current,
      regionId,
      regionName: region?.name ?? "",
      city: "",
      postalCode: "",
    }));
  };

  const setDeliveryCity = (cityName: string) => {
    const city = cities.find((entry) => entry.name === cityName);
    setForm((current) => ({
      ...current,
      city: cityName,
      postalCode: city ? primaryPostalCode(city.postalCode) : "",
    }));
  };

  const setDepartureCountry = (code: string) => {
    setForm((current) => ({
      ...current,
      departureCountry: code,
      departureRegionId: "",
      departureRegionName: "",
      departureCity: "",
      departurePostalCode: "",
    }));
  };

  const setDepartureRegion = (regionId: string) => {
    const region = departureRegions.find((entry) => entry.id === regionId);
    setForm((current) => ({
      ...current,
      departureRegionId: regionId,
      departureRegionName: region?.name ?? "",
      departureCity: "",
      departurePostalCode: "",
    }));
  };

  const setDepartureCity = (cityName: string) => {
    const city = departureCities.find((entry) => entry.name === cityName);
    setForm((current) => ({
      ...current,
      departureCity: cityName,
      departurePostalCode: city ? primaryPostalCode(city.postalCode) : "",
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
          ? current.items.filter(
              (entry) => entry.toLowerCase() !== item.toLowerCase()
            )
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

  const labelForItem = (id: string) => shipmentItemLabel(id, t);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const { errors, messageKey } = collectShipmentFieldErrors({
      senderName: form.senderName,
      senderPhone: form.senderPhone,
      idDocType: form.idDocType,
      idDocNumber: form.idDocNumber,
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      departureCountry: form.departureCountry,
      departureRegionId: form.departureRegionId,
      departureCity: form.departureCity,
      departurePostalCode: form.departurePostalCode,
      departureStreetAddress: form.departureStreetAddress,
      country: form.country,
      regionId: form.regionId,
      city: form.city,
      postalCode: form.postalCode,
      streetAddress: form.streetAddress,
      oilLiters: form.oilLiters,
      estimateWeightKg: form.estimateWeightKg,
      items: form.items,
    });
    setFieldErrors(errors);
    if (messageKey) {
      setError(t(messageKey));
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

    try {
      const publicCode = generateShipmentCode();
      const payload = buildPayloadString({ ...form, publicCode });
      const parsed = parsePayloadString(payload);
      // Keep country codes (not labels) for nationality adjectives in the legal text.
      parsed.country = form.country;
      parsed.departureCountry = form.departureCountry;
      setPendingPayload(payload);
      setPendingFields(parsed);
      setLegalOpen(true);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("pdfError");
      setError(message);
    }
  };

  const handleAcceptLegal = async () => {
    if (!pendingPayload || !pendingFields) return;
    setIsGenerating(true);
    try {
      await generateShipmentPdf(pendingPayload, pendingFields, language);
      setLegalOpen(false);
      setPendingPayload(null);
      setPendingFields(null);
      setForm(initialForm);
      setFieldErrors({});
      setTurnstileToken(null);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("pdfError");
      setError(message);
      setLegalOpen(false);
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
  const depRegionEnabled = Boolean(form.departureCountry);
  const depCityEnabled = Boolean(form.departureCountry && form.departureRegionId);
  const depPostalEnabled = Boolean(
    form.departureCountry && form.departureRegionId && form.departureCity
  );

  const legalBlocks = pendingFields
    ? buildLegalDocument(language, pendingFields)
    : [];

  return (
    <div className="app-page">
      <PageSeo
        title={t("seoClientTitle")}
        description={t("seoClientDescription")}
        path="/client"
      />
      <LegalAcceptModal
        open={legalOpen}
        blocks={legalBlocks}
        accepting={isGenerating}
        onCancel={() => {
          if (isGenerating) return;
          setLegalOpen(false);
          setPendingPayload(null);
          setPendingFields(null);
        }}
        onAccept={handleAcceptLegal}
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t("breadcrumbStart"), to: "/start" },
            { label: t("breadcrumbClient") },
          ]}
        />
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold tracking-tight text-primary">
              <Link to="/" className="hover:underline">
                {t("brandName")}
              </Link>
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">
              {t("shipmentFormTitle")}
            </h1>
            <p className="app-muted mt-1 max-w-2xl text-sm">{t("subtitle")}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <Link to="/" className="text-secondary hover:underline">
                {t("backToHome")}
              </Link>
              <Link to="/start" className="text-secondary hover:underline">
                {t("breadcrumbStart")}
              </Link>
              <Link to="/login" className="text-secondary hover:underline">
                {t("operationsLogin")}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="light" />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="app-card space-y-8 p-5 sm:p-8" noValidate>
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-tertiary">{t("senderDetails")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-label sm:col-span-2">
                  {t("fullName")}
                  <RequiredMark />
                  <input
                    value={form.senderName}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, senderName: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.senderName)}
                  />
                </label>
                <label className="app-label sm:col-span-2">
                  {t("phone")}
                  <RequiredMark />
                  <input
                    type="tel"
                    value={form.senderPhone}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, senderPhone: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.senderPhone)}
                  />
                </label>
              </div>

              <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
                <p className="mb-3 text-sm font-bold text-on-surface">
                  {t("idDocTitle")}
                  <RequiredMark />
                </p>
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
                  <RequiredMark />
                  <input
                    inputMode={form.idDocType === "cin" ? "numeric" : "text"}
                    maxLength={form.idDocType === "cin" ? 8 : 12}
                    value={form.idDocNumber}
                    onChange={(e) => {
                      const value =
                        form.idDocType === "cin"
                          ? e.target.value.replace(/\D/g, "").slice(0, 8)
                          : e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
                      setForm((c) => ({ ...c, idDocNumber: value }));
                    }}
                    className={fieldClass(fieldErrors.idDocNumber)}
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

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-secondary">{t("receiverDetails")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="app-label sm:col-span-2">
                  {t("fullName")}
                  <RequiredMark />
                  <input
                    value={form.receiverName}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, receiverName: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.receiverName)}
                  />
                </label>
                <label className="app-label sm:col-span-2">
                  {t("phone")}
                  <RequiredMark />
                  <input
                    type="tel"
                    value={form.receiverPhone}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, receiverPhone: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.receiverPhone)}
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Departure address */}
          <section className="space-y-4 border-t border-outline-variant/40 pt-6">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {t("departureAddress")}
                <RequiredMark />
              </h2>
              <p className="text-sm text-on-surface-variant">{t("locSupport")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="app-label">
                {t("locCountry")}
                <RequiredMark />
                <select
                  value={form.departureCountry}
                  onChange={(e) => setDepartureCountry(e.target.value)}
                  className={fieldClass(fieldErrors.departureCountry)}
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
                {t(departureRegionLabelKey)}
                <RequiredMark />
                <select
                  disabled={!depRegionEnabled}
                  value={form.departureRegionId}
                  onChange={(e) => setDepartureRegion(e.target.value)}
                  className={`${fieldClass(fieldErrors.departureRegionId)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
                >
                  <option value="">
                    {depRegionEnabled
                      ? t("locSelectRegion")
                      : t("locSelectCountryFirst")}
                  </option>
                  {departureRegions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="app-label">
                {t("locCity")}
                <RequiredMark />
                <select
                  disabled={!depCityEnabled}
                  value={form.departureCity}
                  onChange={(e) => setDepartureCity(e.target.value)}
                  className={`${fieldClass(fieldErrors.departureCity)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
                >
                  <option value="">
                    {depCityEnabled ? t("locSelectCity") : t("locSelectRegionFirst")}
                  </option>
                  {departureCities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="app-label">
                {t("locPostal")}
                <RequiredMark />
                <input
                  disabled={!depPostalEnabled}
                  value={form.departurePostalCode}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      departurePostalCode: e.target.value,
                    }))
                  }
                  className={`${fieldClass(fieldErrors.departurePostalCode)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
                  placeholder={
                    depPostalEnabled ? departurePostalHint : t("locSelectCityFirst")
                  }
                />
              </label>
            </div>

            <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
              <label className="app-label">
                {t("streetAddress")}
                <RequiredMark />
                <textarea
                  rows={3}
                  value={form.departureStreetAddress}
                  onChange={(e) =>
                    setForm((c) => ({
                      ...c,
                      departureStreetAddress: e.target.value,
                    }))
                  }
                  className={fieldClass(fieldErrors.departureStreetAddress)}
                  placeholder={t("streetAddressHint")}
                />
              </label>
              <div className="mt-4 rounded-lg border border-secondary/25 bg-surface-container-lowest px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
                  {t("departureAddressCombined")}
                </p>
                <p className="mt-1 text-sm font-medium text-on-surface">
                  {form.departureAddress || t("addressPreviewHint")}
                </p>
              </div>
            </div>
          </section>

          {/* Delivery address */}
          <section className="space-y-4 border-t border-outline-variant/40 pt-6">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {t("deliveryAddress")}
                <RequiredMark />
              </h2>
              <p className="text-sm text-on-surface-variant">{t("locSupport")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="app-label">
                {t("locCountry")}
                <RequiredMark />
                <select
                  value={form.country}
                  onChange={(e) => setDeliveryCountry(e.target.value)}
                  className={fieldClass(fieldErrors.country)}
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
                <RequiredMark />
                <select
                  disabled={!regionEnabled}
                  value={form.regionId}
                  onChange={(e) => setDeliveryRegion(e.target.value)}
                  className={`${fieldClass(fieldErrors.regionId)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
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
                <RequiredMark />
                <select
                  disabled={!cityEnabled}
                  value={form.city}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className={`${fieldClass(fieldErrors.city)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
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
                <RequiredMark />
                <input
                  disabled={!postalEnabled}
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, postalCode: e.target.value }))
                  }
                  className={`${fieldClass(fieldErrors.postalCode)} disabled:cursor-not-allowed disabled:bg-surface-container disabled:opacity-60`}
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
                <RequiredMark />
                <textarea
                  rows={3}
                  value={form.streetAddress}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, streetAddress: e.target.value }))
                  }
                  className={fieldClass(fieldErrors.streetAddress)}
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

          <section className="space-y-4 border-t border-outline-variant/40 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-on-surface">
                  {t("itemsTitle")}
                  <RequiredMark />
                </h2>
                <p className="text-sm text-on-surface-variant">{t("itemsSupport")}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <label className="app-label min-w-[160px]">
                  {t("oilVolume")}
                  <RequiredMark />
                  <input
                    inputMode="decimal"
                    value={form.oilLiters}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, oilLiters: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.oilLiters)}
                  />
                </label>
                <label className="app-label min-w-[180px]">
                  {t("estimateWeight")}
                  <RequiredMark />
                  <input
                    inputMode="decimal"
                    value={form.estimateWeightKg}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, estimateWeightKg: e.target.value }))
                    }
                    className={fieldClass(fieldErrors.estimateWeightKg)}
                    placeholder={t("estimateWeightHint")}
                  />
                </label>
              </div>
            </div>

            <div
              className={`flex flex-wrap gap-2 rounded-xl p-2 ${
                fieldErrors.items ? "ring-1 ring-red-500" : ""
              }`}
            >
              {itemCatalog.map((item) => {
                const selected = form.items.some(
                  (entry) => entry.toLowerCase() === item.id.toLowerCase()
                );
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "bg-tertiary text-on-tertiary"
                        : "border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"
                    }`}
                  >
                    {item.labelKey ? t(item.labelKey) : item.id}
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
                <span className="font-semibold text-on-surface">
                  {t("itemsSelected")}:{" "}
                </span>
                {form.items.map(labelForItem).join(", ")}
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
