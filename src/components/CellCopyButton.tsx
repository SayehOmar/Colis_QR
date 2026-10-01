import { useState, type MouseEvent } from "react";
import { useLanguage } from "../i18n/LanguageContext";

type CellCopyButtonProps = {
  text: string | number | null | undefined;
  className?: string;
};

function normalizeCopyText(text: string | number | null | undefined): string {
  if (text == null) return "";
  const raw = String(text).trim();
  if (!raw || raw === "—") return "";
  return String(text);
}

export function CellCopyButton({ text, className = "" }: CellCopyButtonProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const value = normalizeCopyText(text);

  const handleCopy = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  };

  return (
    <button
      type="button"
      onClick={(event) => void handleCopy(event)}
      disabled={!value}
      title={copied ? t("copiedCell") : t("copyCell")}
      aria-label={copied ? t("copiedCell") : t("copyCell")}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-outline-variant/70 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      <span className="material-symbols-outlined text-[14px]" aria-hidden>
        {copied ? "check" : "content_copy"}
      </span>
    </button>
  );
}

type StaticCopyCellProps = {
  value: string | number | null | undefined;
  className?: string;
};

/** Read-only table cell with a copy button. */
export function StaticCopyCell({ value, className = "" }: StaticCopyCellProps) {
  const display = value === "" || value == null ? "—" : String(value);
  return (
    <td
      className={`group relative px-3 py-3 align-top text-sm leading-relaxed text-on-surface ${className}`}
    >
      <div className="flex items-start gap-1.5">
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
          {display}
        </span>
        <CellCopyButton
          text={display}
          className="opacity-70 group-hover:opacity-100"
        />
      </div>
    </td>
  );
}
