import { Turnstile } from "@marsidev/react-turnstile";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { postAuthPath } from "../auth/api";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { PasswordField } from "../components/PasswordField";
import { isAuthBypassIdentity } from "../config";
import { useLanguage } from "../i18n/LanguageContext";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";
const TURNSTILE_ENABLED =
  (import.meta.env.VITE_TURNSTILE_ENABLED ?? "false").toLowerCase() === "true";

export default function SignupPage() {
  const { t } = useLanguage();
  const { user, loading, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const showSkeleton = usePageSkeleton(!loading, 400);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bypass = isAuthBypassIdentity(email);

  if (showSkeleton) {
    return <PageSkeleton variant="auth" />;
  }

  if (!loading && user) {
    return <Navigate to={postAuthPath(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!bypass && TURNSTILE_ENABLED) {
      if (!TURNSTILE_SITE_KEY) {
        setError(t("turnstileMissing"));
        return;
      }
      if (!turnstileToken) {
        setError(t("turnstileRequired"));
        return;
      }
    }

    setSubmitting(true);
    try {
      const nextUser = await register(
        email.trim(),
        bypass ? "" : password,
        name.trim() || undefined,
        bypass ? undefined : turnstileToken ?? undefined
      );
      navigate(postAuthPath(nextUser), { replace: true });
    } catch (err) {
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
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
      <div className="mx-auto max-w-md px-4 py-10">
        <header className="mb-4 text-center">
          <p className="text-sm font-extrabold tracking-tight text-primary">{t("brandName")}</p>
          <h1 className="mt-2 text-2xl font-bold text-on-surface">{t("signupTitle")}</h1>
          <p className="app-muted mt-2 text-sm">{t("signupSubtitle")}</p>
        </header>

        <div className="mb-2 flex items-center justify-center gap-2">
          <LanguageSwitcher variant="light" />
        </div>

        <form onSubmit={handleSubmit} className="app-card mt-4 space-y-4 p-6">
          {!bypass && (
            <label className="app-label">
              {t("nameOptional")}
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="app-input"
              />
            </label>
          )}
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
              autoComplete="new-password"
              minLength={8}
            />
          )}

          {!bypass && TURNSTILE_ENABLED ? (
            <div className="flex justify-center py-1">
              {TURNSTILE_SITE_KEY ? (
                <Turnstile
                  key={turnstileKey}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken(null)}
                  options={{ theme: "light", action: "signup" }}
                />
              ) : (
                <p className="text-sm text-red-700">{t("turnstileMissing")}</p>
              )}
            </div>
          ) : null}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              (!bypass && TURNSTILE_ENABLED && !turnstileToken && Boolean(TURNSTILE_SITE_KEY))
            }
            className="app-btn-navy w-full"
          >
            {submitting ? t("authLoading") : t("signupButton")}
          </button>

          <GoogleAuthButton
            disabled={submitting}
            onIdToken={handleGoogle}
            onError={setError}
          />

          <p className="app-muted text-center text-sm">
            {t("hasAccount")}{" "}
            <Link to="/login" className="app-link">
              {t("loginButton")}
            </Link>
          </p>
          <p className="text-center text-sm">
            <Link to="/" className="app-muted hover:text-on-surface hover:underline">
              {t("backToHome")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
