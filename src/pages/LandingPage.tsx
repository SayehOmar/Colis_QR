import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../i18n/LanguageContext";
import type { TranslationKey } from "../i18n/translations";

const STEPS: {
  title: TranslationKey;
  body: TranslationKey;
  foot: TranslationKey;
  icon: string;
  iconClass: string;
  footClass: string;
}[] = [
  {
    title: "landingStep1Title",
    body: "landingStep1Body",
    foot: "landingStep1Foot",
    icon: "edit_document",
    iconClass: "text-sky-600",
    footClass: "text-sky-600",
  },
  {
    title: "landingStep2Title",
    body: "landingStep2Body",
    foot: "landingStep2Foot",
    icon: "qr_code_2",
    iconClass: "text-tertiary",
    footClass: "text-tertiary",
  },
  {
    title: "landingStep3Title",
    body: "landingStep3Body",
    foot: "landingStep3Foot",
    icon: "phone_iphone",
    iconClass: "text-green-600",
    footClass: "text-green-600",
  },
  {
    title: "landingStep4Title",
    body: "landingStep4Body",
    foot: "landingStep4Foot",
    icon: "speed",
    iconClass: "text-primary",
    footClass: "text-primary",
  },
];

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

export default function LandingPage() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="landing-page bg-surface font-sans text-on-surface antialiased selection:bg-tertiary/15 selection:text-tertiary">
      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2"
            aria-label={t("brandName")}
          >
            <img
              src="/logo.svg"
              alt={t("brandName")}
              className="h-9 w-9 rounded-lg object-cover shadow-sm sm:h-10 sm:w-10"
            />
            <span className="hidden whitespace-nowrap text-base font-extrabold tracking-tight text-primary sm:inline sm:text-lg">
              {t("brandName")}
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-evenly gap-3 text-sm font-medium text-on-surface-variant xl:flex">
            <a
              className="whitespace-nowrap transition-colors hover:text-on-surface"
              href="#how-it-works"
            >
              {t("landingNavHow")}
            </a>
            <a
              className="whitespace-nowrap transition-colors hover:text-on-surface"
              href="#suite"
            >
              {t("landingNavSuite")}
            </a>
            <a
              className="whitespace-nowrap transition-colors hover:text-on-surface"
              href="#who-is-it-for"
            >
              {t("landingNavWho")}
            </a>
            <a
              className="whitespace-nowrap transition-colors hover:text-on-surface"
              href="#pricing"
            >
              {t("landingNavPricing")}
            </a>
            <Link
              to="/login"
              className="whitespace-nowrap transition-colors hover:text-on-surface"
            >
              {t("operationsLogin")}
            </Link>
          </nav>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher variant="nav" />
            <Link
              to="/client"
              className="hidden whitespace-nowrap items-center justify-center rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface transition-all hover:bg-surface-container-low lg:inline-flex"
            >
              {t("landingCtaClient")}
            </Link>
            <Link
              to="/signup"
              className="inline-flex max-w-[9.5rem] items-center justify-center truncate rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-on-primary shadow-sm transition-all hover:brightness-110 sm:max-w-none sm:px-3.5"
            >
              <span className="lg:hidden">{t("landingCtaCarrierShort")}</span>
              <span className="hidden lg:inline">{t("landingCtaCarrier")}</span>
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition hover:bg-surface-container-low xl:hidden"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={
                menuOpen ? t("landingMenuClose") : t("landingMenuOpen")
              }
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon
                name={menuOpen ? "close" : "menu"}
                className="text-[22px]"
              />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div
            id="landing-mobile-nav"
            className="border-t border-outline-variant/40 bg-surface px-3 py-3 sm:px-6 xl:hidden"
          >
            <nav className="mx-auto flex max-w-[1400px] flex-col gap-1 text-sm font-medium text-on-surface">
              <a
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"
                href="#how-it-works"
                onClick={closeMenu}
              >
                {t("landingNavHow")}
              </a>
              <a
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"
                href="#suite"
                onClick={closeMenu}
              >
                {t("landingNavSuite")}
              </a>
              <a
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"
                href="#who-is-it-for"
                onClick={closeMenu}
              >
                {t("landingNavWho")}
              </a>
              <a
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"
                href="#pricing"
                onClick={closeMenu}
              >
                {t("landingNavPricing")}
              </a>
              <Link
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low"
                to="/login"
                onClick={closeMenu}
              >
                {t("operationsLogin")}
              </Link>
              <Link
                className="rounded-lg px-3 py-2.5 hover:bg-surface-container-low lg:hidden"
                to="/client"
                onClick={closeMenu}
              >
                {t("landingCtaClient")}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="w-full">
        {/* HERO */}
        <section className="relative border-b border-outline-variant/30 bg-gradient-to-b from-surface via-surface-container-low/40 to-surface pb-14 pt-10 sm:pb-20 sm:pt-16">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <h1 className="landing-hero-copy text-3xl font-extrabold leading-[1.15] tracking-tight text-on-surface sm:text-5xl">
                {t("landingHeroTitle")}
                <br className="hidden sm:block" />{" "}
                <span className="text-on-surface">
                  {t("landingHeroReimagined")}{" "}
                </span>
                <span className="text-secondary">{t("landingHeroSmart")}</span>{" "}
                <span className="text-tertiary">{t("landingHeroQr")}</span>{" "}
                <span className="text-accent">{t("landingHeroLogistics")}</span>
              </h1>

              <p className="landing-hero-copy mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                {t("landingHeroSupport")}
              </p>

              <div className="landing-hero-copy mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant">
                <span className="flex items-center gap-1 font-bold text-secondary">
                  <Icon name="verified" className="text-[16px]" />
                  {t("landingSuiteLabel")}
                </span>
                <span>{t("landingSuiteItemApp")}</span>
                <span>•</span>
                <span>{t("landingSuiteItemDash")}</span>
                <span>•</span>
                <span>{t("landingSuiteItemDb")}</span>
              </div>

              <div className="landing-hero-cta mt-6 flex w-full max-w-xl flex-col items-stretch gap-3 lg:max-w-none lg:flex-row lg:justify-center">
                <Link
                  to="/client"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-6 py-3 text-sm font-bold text-on-tertiary shadow-md transition-all hover:brightness-95 lg:w-auto"
                >
                  <Icon name="description" className="text-[18px]" />
                  {t("landingCtaClientFull")}
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-md transition-all hover:brightness-110 lg:w-auto"
                >
                  <Icon
                    name="local_shipping"
                    className="text-[18px] text-on-primary"
                  />
                  {t("landingCtaCarrierTrial")}
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant sm:gap-10">
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon
                    name="verified_user"
                    className="text-[18px] text-green-600"
                  />
                  <span>{t("landingTrustOffline")}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon
                    name="qr_code_scanner"
                    className="text-[18px] text-secondary"
                  />
                  <span>{t("landingTrustQr")}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Icon name="star" className="text-[18px] text-tertiary" />
                  <span>{t("landingTrustRating")}</span>
                </div>
              </div>
            </div>

            {/* Hero banner image */}
            <div className="relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-outline-variant/60 shadow-md">
              <img
                src="/landing-hero.png"
                alt={t("landingBannerTitle")}
                className="h-[320px] w-full object-cover sm:h-[440px]"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-primary/90 via-primary/30 to-transparent p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div className="text-white">
                    <span className="mb-2 inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {t("landingBannerLive")}
                    </span>
                    <h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      {t("landingBannerTitle")}
                    </h3>
                    <p className="mt-1 max-w-xl text-xs text-slate-200 sm:text-sm">
                      {t("landingBannerBody")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-white backdrop-blur-md">
                    <div className="text-right rtl:text-left">
                      <span className="block text-[10px] font-medium text-slate-300">
                        {t("landingBannerStatLabel")}
                      </span>
                      <span className="text-base font-extrabold text-green-400">
                        {t("landingBannerStat")}
                      </span>
                    </div>
                    <Icon name="pallet" className="text-[24px] text-tertiary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tri-fold suite preview */}
            <div className="mx-auto mt-10 max-w-5xl">
              <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-12 lg:gap-5">
                <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm transition-all hover:border-secondary/40 md:col-span-4">
                  <div className="flex items-center justify-between border-b border-surface-container pb-3">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name="picture_as_pdf"
                        className="text-[18px] text-tertiary"
                      />
                      <span className="text-xs font-bold text-on-surface">
                        {t("landingMockPdfTitle")}
                      </span>
                    </div>
                    <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[10px] font-bold text-on-surface-variant">
                      FR-TN-9402
                    </span>
                  </div>
                  <div className="my-4 flex items-center gap-3 rounded-xl border border-dashed border-outline-variant/80 bg-surface-container-low/60 p-3">
                    <div className="flex-shrink-0 rounded-lg bg-surface-container-lowest p-1.5 shadow-sm">
                      <svg
                        className="h-16 w-16 text-primary"
                        fill="currentColor"
                        viewBox="0 0 100 100"
                        aria-hidden
                      >
                        <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M60,10 h10 v10 h-10 z M40,30 h20 v10 h-20 z M10,40 h10 v10 h-10 z M30,40 h10 v20 h-10 z M50,40 h20 v10 h-20 z M80,40 h10 v10 h-10 z M40,60 h10 v20 h-10 z M60,60 h20 v10 h-20 z M80,70 h20 v30 h-20 z M90,80 h10 v10 h-10 z M50,80 h10 v20 h-10 z" />
                      </svg>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 text-[11px] leading-tight">
                      <span className="truncate font-bold text-on-surface">
                        Shipper: Yassine K. (Lyon)
                      </span>
                      <span className="text-on-surface-variant">
                        Recipient: Sfax, TN
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded bg-tertiary-container px-1.5 py-0.5 text-[10px] font-bold text-on-tertiary-fixed">
                          40L Olive Oil
                        </span>
                        <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface">
                          2 Luggage
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Icon
                        name="check_circle"
                        className="text-[14px] text-green-600"
                      />
                      {t("landingMockPdfReady")}
                    </span>
                    <span className="font-semibold text-secondary">
                      {t("landingMockPdfAffix")}
                    </span>
                  </div>
                </div>

                <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-primary p-4 text-on-primary shadow-md md:col-span-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Icon
                        name="qr_code_scanner"
                        className="text-[18px] text-green-400"
                      />
                      <span className="text-xs font-bold text-surface-container-lowest">
                        {t("landingMockScanTitle")}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {t("landingMockScanOffline")}
                    </span>
                  </div>
                  <div className="my-4 flex flex-col gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">
                        Scanned: #FR-TN-9402
                      </span>
                      <span className="font-bold text-green-400">
                        1-Sec Match
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-slate-400">
                          Logged Weight
                        </span>
                        <span className="text-xs font-bold text-surface-container-lowest">
                          32.4 kg
                        </span>
                      </div>
                      <div className="rounded bg-slate-900/60 p-2">
                        <span className="block text-[10px] text-slate-400">
                          Applied Tariff
                        </span>
                        <span className="text-xs font-bold text-tertiary">
                          €75.00 COD
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1">
                      <Icon
                        name="wifi_off"
                        className="text-[14px] text-secondary"
                      />
                      {t("landingMockScanFerry")}
                    </span>
                    <span className="font-medium text-slate-400">
                      {t("landingMockScanSync")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm transition-all hover:border-secondary/40 md:col-span-4">
                  <div className="flex items-center justify-between border-b border-surface-container pb-3">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name="monitoring"
                        className="text-[18px] text-secondary"
                      />
                      <span className="text-xs font-bold text-on-surface">
                        {t("landingMockDashTitle")}
                      </span>
                    </div>
                    <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-secondary">
                      {t("landingMockDashSync")}
                    </span>
                  </div>
                  <div className="my-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-surface-container-low p-2">
                        <span className="block text-[10px] text-on-surface-variant">
                          Today&apos;s Parcels
                        </span>
                        <span className="text-sm font-extrabold text-on-surface">
                          148 Units
                        </span>
                      </div>
                      <div className="rounded-lg bg-surface-container-low p-2">
                        <span className="block text-[10px] text-on-surface-variant">
                          Total Olive Oil
                        </span>
                        <span className="text-sm font-extrabold text-tertiary">
                          380 Liters
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 rounded-lg bg-surface-container-low/70 p-2 text-[11px]">
                      <div className="flex justify-between text-on-surface">
                        <span className="max-w-[120px] truncate font-medium">
                          K. Benali (Marseille)
                        </span>
                        <span className="font-bold text-green-700">
                          Scanned (Van 2)
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-on-surface-variant">
                        <span>#TN-8831 • Tunis Dep.</span>
                        <span className="font-semibold">€45 Paid</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <Icon
                        name="search"
                        className="text-[14px] text-secondary"
                      />
                      {t("landingMockDashSearch")}
                    </span>
                    <span className="font-semibold text-on-surface">
                      {t("landingMockDashCloud")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-surface py-14 sm:py-20" id="how-it-works">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {t("landingHowTitle")}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                {t("landingHowSupport")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="landing-step flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm transition-colors hover:border-secondary/40"
                  style={{ animationDelay: `${0.08 + index * 0.1}s` }}
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-xs font-bold text-on-surface">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        name={step.icon}
                        className={`text-[20px] ${step.iconClass}`}
                      />
                    </div>
                    <h3 className="mb-2 text-base font-bold text-on-surface">
                      {t(step.title)}
                    </h3>
                    <p className="text-xs leading-relaxed text-on-surface-variant">
                      {t(step.body)}
                    </p>
                  </div>
                  <div
                    className={`mt-4 flex items-center gap-1 border-t border-surface-container pt-3 text-[11px] font-medium ${step.footClass}`}
                  >
                    <Icon
                      name={
                        index === 0
                          ? "bolt"
                          : index === 1
                            ? "print"
                            : index === 2
                              ? "wifi_off"
                              : "sync"
                      }
                      className="text-[14px]"
                    />
                    {t(step.foot)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* B2B SUITE */}
        <section
          className="border-y border-outline-variant/30 bg-surface-container-low/60 py-14 sm:py-20"
          id="suite"
        >
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                {t("landingSuiteEyebrow")}
              </span>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {t("landingSuiteTitle")}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {t("landingSuiteSupport")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {(
                [
                  {
                    icon: "phone_iphone",
                    iconWrap: "bg-secondary-container text-secondary",
                    title: "landingSuiteMobileTitle" as const,
                    body: "landingSuiteMobileBody" as const,
                    features: [
                      "landingSuiteMobileF1",
                      "landingSuiteMobileF2",
                      "landingSuiteMobileF3",
                    ] as const,
                  },
                  {
                    icon: "dashboard",
                    iconWrap: "bg-tertiary-container text-tertiary",
                    title: "landingSuiteDashTitle" as const,
                    body: "landingSuiteDashBody" as const,
                    features: [
                      "landingSuiteDashF1",
                      "landingSuiteDashF2",
                      "landingSuiteDashF3",
                    ] as const,
                  },
                  {
                    icon: "database",
                    iconWrap: "bg-primary text-on-primary",
                    title: "landingSuiteDbTitle" as const,
                    body: "landingSuiteDbBody" as const,
                    features: [
                      "landingSuiteDbF1",
                      "landingSuiteDbF2",
                      "landingSuiteDbF3",
                    ] as const,
                  },
                ] as const
              ).map((card) => (
                <div
                  key={card.title}
                  className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm"
                >
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconWrap}`}
                      >
                        <Icon name={card.icon} className="text-[22px]" />
                      </div>
                      <h3 className="text-lg font-bold leading-snug text-on-surface">
                        {t(card.title)}
                      </h3>
                    </div>
                    <p className="mb-4 text-xs leading-relaxed text-on-surface-variant">
                      {t(card.body)}
                    </p>
                  </div>
                  <ul className="space-y-2 border-t border-surface-container pt-4 text-xs font-medium text-on-surface">
                    {card.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Icon
                          name="check"
                          className="text-[16px] text-green-600"
                        />
                        {t(feature)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IS IT FOR */}
        <section className="bg-surface py-14 sm:py-20" id="who-is-it-for">
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {t("landingWhoTitle")}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                {t("landingWhoSupport")}
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("landingForSenders")}
                    </span>
                    <Icon
                      name="person"
                      className="text-[24px] text-secondary"
                    />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-on-surface">
                    {t("roleClient")}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                    {t("landingClientBody")}
                  </p>
                </div>
                <Link
                  to="/client"
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-low px-5 py-2.5 text-xs font-bold text-on-surface transition-all hover:bg-surface-container"
                >
                  {t("landingCtaClient")} →
                </Link>
              </div>

              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-primary bg-surface-container-lowest p-6 shadow-md sm:p-8">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-bold uppercase tracking-wider text-tertiary">
                      {t("landingForTransporters")}
                    </span>
                    <Icon
                      name="local_shipping"
                      className="text-[24px] text-primary"
                    />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-on-surface">
                    {t("roleTransporteur")}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                    {t("landingCarrierBody")}
                  </p>
                </div>
                <Link
                  to="/signup"
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-on-primary shadow-sm transition-all hover:brightness-110"
                >
                  {t("landingCtaCarrier")} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          className="border-t border-outline-variant/30 bg-surface-container-low/60 py-14 sm:py-20"
          id="pricing"
        >
          <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
                {t("landingPricingTitle")}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                {t("landingPricingSupport")}
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-3">
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
                <div>
                  <span className="text-sm font-bold text-on-surface">
                    {t("billingPlanMonthly")}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-on-surface">
                      €20
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {" "}
                      {t("billingPerMonth")}
                    </span>
                  </div>
                  <ul className="mb-6 space-y-2 text-xs text-on-surface-variant">
                    {(
                      [
                        "landingPriceF1",
                        "landingPriceF2",
                        "landingPriceF3",
                      ] as const
                    ).map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        <Icon
                          name="check"
                          className="text-[16px] text-green-600"
                        />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full rounded-xl border border-outline-variant/80 bg-surface-container-low px-4 py-2.5 text-center text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
                >
                  {t("landingCtaTrial")}
                </Link>
              </div>

              <div className="relative flex flex-col justify-between rounded-2xl border-2 border-secondary bg-surface-container-lowest p-6 shadow-md">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-on-secondary">
                  {t("landingPricingPopular")}
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface">
                    {t("billingPlanQuarterly")}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-on-surface">
                      €52
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {" "}
                      {t("billingPerQuarter")}
                    </span>
                  </div>
                  <ul className="mb-6 space-y-2 text-xs text-on-surface-variant">
                    {(
                      [
                        "landingPriceF4",
                        "landingPriceF5",
                        "landingPriceF6",
                      ] as const
                    ).map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        <Icon
                          name="check"
                          className="text-[16px] text-green-600"
                        />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full rounded-xl bg-secondary px-4 py-2.5 text-center text-xs font-bold text-on-secondary shadow-sm transition-colors hover:brightness-95"
                >
                  {t("landingCtaTrial")}
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-on-surface">
                      {t("billingPlanYearly")}
                    </span>
                    <span className="rounded bg-tertiary-container px-2 py-0.5 text-[10px] font-bold text-tertiary">
                      {t("billingBestValue")}
                    </span>
                  </div>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-on-surface">
                      €192
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {" "}
                      {t("billingPerYear")}
                    </span>
                  </div>
                  <ul className="mb-6 space-y-2 text-xs text-on-surface-variant">
                    {(
                      [
                        "landingPriceF7",
                        "landingPriceF8",
                        "landingPriceF9",
                      ] as const
                    ).map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        <Icon
                          name="check"
                          className="text-[16px] text-green-600"
                        />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/signup"
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-center text-xs font-bold text-on-primary transition-colors hover:brightness-110"
                >
                  {t("landingCtaTrial")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section
          className="relative overflow-hidden bg-primary py-14 text-on-primary sm:py-20"
          id="cta"
        >
          <div className="mx-auto max-w-[1240px] px-4 text-center sm:px-6">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              {t("landingFinalTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
              {t("landingFinalSupport")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/client"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tertiary px-6 py-3 text-sm font-bold text-on-tertiary shadow-md transition-all hover:brightness-95 sm:w-auto"
              >
                <Icon name="add_box" className="text-[18px]" />
                {t("landingCtaClient")}
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-bold text-slate-100 transition-all hover:bg-slate-700 sm:w-auto"
              >
                <Icon name="login" className="text-[18px]" />
                {t("operationsLogin")}
              </Link>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              {t("landingFooterNote")}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface py-8">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt={t("brandName")}
              className="h-9 w-9 rounded-lg object-cover shadow-sm"
            />
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-primary">
                {t("brandName")}
              </span>
              <span className="text-xs font-medium text-on-surface-variant">
                {t("landingCorridor")}
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
            <a
              className="transition-colors hover:text-on-surface"
              href="#how-it-works"
            >
              {t("landingNavHow")}
            </a>
            <a
              className="transition-colors hover:text-on-surface"
              href="#who-is-it-for"
            >
              {t("landingNavWho")}
            </a>
            <a
              className="transition-colors hover:text-on-surface"
              href="#pricing"
            >
              {t("landingNavPricing")}
            </a>
            <Link
              className="transition-colors hover:text-on-surface"
              to="/login"
            >
              {t("operationsLogin")}
            </Link>
          </nav>
          <div className="text-xs text-outline">{t("landingCopyright")}</div>
        </div>
      </footer>
    </div>
  );
}
