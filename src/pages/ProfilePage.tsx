import { QRCodeSVG } from "qrcode.react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { changePassword, openBillingPortal, updateProfile } from "../auth/api";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PasswordField } from "../components/PasswordField";
import { apkDownloadUrl } from "../config";
import { useLanguage } from "../i18n/LanguageContext";

function formatTrialRemaining(
  trialEndsAt: string | null | undefined,
  labels: {
    ended: string;
    days: (n: number) => string;
    hours: (n: number) => string;
    soon: string;
  },
): string {
  if (!trialEndsAt) return "—";
  const end = new Date(trialEndsAt).getTime();
  if (Number.isNaN(end)) return trialEndsAt;
  const ms = end - Date.now();
  if (ms <= 0) return labels.ended;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days >= 1) return labels.days(days);
  if (hours >= 1) return labels.hours(hours);
  return labels.soon;
}

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const locale =
    language === "ar" ? "ar" : language === "en" ? "en-GB" : "fr-FR";
  const { user, token, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [portalBusy, setPortalBusy] = useState(false);

  const showPasswordForm = user?.can_change_password === true;

  const trialRemaining = useMemo(
    () =>
      formatTrialRemaining(user?.trial_ends_at, {
        ended: t("profileTrialEnded"),
        days: (n) => t("profileTrialDays").replace("{n}", String(n)),
        hours: (n) => t("profileTrialHours").replace("{n}", String(n)),
        soon: t("profileTrialSoon"),
      }),
    [user?.trial_ends_at, t],
  );

  const trialDateLabel = useMemo(() => {
    if (!user?.trial_ends_at) return null;
    try {
      return new Date(user.trial_ends_at).toLocaleString(locale);
    } catch {
      return user.trial_ends_at;
    }
  }, [user?.trial_ends_at, locale]);

  const isTrialing =
    user?.subscription_status === "trialing" ||
    (!user?.subscription_plan && Boolean(user?.trial_ends_at));

  const handleSaveName = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setNameBusy(true);
    setNameError(null);
    setNameStatus(null);
    try {
      await updateProfile(token, name.trim());
      await refreshUser();
      setNameStatus(t("profileNameSaved"));
    } catch (err) {
      setNameError(err instanceof Error ? err.message : t("profileSaveError"));
    } finally {
      setNameBusy(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setPasswordError(null);
    setPasswordStatus(null);
    if (newPassword.length < 8) {
      setPasswordError(t("profilePasswordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("profilePasswordMismatch"));
      return;
    }
    setPasswordBusy(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus(t("profilePasswordSaved"));
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : t("profileSaveError"),
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!token) {
      navigate("/billing");
      return;
    }
    setPortalBusy(true);
    try {
      const url = await openBillingPortal(token);
      window.location.href = url;
    } catch {
      // No Stripe customer yet — fall back to plan picker.
      navigate("/billing");
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <div className="app-page">
      <header className="sticky top-0 z-20 border-b border-outline-variant/40 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {t("brandName")}
            </p>
            <h1 className="text-xl font-extrabold text-on-surface">
              {t("profileTitle")}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher variant="nav" />
            <Link to="/dashboard" className="app-btn-ghost text-xs">
              {t("profileBackDashboard")}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="app-btn-ghost text-xs"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        <section className="app-card p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            {t("profileAccount")}
          </h2>
          <p className="app-muted mt-1 text-sm">{user?.email}</p>
          {user?.auth_provider === "google" ? (
            <p className="mt-2 text-xs font-medium text-secondary">
              {t("profileGoogleAccount")}
            </p>
          ) : null}

          <form
            onSubmit={(e) => void handleSaveName(e)}
            className="mt-4 space-y-3"
          >
            <label className="app-label">
              {t("profileName")}
              <input
                className="app-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            {nameError ? (
              <p className="text-sm text-red-600">{nameError}</p>
            ) : null}
            {nameStatus ? (
              <p className="text-sm text-secondary">{nameStatus}</p>
            ) : null}
            <button type="submit" className="app-btn-navy" disabled={nameBusy}>
              {nameBusy ? t("authLoading") : t("profileSaveName")}
            </button>
          </form>

          {showPasswordForm ? (
            <form
              onSubmit={(e) => void handleChangePassword(e)}
              className="mt-8 space-y-3 border-t border-outline-variant/50 pt-6"
            >
              <h3 className="text-sm font-bold text-on-surface">
                {t("profilePasswordTitle")}
              </h3>
              <PasswordField
                label={t("profileCurrentPassword")}
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
                required
              />
              <PasswordField
                label={t("profileNewPassword")}
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                required
              />
              <PasswordField
                label={t("profileConfirmPassword")}
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                required
              />
              {passwordError ? (
                <p className="text-sm text-red-600">{passwordError}</p>
              ) : null}
              {passwordStatus ? (
                <p className="text-sm text-secondary">{passwordStatus}</p>
              ) : null}
              <button
                type="submit"
                className="app-btn-navy"
                disabled={passwordBusy}
              >
                {passwordBusy ? t("authLoading") : t("profileSavePassword")}
              </button>
            </form>
          ) : (
            <p className="mt-6 border-t border-outline-variant/50 pt-6 text-sm text-on-surface-variant">
              {t("profilePasswordGoogleOnly")}
            </p>
          )}
        </section>

        <section className="app-card p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            {t("profileSubscription")}
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="text-on-surface-variant">
                {t("billingCurrentPlan")}:{" "}
              </span>
              <span className="font-semibold text-on-surface">
                {user?.subscription_plan ||
                  (isTrialing ? t("profilePlanTrial") : t("profilePlanNone"))}
              </span>
            </p>
            <p>
              <span className="text-on-surface-variant">
                {t("profileStatus")}:{" "}
              </span>
              <span className="font-semibold text-on-surface">
                {user?.subscription_status || "none"}
              </span>
            </p>
            {isTrialing ? (
              <div className="rounded-xl border border-tertiary/30 bg-tertiary-container/40 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-on-tertiary-fixed">
                  {t("profileTrialRemaining")}
                </p>
                <p className="mt-1 text-lg font-extrabold text-on-surface">
                  {trialRemaining}
                </p>
                {trialDateLabel ? (
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {t("billingTrialActive")} {trialDateLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleManageSubscription()}
              className="app-btn-orange px-4 py-2 text-xs"
              disabled={portalBusy}
            >
              {portalBusy ? t("authLoading") : t("billingManage")}
            </button>
            <Link to="/billing" className="app-btn-ghost text-xs">
              {t("profileViewPlans")}
            </Link>
          </div>
        </section>

        <section className="app-card p-5 sm:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            {t("profileAppQrTitle")}
          </h2>
          <p className="app-muted mt-1 text-sm">{t("profileAppQrHint")}</p>
          <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-3">
              {apkDownloadUrl ? (
                <QRCodeSVG value={apkDownloadUrl} size={148} includeMargin />
              ) : (
                <div className="px-3 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">
                    qr_code_2
                  </span>
                  <p className="mt-2 text-xs font-medium text-on-surface-variant">
                    {t("profileAppQrPlaceholder")}
                  </p>
                </div>
              )}
            </div>
            <div className="flex-1 text-sm text-on-surface-variant">
              <p>{t("profileAppQrSupport")}</p>
              {apkDownloadUrl ? (
                <a
                  href={apkDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="app-link mt-3 inline-block break-all text-xs"
                >
                  Manual Download Link
                </a>
              ) : (
                <p className="mt-3 text-xs">{t("profileAppQrConfigHint")}</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
