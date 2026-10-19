import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  markWelcomeTrustSeen,
  shouldShowWelcomeTrust,
  WELCOME_CONTACT,
} from "../auth/welcomeTrust";
import { useLanguage } from "../i18n/LanguageContext";

export function WelcomeTrustModal() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setOpen(false);
      return;
    }
    setOpen(shouldShowWelcomeTrust(user));
  }, [user, loading]);

  if (!open || !user) return null;

  const dismiss = () => {
    markWelcomeTrustSeen(user.id);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-trust-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface shadow-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,_rgba(0,168,168,0.18),_transparent_70%)]"
        />
        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">
            CrossMed
          </p>
          <h2
            id="welcome-trust-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-on-surface"
          >
            {t("welcomeTrustTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            {t("welcomeTrustBody")}
          </p>

          <div className="mt-5 rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              {t("welcomeTrustGiftLabel")}
            </p>
            <p className="mt-1 text-sm font-semibold text-on-surface">
              {t("welcomeTrustGift")}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {t("welcomeTrustExtend")}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              {t("welcomeTrustContact")}
            </p>
            <a
              href={`mailto:${WELCOME_CONTACT.email}`}
              className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface transition hover:border-secondary"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                mail
              </span>
              {WELCOME_CONTACT.email}
            </a>
            {WELCOME_CONTACT.whatsapps.map((wa) => (
              <a
                key={wa.href}
                href={wa.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface transition hover:border-secondary"
              >
                <span className="material-symbols-outlined text-[18px] text-green-600">
                  chat
                </span>
                {t("landingContactWhatsApp")} · {wa.region} · {wa.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="app-btn-navy mt-6 w-full"
          >
            {t("welcomeTrustContinue")}
          </button>
        </div>
      </div>
    </div>
  );
}
