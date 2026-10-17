import { Link } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { PageSeo } from "../components/PageSeo";
import { useLanguage } from "../i18n/LanguageContext";

const CONTACT_EMAIL = "sayehomar03@gmail.com";
const ADDRESS =
  "21 Ng. 472 Đ. Lạc Long Quân, Tây Hồ, Hà Nội, Vietnam";
const WHATSAPPS = [
  {
    label: "216-24674352",
    href: "https://wa.me/21624674352",
    region: "TN",
  },
  {
    label: "+84 814 259 756",
    href: "https://wa.me/84814259756",
    region: "VN",
  },
] as const;

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden>
      {name}
    </span>
  );
}

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="landing-page min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-tertiary/15 selection:text-tertiary">
      <PageSeo
        title={t("seoAboutTitle")}
        description={t("seoAboutDescription")}
        path="/about"
      />

      <header className="sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-3 sm:h-16 sm:px-6 lg:px-8">
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
            <span className="text-base font-extrabold tracking-tight text-primary sm:text-lg">
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
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-sm"
            >
              {t("landingCtaCarrierShort")}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-outline-variant/30">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,168,168,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(255,122,0,0.1),_transparent_45%),linear-gradient(180deg,#F8F9FA_0%,#EEF2F6_55%,#F8F9FA_100%)]"
          />
          <div className="relative mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14 lg:py-20">
            <div className="order-2 lg:order-1">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-tertiary">
                {t("aboutEyebrow")}
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
                ESSAYEH Omar
              </h1>
              <p className="mt-3 text-lg font-semibold text-secondary sm:text-xl">
                {t("aboutRole")}
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                {t("aboutIntro")}
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                {t("aboutBusiness")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition hover:opacity-95"
                >
                  <Icon name="mail" className="text-[18px]" />
                  {t("aboutEmailCta")}
                </a>
                <Link
                  to="/#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:border-secondary hover:text-secondary"
                >
                  {t("aboutSeeProduct")}
                </Link>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  aria-hidden
                  className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-secondary/25 via-transparent to-tertiary/20 blur-2xl"
                />
                <img
                  src="/essayeh-omar.jpg"
                  alt={t("aboutPhotoAlt")}
                  className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover object-[center_18%] shadow-[0_24px_60px_-28px_rgba(11,22,35,0.55)] ring-1 ring-outline-variant/50"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
                {t("aboutStoryTitle")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
                {t("aboutStoryBody")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
                {t("aboutStoryBody2")}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-on-surface">
                {t("aboutContactTitle")}
              </h2>
              <ul className="mt-5 space-y-4">
                <li>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 transition hover:border-secondary"
                  >
                    <Icon
                      name="mail"
                      className="mt-0.5 text-[22px] text-secondary"
                    />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                        {t("landingContactEmail")}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-on-surface group-hover:text-secondary">
                        {CONTACT_EMAIL}
                      </span>
                    </span>
                  </a>
                </li>
                {WHATSAPPS.map((wa) => (
                  <li key={wa.href}>
                    <a
                      href={wa.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 transition hover:border-secondary"
                    >
                      <Icon
                        name="chat"
                        className="mt-0.5 text-[22px] text-green-600"
                      />
                      <span>
                        <span className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                          {t("landingContactWhatsApp")} · {wa.region}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold text-on-surface group-hover:text-secondary">
                          {wa.label}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
                <li className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3">
                  <Icon
                    name="location_on"
                    className="mt-0.5 text-[22px] text-tertiary"
                  />
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                      {t("aboutAddressLabel")}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold leading-relaxed text-on-surface">
                      {ADDRESS}
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/40 bg-surface-container-low/50 py-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="text-sm font-extrabold text-primary">
            {t("brandName")}
          </Link>
          <div className="flex flex-wrap gap-4 text-xs font-medium text-on-surface-variant">
            <Link to="/" className="hover:text-on-surface">
              {t("breadcrumbHome")}
            </Link>
            <Link to="/terms" className="hover:text-on-surface">
              {t("navTerms")}
            </Link>
            <Link to="/privacy" className="hover:text-on-surface">
              {t("navPrivacy")}
            </Link>
            <Link to="/refund" className="hover:text-on-surface">
              {t("navRefund")}
            </Link>
            <Link to="/client" className="hover:text-on-surface">
              {t("landingCtaClient")}
            </Link>
            <Link to="/signup" className="hover:text-on-surface">
              {t("signupButton")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
