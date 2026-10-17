import { Link } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

type LegalKind = "terms" | "privacy" | "refund";

const CONFIG: Record<
  LegalKind,
  {
    path: string;
    titleKey: TranslationKey;
    introKey: TranslationKey;
    seoTitleKey: TranslationKey;
    seoDescriptionKey: TranslationKey;
    breadcrumbKey: TranslationKey;
    sections: { title: TranslationKey; body: TranslationKey }[];
  }
> = {
  terms: {
    path: "/terms",
    titleKey: "legalTermsTitle",
    introKey: "legalTermsIntro",
    seoTitleKey: "seoTermsTitle",
    seoDescriptionKey: "seoTermsDescription",
    breadcrumbKey: "breadcrumbTerms",
    sections: [
      { title: "legalTermsS1Title", body: "legalTermsS1Body" },
      { title: "legalTermsS2Title", body: "legalTermsS2Body" },
      { title: "legalTermsS3Title", body: "legalTermsS3Body" },
      { title: "legalTermsS4Title", body: "legalTermsS4Body" },
      { title: "legalTermsS5Title", body: "legalTermsS5Body" },
      { title: "legalTermsS6Title", body: "legalTermsS6Body" },
    ],
  },
  privacy: {
    path: "/privacy",
    titleKey: "legalPrivacyTitle",
    introKey: "legalPrivacyIntro",
    seoTitleKey: "seoPrivacyTitle",
    seoDescriptionKey: "seoPrivacyDescription",
    breadcrumbKey: "breadcrumbPrivacy",
    sections: [
      { title: "legalPrivacyS1Title", body: "legalPrivacyS1Body" },
      { title: "legalPrivacyS2Title", body: "legalPrivacyS2Body" },
      { title: "legalPrivacyS3Title", body: "legalPrivacyS3Body" },
      { title: "legalPrivacyS4Title", body: "legalPrivacyS4Body" },
      { title: "legalPrivacyS5Title", body: "legalPrivacyS5Body" },
      { title: "legalPrivacyS6Title", body: "legalPrivacyS6Body" },
    ],
  },
  refund: {
    path: "/refund",
    titleKey: "legalRefundTitle",
    introKey: "legalRefundIntro",
    seoTitleKey: "seoRefundTitle",
    seoDescriptionKey: "seoRefundDescription",
    breadcrumbKey: "breadcrumbRefund",
    sections: [
      { title: "legalRefundS1Title", body: "legalRefundS1Body" },
      { title: "legalRefundS2Title", body: "legalRefundS2Body" },
      { title: "legalRefundS3Title", body: "legalRefundS3Body" },
      { title: "legalRefundS4Title", body: "legalRefundS4Body" },
      { title: "legalRefundS5Title", body: "legalRefundS5Body" },
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const { t } = useLanguage();
  const config = CONFIG[kind];

  return (
    <div className="landing-page min-h-screen bg-surface font-sans text-on-surface antialiased">
      <PageSeo
        title={t(config.seoTitleKey)}
        description={t(config.seoDescriptionKey)}
        path={config.path}
      />

      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[900px] items-center gap-3 px-4 sm:h-16 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={t("brandName")}
          >
            <img
              src="/logo.svg"
              alt={t("brandName")}
              className="h-9 w-9 rounded-lg object-cover shadow-sm"
            />
            <span className="text-base font-extrabold tracking-tight text-primary">
              {t("brandName")}
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="nav" />
            <Link
              to="/"
              className="hidden text-sm font-medium text-on-surface-variant transition hover:text-on-surface sm:inline"
            >
              {t("breadcrumbHome")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumbs
          className="mb-5"
          items={[
            { label: t("breadcrumbHome"), to: "/" },
            { label: t(config.breadcrumbKey) },
          ]}
        />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
          {t("brandName")}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          {t(config.titleKey)}
        </h1>
        <p className="mt-2 text-xs text-on-surface-variant">{t("legalUpdated")}</p>
        <p className="mt-5 text-base leading-relaxed text-on-surface-variant">
          {t(config.introKey)}
        </p>

        <div className="mt-8 space-y-7">
          {config.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-on-surface">
                {t(section.title)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant sm:text-base">
                {t(section.body)}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-on-surface-variant">
          {t("legalContactHint")}
        </p>

        <nav className="mt-8 flex flex-wrap gap-4 border-t border-outline-variant/50 pt-6 text-sm font-medium text-on-surface-variant">
          <Link to="/terms" className="hover:text-on-surface">
            {t("navTerms")}
          </Link>
          <Link to="/privacy" className="hover:text-on-surface">
            {t("navPrivacy")}
          </Link>
          <Link to="/refund" className="hover:text-on-surface">
            {t("navRefund")}
          </Link>
        </nav>
      </main>
    </div>
  );
}
