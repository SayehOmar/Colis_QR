import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import type { TranslationKey } from "../i18n/translations";

export type TourTranslate = (key: TranslationKey) => string;

type TourStepDef = {
  element: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
};

const STEP_DEFS: TourStepDef[] = [
  {
    element: '[data-tour="orders"]',
    titleKey: "tourStepOrdersTitle",
    bodyKey: "tourStepOrdersBody",
  },
  {
    element: '[data-tour="delivered"]',
    titleKey: "tourStepDeliveredTitle",
    bodyKey: "tourStepDeliveredBody",
  },
  {
    element: '[data-tour="filter"]',
    titleKey: "tourStepFilterTitle",
    bodyKey: "tourStepFilterBody",
  },
  {
    element: '[data-tour="add-shipment"]',
    titleKey: "tourStepAddTitle",
    bodyKey: "tourStepAddBody",
  },
  {
    element: '[data-tour="weight"]',
    titleKey: "tourStepWeightTitle",
    bodyKey: "tourStepWeightBody",
  },
  {
    element: '[data-tour="places"]',
    titleKey: "tourStepPlacesTitle",
    bodyKey: "tourStepPlacesBody",
  },
  {
    element: '[data-tour="tariff"]',
    titleKey: "tourStepTariffTitle",
    bodyKey: "tourStepTariffBody",
  },
  {
    element: '[data-tour="map"]',
    titleKey: "tourStepMapTitle",
    bodyKey: "tourStepMapBody",
  },
  {
    element: '[data-tour="day-notes"]',
    titleKey: "tourStepDayNotesTitle",
    bodyKey: "tourStepDayNotesBody",
  },
  {
    element: '[data-tour="calendar-fab"]',
    titleKey: "tourStepCalendarTitle",
    bodyKey: "tourStepCalendarBody",
  },
  {
    element: '[data-tour="export-fab"]',
    titleKey: "tourStepExportTitle",
    bodyKey: "tourStepExportBody",
  },
  {
    element: '[data-tour="team"]',
    titleKey: "tourStepTeamTitle",
    bodyKey: "tourStepTeamBody",
  },
  {
    element: '[data-tour="guide"]',
    titleKey: "tourStepGuideTitle",
    bodyKey: "tourStepGuideBody",
  },
];

let activeDriver: ReturnType<typeof driver> | null = null;

function buildSteps(t: TourTranslate): DriveStep[] {
  return STEP_DEFS.filter((def) => document.querySelector(def.element)).map(
    (def) => ({
      element: def.element,
      popover: {
        title: t(def.titleKey),
        description: t(def.bodyKey),
        side: "bottom",
        align: "start",
      },
    }),
  );
}

export function isDashboardTourRunning(): boolean {
  return activeDriver != null;
}

export function startDashboardTour(
  t: TourTranslate,
  options?: { onDone?: () => void },
): void {
  if (activeDriver) {
    activeDriver.destroy();
    activeDriver = null;
  }

  const steps = buildSteps(t);
  if (steps.length === 0) {
    options?.onDone?.();
    return;
  }

  const finish = () => {
    activeDriver = null;
    options?.onDone?.();
  };

  activeDriver = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 10,
    popoverClass: "crossmed-tour-popover",
    nextBtnText: t("tourNext"),
    prevBtnText: t("tourBack"),
    doneBtnText: t("tourDone"),
    progressText: t("tourProgress"),
    steps,
    onDestroyStarted: () => {
      if (!activeDriver) return;
      activeDriver.destroy();
      finish();
    },
  });

  // Ensure targets are painted (dashboard may have just mounted).
  window.requestAnimationFrame(() => {
    activeDriver?.drive();
  });
}

export function stopDashboardTour(): void {
  if (!activeDriver) return;
  activeDriver.destroy();
  activeDriver = null;
}
