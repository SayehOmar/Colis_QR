import { GoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { googleClientId } from "../config";
import { useLanguage } from "../i18n/LanguageContext";

interface GoogleAuthButtonProps {
  onIdToken: (idToken: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
}

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.8-5.3l-6.4-5.2C29.3 35.2 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l.1.1 6.4 5.2C39.2 37.1 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  onIdToken,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const { t } = useLanguage();
  // Defer GIS button mount so React remounts don't spam initialize()
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3 border-t border-outline-variant/60 pt-4">
      <p className="text-center text-xs text-on-surface-variant">{t("orContinueWith")}</p>

      {!googleClientId ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onError(t("googleNotConfigured"))}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
        >
          <GoogleMark />
          {t("googleSignIn")}
        </button>
      ) : ready ? (
        <div
          className={`flex justify-center ${disabled ? "pointer-events-none opacity-60" : ""}`}
        >
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) {
                onError(t("authError"));
                return;
              }
              try {
                await onIdToken(credentialResponse.credential);
              } catch (err) {
                onError(err instanceof Error ? err.message : t("authError"));
              }
            }}
            onError={() => onError(t("authError"))}
            useOneTap={false}
            theme="outline"
            shape="rectangular"
            size="large"
            text="continue_with"
            width="320"
          />
        </div>
      ) : (
        <div className="h-10" />
      )}
    </div>
  );
}
