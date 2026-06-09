import { Turnstile } from "@marsidev/react-turnstile";
import { FormEvent, useState } from "react";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useLanguage } from "./i18n/LanguageContext";
import { buildPayloadString, parsePayloadString } from "./payload";
import { generateShipmentPdf } from "./pdf";
import type { ShipmentFormData } from "./types";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const TURNSTILE_ENABLED =
  (import.meta.env.VITE_TURNSTILE_ENABLED ?? "false").toLowerCase() === "true";

const initialForm: ShipmentFormData = {
  senderName: "",
  senderPhone: "",
  receiverName: "",
  receiverPhone: "",
  address: "",
  oilLiters: "",
};

export default function App() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ShipmentFormData>(initialForm);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = (field: keyof ShipmentFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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
      const payload = buildPayloadString(form);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-slate-400">{t("subtitle")}</p>
        </header>

        <LanguageSwitcher />

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl"
        >
          <section>
            <h2 className="mb-4 text-lg font-semibold text-amber-300">
              {t("senderDetails")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                {t("fullName")}
                <input
                  required
                  value={form.senderName}
                  onChange={(e) => updateField("senderName", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                {t("phone")}
                <input
                  required
                  type="tel"
                  value={form.senderPhone}
                  onChange={(e) => updateField("senderPhone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-emerald-300">
              {t("receiverDetails")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                {t("fullName")}
                <input
                  required
                  value={form.receiverName}
                  onChange={(e) => updateField("receiverName", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                {t("phone")}
                <input
                  required
                  type="tel"
                  value={form.receiverPhone}
                  onChange={(e) => updateField("receiverPhone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-4 block text-sm">
              {t("deliveryAddress")}
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </label>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-sky-300">
              {t("oilLoadStatus")}
            </h2>
            <label className="block text-sm">
              {t("oilVolume")}
              <input
                required
                inputMode="decimal"
                value={form.oilLiters}
                onChange={(e) => updateField("oilLiters", e.target.value)}
                className="mt-1 w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              />
            </label>
          </section>

          {TURNSTILE_ENABLED && (
            <div className="flex justify-center">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: "dark" }}
              />
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full rounded-xl bg-amber-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating
              ? t("generating")
              : TURNSTILE_ENABLED
                ? t("verifyPrint")
                : t("generatePdf")}
          </button>

          <p className="text-center text-xs text-slate-500">{t("noCloudDb")}</p>
        </form>
      </div>
    </div>
  );
}
