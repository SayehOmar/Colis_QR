import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  Language,
  TranslationKey,
  translations,
} from "./translations";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyDocumentDirection(language: Language): void {
  const direction = language === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body.dir = direction;
  document.body.style.direction = direction;
}

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "fr" || stored === "en" || stored === "ar") {
    return stored;
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    applyDocumentDirection(next);
  };

  useEffect(() => {
    applyDocumentDirection(language);
  }, [language]);

  const isRtl = language === "ar";

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => translations[language][key],
      isRtl,
    }),
    [language, isRtl]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div key={language} dir={isRtl ? "rtl" : "ltr"} className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
