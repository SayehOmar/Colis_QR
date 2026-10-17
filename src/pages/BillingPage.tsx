import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  BillingPlan,
  fetchBillingPlans,
  openBillingPortal,
  startCheckout,
  syncBillingSubscription,
} from "../auth/api";
import { hasPaidSubscription } from "../billing/billingPeriod";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { SubscriptionPeriodCard } from "../components/SubscriptionPeriodCard";
import { formatLocalDateTime } from "../i18n/formatDateTime";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

const FALLBACK_PLANS: BillingPlan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price_eur: 20,
    interval: "month",
    interval_count: 1,
    configured: true,
  },
  {
    id: "quarterly",
    label: "3 months",
    price_eur: 52,
    interval: "month",
    interval_count: 3,
    configured: true,
  },
  {
    id: "yearly",
    label: "Yearly",
    price_eur: 192,
    interval: "year",
    interval_count: 1,
    configured: true,
  },
];

const PLAN_ORDER = ["monthly", "quarterly", "yearly"] as const;

const PLAN_LABEL_KEYS: Record<
  string,
  "billingPlanMonthly" | "billingPlanQuarterly" | "billingPlanYearly"
> = {
  monthly: "billingPlanMonthly",
  quarterly: "billingPlanQuarterly",
  yearly: "billingPlanYearly",
};

const PLAN_SUFFIX_KEYS: Record<
  string,
  "billingPerMonth" | "billingPerQuarter" | "billingPerYear"
> = {
  monthly: "billingPerMonth",
  quarterly: "billingPerQuarter",
  yearly: "billingPerYear",
};

