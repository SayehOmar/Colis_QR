import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function WelcomePage() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <div className="app-page">
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-on-surface">{t("billingTitle")}</h1>
        <p className="mt-4 text-sm text-on-surface-variant">{t("billingSuccess")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to={user?.has_access ? "/dashboard" : "/billing"} className="app-btn-navy">
            {user?.has_access ? t("billingGoDashboard") : t("billingChoosePlan")}
          </Link>
        </div>
      </div>
    </div>
  );
}
