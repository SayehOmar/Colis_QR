/** Parse backend timestamps (often `YYYY-MM-DD HH:mm:ss UTC` or ISO). */
export function parseServerDate(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "never") return null;

  const normalized = trimmed
    .replace(/\s*UTC$/i, "Z")
    .replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/, "$1T$2");

  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized);
  const date = new Date(hasTz ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local date+time using the browser/PC timezone. */
export function formatLocalDateTime(
  value: string | null | undefined,
  locale: string,
  fallback = "—",
): string {
  const date = parseServerDate(value);
  if (!date) return value?.trim() || fallback;
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Local calendar date only. */
export function formatLocalDate(
  value: string | null | undefined,
  locale: string,
  fallback = "—",
): string {
  const date = parseServerDate(value);
  if (!date) return value?.trim() || fallback;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** YYYY-MM-DD in the browser's local timezone (for filters / grouping). */
export function localDayKey(value: string | null | undefined): string {
  const date = parseServerDate(value);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
