import { useLanguage } from "../i18n/LanguageContext";
import { Language, translations } from "../i18n/translations";

const LANGUAGES: Language[] = ["fr", "en", "ar"];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="mb-6 flex justify-center">
      <label className="flex items-center gap-2 text-sm text-slate-400">
        {t("language")}:
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100"
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {translations[code].langName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
