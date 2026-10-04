import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { postAuthPath } from "../auth/api";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { PasswordField } from "../components/PasswordField";
import { isAuthBypassIdentity } from "../config";
import { useLanguage } from "../i18n/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();
  const { user, loading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showSkeleton = usePageSkeleton(!loading, 400);
  const requestedFrom =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bypass = isAuthBypassIdentity(email);

  if (showSkeleton) {
    return <PageSkeleton variant="auth" />;
  }

  if (!loading && user) {
    const rolePath = postAuthPath(user);
    const dest =
      rolePath === "/choose-role" || rolePath === "/verify-email"
        ? rolePath
        : requestedFrom &&
            requestedFrom !== "/billing" &&
            requestedFrom !== "/choose-role"
          ? requestedFrom
          : rolePath;
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const nextUser = await login(email.trim(), bypass ? "" : password);
      navigate(postAuthPath(nextUser), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (idToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const nextUser = await loginWithGoogle({ idToken });
      navigate(postAuthPath(nextUser), { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <PageSeo
        title={t("seoLoginTitle")}
        description={t("seoLoginDescription")}
        path="/login"
      />
      <div className="mx-auto max-w-md px-4 py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t("breadcrumbLogin") },
          ]}
        />
        <header className="mb-4 text-center">
          <p className="text-sm font-extrabold tracking-tight text-primary">
            <Link to="/" className="hover:underline">
              {t("brandName")}
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold text-on-surface">{t("loginTitle")}</h1>
          <p className="app-muted mt-2 text-sm">{t("loginSubtitle")}</p>
        </header>

        <div className="mb-2 flex items-center justify-center gap-2">
          <LanguageSwitcher variant="light" />
        </div>

        <form onSubmit={handleSubmit} className="app-card mt-4 space-y-4 p-6">
          <label className="app-label">
            {t("email")}
            <input
              required
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="app-input"
            />
          </label>
          {!bypass && (
            <PasswordField
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="app-btn-navy w-full">
            {submitting ? t("authLoading") : t("loginButton")}
          </button>

          <GoogleAuthButton
            disabled={submitting}
            onIdToken={handleGoogle}
            onError={setError}
          />

          <p className="app-muted text-center text-sm">
            {t("noAccount")}{" "}
            <Link to="/signup" className="app-link">
              {t("signupButton")}
            </Link>
          </p>
          <p className="text-center text-sm">
            <Link to="/" className="app-muted hover:text-on-surface hover:underline">
              {t("backToHome")}
            </Link>
            {" · "}
            <Link to="/start" className="app-muted hover:text-on-surface hover:underline">
              {t("breadcrumbStart")}
            </Link>
            {" · "}
            <Link to="/client" className="app-muted hover:text-on-surface hover:underline">
              {t("landingCtaClient")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
