import { formatLocalDate, parseServerDate } from "../i18n/formatDateTime";

export function formatBillingDate(
  value: string | null | undefined,
  locale: string,
): string | null {
  if (!value) return null;
  if (!parseServerDate(value) && Number.isNaN(new Date(value).getTime())) {
    return value;
  }
  return formatLocalDate(value, locale, value);
}

export function formatDurationUntil(
  endsAt: string | null | undefined,
  labels: {
    ended: string;
    days: (n: number) => string;
    hours: (n: number) => string;
    soon: string;
  },
): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return labels.ended;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return labels.days(days);
  if (hours >= 1) return labels.hours(hours);
  return labels.soon;
}

export function hasPaidSubscription(user: {
  subscription_status?: string | null;
  subscription_plan?: string | null;
  subscription_ends_at?: string | null;
} | null | undefined): boolean {
  if (!user) return false;
  const status = (user.subscription_status || "").toLowerCase();
  if (!["active", "past_due", "paused", "canceled"].includes(status)) {
    return false;
  }
  return Boolean(user.subscription_plan || user.subscription_ends_at);
}
