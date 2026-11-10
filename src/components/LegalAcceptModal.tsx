import type { LegalDocumentBlock } from "../legalAttestation";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  open: boolean;
  blocks: LegalDocumentBlock[];
  accepting: boolean;
  onCancel: () => void;
  onAccept: () => void;
};

export function LegalAcceptModal({
  open,
  blocks,
  accepting,
  onCancel,
  onAccept,
}: Props) {
  const { t, isRtl } = useLanguage();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-accept-title"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-2xl"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="border-b border-outline-variant/40 px-4 py-3 sm:px-6">
          <h2
            id="legal-accept-title"
            className="text-lg font-extrabold tracking-tight text-on-surface"
          >
            {t("legalAcceptTitle")}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t("legalAcceptSupport")}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm leading-relaxed text-on-surface sm:px-6">
          {blocks.map((block, index) => {
            if (block.kind === "notice") {
              return (
                <p
                  key={index}
                  className="rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950"
                >
                  {block.text}
                </p>
              );
            }
            if (block.kind === "title") {
              return (
                <h3
                  key={index}
                  className="pt-2 text-sm font-extrabold uppercase tracking-wide text-primary"
                >
                  {block.text}
                </h3>
              );
            }
            if (block.kind === "field") {
              return (
                <p key={index}>
                  <span className="font-semibold text-on-surface">{block.label} :</span>{" "}
                  <span className="text-on-surface">{block.value || "—"}</span>
                </p>
              );
            }
            if (block.kind === "blank") {
              return (
                <p key={index} className="text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{block.label} :</span>{" "}
                  …………………………
                </p>
              );
            }
            return (
              <p key={index} className="text-on-surface-variant">
                {block.text}
              </p>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-outline-variant/40 bg-surface-container-low/40 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={accepting}
            className="app-btn-ghost order-2 sm:order-1"
          >
            {t("legalAcceptCancel")}
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={accepting}
            className="app-btn-orange order-1 sm:order-2"
          >
            {accepting ? t("generating") : t("legalAcceptConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
