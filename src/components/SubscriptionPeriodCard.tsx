import { useMemo } from "react";
import type { AuthUser } from "../auth/api";
import {
  formatBillingDate,
  formatDurationUntil,
  hasPaidSubscription,
} from "../billing/billingPeriod";
import { useLanguage } from "../i18n/LanguageContext";

export function SubscriptionPeriodCard({
  user,
  className = "",
}: {
  user: AuthUser | null | undefined;
  className?: string;
}) {
  const { t, language } = useLanguage();
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";

  const show = hasPaidSubscription(user);
  const lastLabel = useMemo(
    () => formatBillingDate(user?.subscription_period_starts_at, locale),
    [user?.subscription_period_starts_at, locale],
  );
  const nextLabel = useMemo(
    () => formatBillingDate(user?.subscription_ends_at, locale),
    [user?.subscription_ends_at, locale],
  );
  const untilLabel = useMemo(
    () =>
      formatDurationUntil(user?.subscription_ends_at, {
        ended: t("billingPeriodEnded"),
        days: (n) => t("billingPeriodDays").replace("{n}", String(n)),
        hours: (n) => t("billingPeriodHours").replace("{n}", String(n)),
        soon: t("billingPeriodSoon"),
      }),
    [user?.subscription_ends_at, t],
  );

  if (!show) return null;

  return (
    <section
      className={`rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-4 sm:px-5 ${className}`}
    >
      <h2 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
        {t("billingPeriodTitle")}
      </h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-on-surface-variant">
            {t("billingLastBilled")}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-on-surface">
            {lastLabel || t("billingPeriodUnknown")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">
            {t("billingNextBilling")}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-on-surface">
            {nextLabel || t("billingPeriodUnknown")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-on-surface-variant">
            {t("billingUntilNext")}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-primary">
            {untilLabel || t("billingPeriodUnknown")}
          </dd>
        </div>
      </dl>
    </section>
  );
}
