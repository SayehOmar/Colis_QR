import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  postAuthPath,
  readStoredToken,
  resendVerification,
  verifyEmail,
} from "../auth/api";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { useLanguage } from "../i18n/LanguageContext";

export default function VerifyEmailPage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);

  useEffect(() => {
    const token = params.get("token");
    if (!token) return;
    let cancelled = false;
    setStatus("working");
    void (async () => {
      try {
        await verifyEmail(token);
        if (cancelled) return;
        setStatus("ok");
        setMessage(t("verifyEmailSuccess"));
        await refreshUser();
        navigate("/dashboard", { replace: true });
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : t("verifyEmailFailed"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, navigate, refreshUser, t]);

  useEffect(() => {
    if (user?.email_verified) {
      navigate(postAuthPath(user), { replace: true });
    }
  }, [user, navigate]);

  const handleResend = async (event: FormEvent) => {
    event.preventDefault();
    const token = readStoredToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setResendBusy(true);
    setMessage(null);
    try {
      await resendVerification(token);
      setMessage(t("verifyEmailResent"));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t("verifyEmailFailed"));
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="app-page">
      <PageSeo
        title={t("verifyEmailTitle")}
        description={t("verifyEmailSupport")}
        path="/verify-email"
        noindex
      />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher variant="light" />
        </div>
        <p className="text-center text-sm font-extrabold text-primary">
          <Link to="/" className="hover:underline">
            {t("brandName")}
          </Link>
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-on-surface">
          {t("verifyEmailTitle")}
        </h1>
        <p className="app-muted mt-2 text-center text-sm">
          {t("verifyEmailSupport")}
        </p>
        {user?.email ? (
          <p className="mt-3 text-center text-sm font-semibold text-on-surface">
            {user.email}
          </p>
        ) : null}

        {status === "working" ? (
          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {t("authLoading")}
          </p>
        ) : null}
        {message ? (
          <p
            className={`mt-6 rounded-lg px-3 py-2 text-center text-sm ${
              status === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {message}
          </p>
        ) : null}

        <form onSubmit={(event) => void handleResend(event)} className="mt-8 space-y-3">
          <button
            type="submit"
            disabled={resendBusy || !user}
            className="app-btn-navy w-full"
          >
            {resendBusy ? t("authLoading") : t("verifyEmailResend")}
          </button>
          <Link to="/login" className="app-btn-ghost block w-full text-center">
            {t("operationsLogin")}
          </Link>
        </form>
      </div>
    </div>
  );
}