export default function BillingPage() {
  const { t, language } = useLanguage();
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState<BillingPlan[]>(FALLBACK_PLANS);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const showSkeleton = usePageSkeleton(!loadingPlans, 400);

  const success = searchParams.get("success") === "1";
  const checkoutSessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingPlans(true);
      try {
        const next = await fetchBillingPlans();
        if (!cancelled && next.length > 0) {
          const byId = new Map(next.map((plan) => [plan.id, plan]));
          setPlans(
            PLAN_ORDER.map((id) => {
              const fromApi = byId.get(id);
              const fallback = FALLBACK_PLANS.find((p) => p.id === id)!;
              return fromApi
                ? { ...fallback, ...fromApi, price_eur: fromApi.price_eur || fallback.price_eur }
                : fallback;
            })
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("billingCheckoutError"));
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!token) return;
    if (!success && !hasPaidSubscription(user)) return;
    let cancelled = false;
    void (async () => {
      try {
        await syncBillingSubscription(token, checkoutSessionId || undefined);
        if (!cancelled) {
          await refreshUser();
        }
      } catch {
        // Keep local profile if Stripe sync is unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, success, checkoutSessionId, user?.subscription_plan, user?.subscription_status, refreshUser]);

  useEffect(() => {
    if (!success) {
      return;
    }
    setMessage(t("billingSuccess"));
    const timer = window.setTimeout(() => {
      void refreshUser().then((profile) => {
        if (profile?.has_access) {
          navigate("/dashboard", { replace: true });
        }
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [success, refreshUser, navigate, t]);

  useEffect(() => {
    if (canceled) {
      setMessage(t("billingCanceled"));
    }
  }, [canceled, t]);

  const trialLabel = useMemo(() => {
    if (!user?.trial_ends_at) {
      return null;
    }
    return formatLocalDateTime(user.trial_ends_at, locale, user.trial_ends_at);
  }, [user?.trial_ends_at, locale]);

  const handleCheckout = async (planId: string) => {
    if (!token) {
      return;
    }
    setError(null);
    setBusyPlan(planId);
    try {
      const session = await startCheckout(token, planId);
      if (!session.url) {
        throw new Error(t("billingCheckoutError"));
      }
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("billingCheckoutError"));
      setBusyPlan(null);
    }
  };

  const handlePortal = async () => {
    if (!token) {
      return;
    }
    setError(null);
    setPortalBusy(true);
    try {
      const url = await openBillingPortal(token);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("billingPortalError"));
      setPortalBusy(false);
    }
  };

  const clearFlags = () => {
    setSearchParams({}, { replace: true });
    setMessage(null);
  };

  const features: TranslationKey[] = [
    "billingFeatureOps",
    "billingFeaturePhone",
    "billingFeatureSupport",
  ];

  if (showSkeleton) {
    return <PageSkeleton variant="billing" />;
  }

  if (user?.account_role === "employee") {
    return (
      <div className="app-page">
        <PageSeo
          title={t("seoBillingTitle")}
          description={t("seoBillingDescription")}
          path="/billing"
          noindex
        />
        <div className="mx-auto max-w-lg px-4 py-12">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: t("breadcrumbDashboard"), to: "/dashboard" },
              { label: t("breadcrumbBilling") },
            ]}
          />
          <div className="app-card p-6 text-center">
            <h1 className="text-2xl font-bold text-on-surface">
              {t("billingTitle")}
            </h1>
            <p className="app-muted mt-3 text-sm">
              {t("billingManagedByEmployer").replace(
                "{name}",
                user.employer_name || user.employer_owner_email || "—",
              )}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {user.has_access ? (
                <Link to="/dashboard" className="app-btn-navy">
                  {t("billingGoDashboard")}
                </Link>
              ) : null}
              <Link to="/profile" className="app-btn-ghost">
                {t("profileTitle")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page relative overflow-hidden">
      <PageSeo
        title={t("seoBillingTitle")}
        description={t("seoBillingDescription")}
        path="/billing"
        noindex
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,122,0,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(0,168,168,0.08),_transparent_45%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: t("breadcrumbDashboard"), to: "/dashboard" },
            { label: t("breadcrumbBilling") },
          ]}
        />
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-tertiary">
              <Link to="/dashboard" className="hover:underline">
                {t("brandName")}
              </Link>
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              {t("billingTitle")}
            </h1>
            <p className="app-muted mt-2 text-sm sm:text-base">{t("billingSubtitle")}</p>
            {user ? (
              <p className="mt-3 text-xs text-on-surface-variant">{user.email}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher variant="light" />
            {user?.has_access ? (
              <Link to="/dashboard" className="app-btn-ghost">
                {t("billingGoDashboard")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="app-btn-ghost"
            >
              {t("logout")}
            </button>
          </div>
        </header>

        {user?.has_access &&
        (user.subscription_status === "trialing" || !user.subscription_plan) &&
        trialLabel ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {t("billingTrialActive")}{" "}
            <span className="font-semibold">{trialLabel}</span>
            <p className="mt-1">{t("billingTrialSubscribe")}</p>
          </div>
        ) : null}

        {!user?.has_access ? (
          <div className="mb-5 rounded-xl border border-tertiary/30 bg-tertiary-container px-4 py-3 text-sm text-on-tertiary-fixed">
            {t("billingExpired")}
          </div>
        ) : null}

        {message ? (
          <div className="app-card mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>{message}</span>
            <button type="button" onClick={clearFlags} className="underline underline-offset-2">
              OK
            </button>
          </div>
        ) : null}

        <SubscriptionPeriodCard user={user} className="mb-5" />

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-on-surface">{t("billingChoosePlan")}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant">
            {features.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" />
                {t(key)}
              </li>
            ))}
          </ul>
        </section>

        {loadingPlans ? (
          <p className="app-muted mb-4 text-sm">{t("billingLoadingPlans")}</p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => {
            const isFeatured = plan.id === "yearly";
            const isCurrent = user?.subscription_plan === plan.id;
            const disabled = busyPlan !== null;

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition ${
                  isFeatured
                    ? "border-tertiary/70 bg-gradient-to-b from-tertiary/10 to-white shadow-sm"
                    : "border-outline-variant/60 bg-surface-container-lowest hover:border-secondary/40"
                }`}
                style={{
                  animation: `slideUp 0.45s ease ${index * 0.08}s both`,
                }}
              >
                {isFeatured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-tertiary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-tertiary">
                    {t("billingBestValue")}
                  </span>
                ) : null}

                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-on-surface">
                    {t(PLAN_LABEL_KEYS[plan.id] ?? "billingPlanMonthly")}
                  </h3>
                  {isCurrent ? (
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                      {t("billingCurrentPlan")}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-primary">
                    {`€${plan.price_eur}`}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {t(PLAN_SUFFIX_KEYS[plan.id] ?? "billingPerMonth")}
                  </span>
                </p>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void handleCheckout(plan.id)}
                  className={`mt-6 rounded-xl px-4 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isFeatured
                      ? "bg-tertiary text-on-tertiary hover:brightness-95"
                      : "bg-primary text-on-primary hover:brightness-110"
                  }`}
                >
                  {busyPlan === plan.id ? t("authLoading") : t("billingSubscribe")}
                </button>
              </article>
            );
          })}
        </div>

        <footer className="mt-10 flex flex-col gap-4 border-t border-outline-variant/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <nav className="flex flex-wrap gap-3 text-xs font-medium text-on-surface-variant">
              <Link to="/terms" className="hover:text-on-surface">
                {t("navTerms")}
              </Link>
              <Link to="/privacy" className="hover:text-on-surface">
                {t("navPrivacy")}
              </Link>
              <Link to="/refund" className="hover:text-on-surface">
                {t("navRefund")}
              </Link>
            </nav>
          </div>
          <button
            type="button"
            disabled={portalBusy || !token}
            onClick={() => void handlePortal()}
            className="app-btn-ghost disabled:opacity-50"
          >
            {portalBusy ? t("authLoading") : t("billingManage")}
          </button>
        </footer>
      </div>
    </div>
  );
}
