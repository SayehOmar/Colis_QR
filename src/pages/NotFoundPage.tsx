import { Link, useLocation } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();
  const location = useLocation();

  return (
    <div className="app-page">
      <PageSeo
        title={t("seoNotFoundTitle")}
        description={t("seoNotFoundDescription")}
        path={location.pathname || "/404"}
        noindex
      />

      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12">
        <Breadcrumbs
          className="mb-6 justify-center sm:justify-start"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t("breadcrumbNotFound") },
          ]}
        />

        <div className="mb-4 flex justify-center sm:justify-start">
          <LanguageSwitcher variant="light" />
        </div>

        <p className="text-sm font-extrabold tracking-tight text-primary">
          {t("brandName")}
        </p>
        <p className="mt-3 text-6xl font-extrabold tracking-tight text-tertiary">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-on-surface">
          {t("notFoundTitle")}
        </h1>
        <p className="app-muted mt-3 text-sm leading-relaxed">
          {t("notFoundBody")}
        </p>

        <div className="mt-8 grid gap-3">
          <Link to="/" className="app-btn-navy text-center">
            {t("notFoundHome")}
          </Link>
          <Link to="/client" className="app-btn-orange text-center">
            {t("landingCtaClient")}
          </Link>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link to="/login" className="app-link">
              {t("operationsLogin")}
            </Link>
            <Link to="/signup" className="app-link">
              {t("signupButton")}
            </Link>
            <Link to="/#pricing" className="app-link">
              {t("landingNavPricing")}
            </Link>
            <Link to="/#how-it-works" className="app-link">
              {t("landingNavHow")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
