/** Canonical production origin (no trailing slash). Override with VITE_SITE_URL. */
export const siteUrl = (
  import.meta.env.VITE_SITE_URL ?? "https://crossmed.app"
).trim().replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalized === "/" ? "/" : normalized}`;
}

export function getRuntimeOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return siteUrl;
}
