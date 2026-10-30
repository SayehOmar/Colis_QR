import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { startDashboardTour, stopDashboardTour } from "./dashboardTour";
import {
  clearDashboardTourInvitePending,
  DASHBOARD_TOUR_INVITE_EVENT,
  hasDashboardTourInvitePending,
  hasSeenDashboardTour,
  markDashboardTourSeen,
} from "./tourStorage";

interface DashboardTourContextValue {
  startTour: () => void;
}

const DashboardTourContext = createContext<DashboardTourContextValue | null>(
  null,
);

export function useDashboardTour(): DashboardTourContextValue {
  const ctx = useContext(DashboardTourContext);
  if (!ctx) {
    return {
      startTour: () => {
        // Provider missing — no-op for safety.
      },
    };
  }
  return ctx;
}

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [inviteOpen, setInviteOpen] = useState(false);

  const refreshInvite = useCallback(() => {
    if (loading || !user?.id) {
      setInviteOpen(false);
      return;
    }
    if (hasSeenDashboardTour(user.id)) {
      clearDashboardTourInvitePending();
      setInviteOpen(false);
      return;
    }
    setInviteOpen(hasDashboardTourInvitePending());
  }, [user, loading]);

  useEffect(() => {
    refreshInvite();
  }, [refreshInvite]);

  useEffect(() => {
    const onInvite = () => refreshInvite();
    window.addEventListener(DASHBOARD_TOUR_INVITE_EVENT, onInvite);
    return () => window.removeEventListener(DASHBOARD_TOUR_INVITE_EVENT, onInvite);
  }, [refreshInvite]);

  useEffect(() => () => stopDashboardTour(), []);

  const runTour = useCallback(() => {
    if (!user?.id) return;
    clearDashboardTourInvitePending();
    setInviteOpen(false);

    const launch = () => {
      // Small delay so dashboard anchors exist after navigation.
      window.setTimeout(() => {
        startDashboardTour(t, {
          onDone: () => markDashboardTourSeen(user.id),
        });
      }, 350);
    };

    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      window.setTimeout(launch, 200);
    } else {
      launch();
    }
  }, [user, t, navigate, location.pathname]);

  const declineTour = useCallback(() => {
    if (!user?.id) return;
    markDashboardTourSeen(user.id);
    setInviteOpen(false);
  }, [user]);

  const startTour = useCallback(() => {
    runTour();
  }, [runTour]);

  const value = useMemo(() => ({ startTour }), [startTour]);

  return (
    <DashboardTourContext.Provider value={value}>
      {children}
      {inviteOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-invite-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-outline-variant/50 bg-surface p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
              CrossMed
            </p>
            <h2
              id="tour-invite-title"
              className="mt-2 text-xl font-extrabold text-on-surface"
            >
              {t("tourInviteTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              {t("tourInviteBody")}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                className="app-btn-navy flex-1"
                onClick={runTour}
              >
                {t("tourInviteYes")}
              </button>
              <button
                type="button"
                className="app-btn-ghost flex-1"
                onClick={declineTour}
              >
                {t("tourInviteNo")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardTourContext.Provider>
  );
}
