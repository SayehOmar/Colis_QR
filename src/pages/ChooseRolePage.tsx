import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { becomeEmployer, joinEmployer, postAuthPath } from "../auth/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { JoinEmployerCode } from "../components/JoinEmployerCode";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { useLanguage } from "../i18n/LanguageContext";

type Step = "pick" | "worker-code";

export default function ChooseRolePage() {
  const { t } = useLanguage();
  const { user, token, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const showSkeleton = usePageSkeleton(!loading, 400);
  const [step, setStep] = useState<Step>("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (showSkeleton) {
    return <PageSkeleton variant="auth" />;
  }

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user?.email_verification_required &&
    user.email_verified === false
  ) {
    return <Navigate to="/verify-email" replace />;
  }

  if (user?.account_role === "employer" || user?.account_role === "employee") {
    return <Navigate to={postAuthPath(user)} replace />;
  }

  const handleBecomeOwner = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const result = await becomeEmployer(token);
      await refreshUser();
      navigate(postAuthPath(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chooseRoleError"));
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (code: string) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const result = await joinEmployer(token, code);
      await refreshUser();
      navigate(postAuthPath(result.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("joinCodeError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-page">
      <PageSeo
        title={t("seoChooseRoleTitle")}
        description={t("seoChooseRoleDescription")}
        path="/choose-role"
        noindex
      />
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t("breadcrumbChooseRole") },
          ]}
        />

        <header className="mb-2 text-center">
          <p className="text-sm font-extrabold tracking-tight text-primary">
            <Link to="/" className="hover:underline">
              {t("brandName")}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">
            {step === "pick" ? t("chooseAccountRoleTitle") : t("joinCodeTitle")}
          </h1>
          <p className="app-muted mt-2">
            {step === "pick"
              ? t("chooseAccountRoleSubtitle")
              : t("joinCodeHint")}
          </p>
        </header>

        <LanguageSwitcher variant="light" />

        {step === "pick" ? (
          <div className="mt-6 grid gap-4">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleBecomeOwner()}
              className="app-card border-2 border-primary px-6 py-8 text-center transition hover:bg-surface-container-low disabled:opacity-60"
            >
              <span className="block text-xl font-semibold text-primary">
                {t("chooseRoleOwner")}
              </span>
              <span className="app-muted mt-2 block text-sm">
                {t("chooseRoleOwnerHint")}
              </span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError(null);
                setStep("worker-code");
              }}
              className="app-card px-6 py-8 text-center transition hover:border-tertiary/50 disabled:opacity-60"
            >
              <span className="block text-xl font-semibold text-tertiary">
                {t("chooseRoleWorker")}
              </span>
              <span className="app-muted mt-2 block text-sm">
                {t("chooseRoleWorkerHint")}
              </span>
            </button>

            {error ? (
              <p className="text-center text-sm text-red-600">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="app-card mt-6 p-5 sm:p-6">
            <JoinEmployerCode
              onSubmit={handleJoin}
              submitting={busy}
              error={error}
            />
            <button
              type="button"
              className="app-btn-ghost mt-4 w-full text-xs"
              disabled={busy}
              onClick={() => {
                setError(null);
                setStep("pick");
              }}
            >
              {t("chooseRoleBack")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
