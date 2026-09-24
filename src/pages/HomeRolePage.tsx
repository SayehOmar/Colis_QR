import { Link } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSkeleton, usePageSkeleton } from "../components/PageSkeleton";
import { useLanguage } from "../i18n/LanguageContext";

export default function HomeRolePage() {
  const { t } = useLanguage();
  const showSkeleton = usePageSkeleton(true, 400);

  if (showSkeleton) {
    return <PageSkeleton variant="auth" />;
  }

  return (
    <div className="app-page">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <header className="mb-2 text-center">
          <p className="text-sm font-extrabold tracking-tight text-primary">{t("brandName")}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">
            {t("title")}
          </h1>
          <p className="app-muted mt-2">{t("roleChoiceSubtitle")}</p>
        </header>

        <LanguageSwitcher variant="light" />

        <div className="mt-4 grid gap-4">
          <Link
            to="/client"
            className="app-card px-6 py-8 text-center transition hover:border-tertiary/50"
          >
            <span className="block text-xl font-semibold text-tertiary">{t("roleClient")}</span>
            <span className="app-muted mt-2 block text-sm">{t("roleClientHint")}</span>
          </Link>

          <Link
            to="/login"
            className="app-card border-2 border-primary px-6 py-8 text-center transition hover:bg-surface-container-low"
          >
            <span className="block text-xl font-semibold text-primary">
              {t("roleTransporteur")}
            </span>
            <span className="app-muted mt-2 block text-sm">{t("roleTransporteurHint")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
