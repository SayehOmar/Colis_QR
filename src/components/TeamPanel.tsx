import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { EmployerInfo, fetchEmployer } from "../auth/api";
import { useLanguage } from "../i18n/LanguageContext";

export function TeamPanel() {
  const { t, language } = useLanguage();
  const { token } = useAuth();
  const [info, setInfo] = useState<EmployerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchEmployer(token);
      setInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("teamLoadError"));
    }
  }, [token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!info || info.role !== "employer") {
    return null;
  }

  const handleCopy = async () => {
    if (!info.join_code) return;
    try {
      await navigator.clipboard.writeText(info.join_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("teamCopyError"));
    }
  };

  return (
    <section className="app-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-on-surface">{t("teamTitle")}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">{t("teamSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 font-mono text-lg font-extrabold tracking-[0.2em] text-primary">
            {info.join_code || "———"}
          </span>
          <button
            type="button"
            className="app-btn-ghost text-xs"
            onClick={() => void handleCopy()}
            disabled={!info.join_code}
          >
            {copied ? t("copiedCell") : t("teamCopyCode")}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b border-outline-variant/50 text-xs uppercase tracking-wide text-on-surface-variant">
              <th className="px-2 py-2 font-semibold">{t("name")}</th>
              <th className="px-2 py-2 font-semibold">{t("email")}</th>
              <th className="px-2 py-2 font-semibold">{t("teamJoinedAt")}</th>
            </tr>
          </thead>
          <tbody>
            {(info.workers ?? []).length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-2 py-6 text-center text-on-surface-variant"
                >
                  {t("teamNoWorkers")}
                </td>
              </tr>
            ) : (
              (info.workers ?? []).map((worker) => (
                <tr
                  key={worker.id}
                  className="border-b border-outline-variant/30 last:border-0"
                >
                  <td className="px-2 py-2 font-medium text-on-surface">
                    {worker.name || "—"}
                  </td>
                  <td className="px-2 py-2 text-on-surface-variant">
                    {worker.email}
                  </td>
                  <td className="px-2 py-2 text-on-surface-variant">
                    {worker.joined_at
                      ? new Date(worker.joined_at).toLocaleString(locale)
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
