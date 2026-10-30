const SEEN_PREFIX = "transporteur-dashboard-tour-seen:";
const INVITE_PENDING_KEY = "transporteur-dashboard-tour-invite-pending";

export const DASHBOARD_TOUR_INVITE_EVENT = "dashboard-tour-invite";

function seenKey(userId: number): string {
  return `${SEEN_PREFIX}${userId}`;
}

export function hasSeenDashboardTour(userId: number): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markDashboardTourSeen(userId: number): void {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    // ignore
  }
  clearDashboardTourInvitePending();
}

export function markDashboardTourInvitePending(): void {
  try {
    sessionStorage.setItem(INVITE_PENDING_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearDashboardTourInvitePending(): void {
  try {
    sessionStorage.removeItem(INVITE_PENDING_KEY);
  } catch {
    // ignore
  }
}

export function hasDashboardTourInvitePending(): boolean {
  try {
    return sessionStorage.getItem(INVITE_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function requestDashboardTourInvite(): void {
  markDashboardTourInvitePending();
  try {
    window.dispatchEvent(new Event(DASHBOARD_TOUR_INVITE_EVENT));
  } catch {
    // ignore
  }
}
