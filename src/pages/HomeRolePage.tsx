import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
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
      <PageSeo
        title={t("seoStartTitle")}
        description={t("seoStartDescription")}
        path="/start"
      />
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t("breadcrumbStart") },
          ]}
        />

        <header className="mb-2 text-center">
          <p className="text-sm font-extrabold tracking-tight text-primary">
            <Link to="/" className="hover:underline">
              {t("brandName")}
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">
            {t("roleChoiceTitle")}
          </h1>
          <p className="app-muted mt-2">{t("roleChoiceSubtitle")}</p>
        </header>

        <LanguageSwitcher variant="light" />

        <div className="mt-4 grid gap-4">
          <Link
            to="/client"
            className="app-card px-6 py-8 text-center transition hover:border-tertiary/50"
          >
            <span className="block text-xl font-semibold text-tertiary">
              {t("roleClient")}
            </span>
            <span className="app-muted mt-2 block text-sm">
              {t("roleClientHint")}
            </span>
          </Link>

          <Link
            to="/login"
            className="app-card border-2 border-primary px-6 py-8 text-center transition hover:bg-surface-container-low"
          >
            <span className="block text-xl font-semibold text-primary">
              {t("roleTransporteur")}
            </span>
            <span className="app-muted mt-2 block text-sm">
              {t("roleTransporteurHint")}
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="app-muted hover:text-on-surface hover:underline">
            {t("backToHome")}
          </Link>
          {" · "}
          <Link to="/signup" className="app-link">
            {t("signupButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
