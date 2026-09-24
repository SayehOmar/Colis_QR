import { useMutation } from "@apollo/client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { COUNTRY_OPTIONS } from "../data/locations";
import { validateShipmentPartyFields } from "../formValidation";
import { CREATE_MANUAL_SHIPMENT, SHIPMENTS_QUERY } from "../graphql";
import { useLanguage } from "../i18n/LanguageContext";
import { buildAddressLine } from "../payload";
import {
  cacheCustomShipmentItem,
  loadAllShipmentItems,
} from "../shipmentItems";
import {
  emptyLocationSelection,
  LocationCascade,
  type LocationSelection,
} from "./LocationCascade";

interface AddShipmentModalProps {
  onClose: () => void;
}

export function AddShipmentModal({ onClose }: AddShipmentModalProps) {
  const { t } = useLanguage();
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [location, setLocation] = useState<LocationSelection>(emptyLocationSelection);
  const [address, setAddress] = useState("");
  const [oilLiters, setOilLiters] = useState("0");
  const [weightKg, setWeightKg] = useState("");
  const [estimateWeightKg, setEstimateWeightKg] = useState("");
  const [tariffAmount, setTariffAmount] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [itemCatalog, setItemCatalog] = useState(() => loadAllShipmentItems());
  const [customItem, setCustomItem] = useState("");
  const [idDocType, setIdDocType] = useState<"cin" | "passport">("cin");
  const [idDocNumber, setIdDocNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createShipment, { loading }] = useMutation(CREATE_MANUAL_SHIPMENT);

  const countryLabel = useMemo(() => {
    if (!location.country) return "";
    const key =
      COUNTRY_OPTIONS.find((option) => option.code === location.country)?.nameKey ??
      "countryFrance";
    return t(key);
  }, [location.country, t]);

  useEffect(() => {
    const composed = buildAddressLine({
      streetAddress,
      city: location.city,
      postalCode: location.postalCode,
      regionName: location.regionName,
      country: countryLabel,
    });
    setAddress(composed);
  }, [
    streetAddress,
    location.city,
    location.postalCode,
    location.regionName,
    countryLabel,
  ]);

  const toggleItem = (item: string) => {
    setItems((current) => {
      const exists = current.some((entry) => entry.toLowerCase() === item.toLowerCase());
      return exists
        ? current.filter((entry) => entry.toLowerCase() !== item.toLowerCase())
        : [...current, item];
    });
  };

  const addCustomItem = () => {
    const saved = cacheCustomShipmentItem(customItem);
    if (!saved) return;
    setItemCatalog(loadAllShipmentItems());
    setItems((current) => {
      const exists = current.some((entry) => entry.toLowerCase() === saved.toLowerCase());
      return exists ? current : [...current, saved];
    });
    setCustomItem("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const partyError = validateShipmentPartyFields({
      senderName,
      receiverName,
      streetOrAddress: streetAddress || address,
      postalCode: location.postalCode,
      country: location.country,
      regionIdOrName: location.regionId || location.regionName,
      city: location.city,
    });
    if (partyError) {
      setError(t(partyError));
      return;
    }
    if (items.length === 0) {
      setError(t("itemsRequired"));
      return;
    }
    if (!weightKg.trim() || Number(weightKg) <= 0) {
      setError(t("weightRequired"));
      return;
    }
    if (tariffAmount.trim() === "" || Number(tariffAmount) < 0) {
      setError(t("tariffRequired"));
      return;
    }

    const result = await createShipment({
      refetchQueries: [{ query: SHIPMENTS_QUERY }],
      variables: {
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        address: address.trim(),
        oilLiters: Number(oilLiters || 0),
        weightKg: Number(weightKg),
        estimateWeightKg: Number(estimateWeightKg || 0),
        tariffAmount: Number(tariffAmount),
        items: items.join(","),
        idDocType,
        idDocNumber: idDocNumber.trim(),
        country: location.country,
        regionName: location.regionName,
        city: location.city,
        postalCode: location.postalCode.trim(),
      },
    });
    if (!result.data?.createManualShipment?.success) {
      setError(result.data?.createManualShipment?.message ?? t("actionFailed"));
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="app-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
      >
        <h2 className="mb-4 text-xl font-bold text-on-surface">{t("addShipmentTitle")}</h2>

        {error ? (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="app-label">
            {t("senderName")}
            <input
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("senderPhone")}
            <input
              required
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("receiverName")}
            <input
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("receiverPhone")}
            <input
              required
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="app-input"
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm font-bold text-on-surface">{t("deliveryAddress")}</p>
          <LocationCascade value={location} onChange={setLocation} required />
          <label className="app-label">
            {t("streetAddress")}
            <textarea
              required
              rows={2}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="app-input"
              placeholder={t("streetAddressHint")}
            />
          </label>
          <div className="rounded-lg border border-secondary/25 bg-surface-container-low/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary">
              {t("deliveryAddressCombined")}
            </p>
            <p className="mt-0.5 text-sm text-on-surface">
              {address || t("addressPreviewHint")}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-bold text-on-surface">{t("itemsTitle")}</p>
          <div className="flex flex-wrap gap-2">
            {itemCatalog.map((item) => {
              const selected = items.some(
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
                      : "border border-outline-variant bg-white text-on-surface hover:border-secondary"
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
            <button type="button" onClick={addCustomItem} className="app-btn-ghost shrink-0">
              {t("itemsAddCustom")}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="app-label">
            {t("idDocTitle")}
            <select
              value={idDocType}
              onChange={(e) => setIdDocType(e.target.value as "cin" | "passport")}
              className="app-input"
            >
              <option value="cin">{t("idCin")}</option>
              <option value="passport">{t("idPassport")}</option>
            </select>
          </label>
          <label className="app-label">
            {idDocType === "cin" ? t("idCinNumber") : t("idPassportNumber")}
            <input
              value={idDocNumber}
              onChange={(e) => setIdDocNumber(e.target.value)}
              className="app-input"
              placeholder={idDocType === "cin" ? "12345678" : "X1234567"}
            />
          </label>
          <label className="app-label">
            {t("oilLiters")}
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={oilLiters}
              onChange={(e) => setOilLiters(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("estimateWeight")}
            <input
              type="number"
              step="0.01"
              min="0"
              value={estimateWeightKg}
              onChange={(e) => setEstimateWeightKg(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("weight")}
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="app-input"
            />
          </label>
          <label className="app-label">
            {t("tariff")}
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={tariffAmount}
              onChange={(e) => setTariffAmount(e.target.value)}
              className="app-input"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="app-btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" disabled={loading} className="app-btn-orange px-4 py-2">
            {loading ? "…" : t("save")}
          </button>
        </div>
      </form>
    </div>
  );
}
