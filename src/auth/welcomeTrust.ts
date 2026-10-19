import type { AuthUser } from "./api";

const SEEN_PREFIX = "transporteur-welcome-trust-seen:";
const PENDING_KEY = "transporteur-welcome-trust-pending";

/** Mark that the next authenticated screen should offer the welcome dialog. */
export function markWelcomeTrustPending(): void {
  try {
    sessionStorage.setItem(PENDING_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearWelcomeTrustPending(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

function hasPendingWelcome(): boolean {
  try {
    return sessionStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

function seenKey(userId: number): string {
  return `${SEEN_PREFIX}${userId}`;
}

export function hasSeenWelcomeTrust(userId: number): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markWelcomeTrustSeen(userId: number): void {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    // ignore
  }
  clearWelcomeTrustPending();
}

export function isRecentlyCreatedAccount(user: AuthUser | null): boolean {
  if (!user?.created_at) return false;
  const created = new Date(user.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 30 * 60 * 1000;
}

/** True for brand-new accounts (pending signup flag or created in the last 30 minutes). */
export function shouldShowWelcomeTrust(user: AuthUser | null): boolean {
  if (!user?.id) return false;
  if (hasSeenWelcomeTrust(user.id)) return false;

  if (hasPendingWelcome() && isRecentlyCreatedAccount(user)) return true;
  if (hasPendingWelcome() && !user.created_at) return true;

  return isRecentlyCreatedAccount(user);
}

export const WELCOME_CONTACT = {
  email: "sayehomar03@gmail.com",
  whatsapps: [
    { label: "216-24674352", href: "https://wa.me/21624674352", region: "TN" },
    { label: "+84 814 259 756", href: "https://wa.me/84814259756", region: "VN" },
  ],
} as const;
