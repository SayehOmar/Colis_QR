import { useLanguage } from "../i18n/LanguageContext";
import { Language } from "../i18n/translations";

const FLAGS: { code: Language; label: string; src: string }[] = [
  { code: "fr", label: "Français", src: "/france.svg" },
  { code: "en", label: "English", src: "/GB.svg" },
  { code: "ar", label: "العربية", src: "/tunisia.svg" },
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
      {FLAGS.map(({ code, label, src }) => {
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
                  ? "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-secondary ring-offset-1"
                  : "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950"
                : isNav
                  ? "flex h-8 w-8 items-center justify-center overflow-hidden rounded-full opacity-70 transition hover:opacity-100 hover:bg-surface-container-low"
                  : "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full opacity-70 transition hover:opacity-100 hover:bg-slate-800"
            }
          >
            <img
              src={src}
              alt=""
              aria-hidden
              className="h-full w-full object-cover select-none"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}
