import { useLanguage } from "../i18n/LanguageContext";
import { Language } from "../i18n/translations";

const FLAGS: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
];

interface LanguageSwitcherProps {
  variant?: "dark" | "light" | "nav";
}

export function LanguageSwitcher({ variant = "dark" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isNav = variant === "nav" || variant === "light";

  return (
    <div
      className={
        isNav
          ? "flex items-center gap-1"
          : "mb-6 flex items-center justify-center gap-2"
      }
      role="group"
      aria-label="Language"
    >
      {FLAGS.map(({ code, label, flag }) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={
              active
                ? isNav
                  ? "flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-secondary ring-offset-1 text-base leading-none"
                  : "flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 text-xl leading-none"
                : isNav
                  ? "flex h-8 w-8 items-center justify-center rounded-full text-base leading-none opacity-70 transition hover:opacity-100 hover:bg-surface-container-low"
                  : "flex h-10 w-10 items-center justify-center rounded-full text-xl leading-none opacity-70 transition hover:opacity-100 hover:bg-slate-800"
            }
          >
            <span aria-hidden className="select-none">
              {flag}
            </span>
          </button>
        );
      })}
    </div>
  );
}
