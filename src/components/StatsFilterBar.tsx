import { useState } from "react";
import { EMPTY_STATS_FILTER, type StatsFilter } from "../dashboardAnalytics";
import { useLanguage } from "../i18n/LanguageContext";

interface StatsFilterBarProps {
  filter: StatsFilter;
  onChange: (next: StatsFilter) => void;
  countries: string[];
  cities: string[];
  scanners?: string[];
  compact?: boolean;
  /** Extra people / ID fields — used on the shipment table filter. */
  contactFilters?: boolean;
}

export function StatsFilterBar({
  filter,
  onChange,
  countries,
  cities,
  scanners = [],
  compact,
  contactFilters = false,
}: StatsFilterBarProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const set = (patch: Partial<StatsFilter>) => onChange({ ...filter, ...patch });

  const hasActive =
    Boolean(filter.dateFrom) ||
    Boolean(filter.dateTo) ||
    Boolean(filter.country) ||
    Boolean(filter.city) ||
    Boolean(filter.scannedBy) ||
    Boolean(filter.senderName) ||
    Boolean(filter.receiverName) ||
    Boolean(filter.senderPhone) ||
    Boolean(filter.receiverPhone) ||
    Boolean(filter.idDocType) ||
    Boolean(filter.idDocNumber);

  return (
    <div className={compact ? "mb-2" : "mb-3"}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
            open || hasActive
              ? "border-secondary bg-secondary-container text-secondary"
              : "border-outline-variant/70 bg-surface-container-lowest text-on-surface hover:border-secondary hover:text-secondary"
          }`}
          aria-expanded={open}
          aria-label={t("dashFilterTitle")}
          title={t("dashFilterTitle")}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            filter_list
          </span>
        </button>
        {hasActive ? (
          <>
            <span className="text-[10px] font-semibold text-secondary">
              {t("dashFilterActive")}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...EMPTY_STATS_FILTER })}
              className="text-[10px] font-semibold text-on-surface-variant hover:text-secondary hover:underline"
            >
              {t("dashFilterClear")}
            </button>
          </>
        ) : null}
      </div>

      {open ? (
        <div
          className={`mt-2 rounded-xl border border-outline-variant/50 bg-surface-container-low/60 ${
            compact ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}
          >
            <label className="block text-[10px] font-medium text-on-surface-variant">
              {t("dashFilterFrom")}
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => set({ dateFrom: e.target.value })}
                className="app-input mt-0.5 !py-1.5 text-xs"
              />
            </label>
            <label className="block text-[10px] font-medium text-on-surface-variant">
              {t("dashFilterTo")}
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => set({ dateTo: e.target.value })}
                className="app-input mt-0.5 !py-1.5 text-xs"
              />
            </label>
            <label className="block text-[10px] font-medium text-on-surface-variant">
              {t("dashFilterCountry")}
              <select
                value={filter.country}
                onChange={(e) => set({ country: e.target.value, city: "" })}
                className="app-input mt-0.5 !py-1.5 text-xs"
              >
                <option value="">{t("dashFilterAll")}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] font-medium text-on-surface-variant">
              {t("dashFilterCity")}
              <select
                value={filter.city}
                onChange={(e) => set({ city: e.target.value })}
                className="app-input mt-0.5 !py-1.5 text-xs"
              >
                <option value="">{t("dashFilterAll")}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[10px] font-medium text-on-surface-variant">
              {t("dashFilterScannedBy")}
              <select
                value={filter.scannedBy}
                onChange={(e) => set({ scannedBy: e.target.value })}
                className="app-input mt-0.5 !py-1.5 text-xs"
              >
                <option value="">{t("dashFilterAll")}</option>
                {scanners.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {contactFilters ? (
            <div
              className={`mt-2 grid gap-2 border-t border-outline-variant/40 pt-2 ${
                compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
              }`}
            >
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("senderName")}
                <input
                  type="text"
                  value={filter.senderName}
                  onChange={(e) => set({ senderName: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                  placeholder={t("senderName")}
                />
              </label>
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("receiverName")}
                <input
                  type="text"
                  value={filter.receiverName}
                  onChange={(e) => set({ receiverName: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                  placeholder={t("receiverName")}
                />
              </label>
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("senderPhone")}
                <input
                  type="text"
                  inputMode="tel"
                  value={filter.senderPhone}
                  onChange={(e) => set({ senderPhone: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                  placeholder={t("senderPhone")}
                />
              </label>
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("receiverPhone")}
                <input
                  type="text"
                  inputMode="tel"
                  value={filter.receiverPhone}
                  onChange={(e) => set({ receiverPhone: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                  placeholder={t("receiverPhone")}
                />
              </label>
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("dashFilterIdDocType")}
                <select
                  value={filter.idDocType}
                  onChange={(e) => set({ idDocType: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                >
                  <option value="">{t("dashFilterAll")}</option>
                  <option value="cin">{t("idCin")}</option>
                  <option value="passport">{t("idPassport")}</option>
                </select>
              </label>
              <label className="block text-[10px] font-medium text-on-surface-variant">
                {t("dashFilterIdDocNumber")}
                <input
                  type="text"
                  value={filter.idDocNumber}
                  onChange={(e) => set({ idDocNumber: e.target.value })}
                  className="app-input mt-0.5 !py-1.5 text-xs"
                  placeholder={t("dashFilterIdDocNumber")}
                />
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
