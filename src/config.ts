import { absoluteUrl, getRuntimeOrigin } from "./seo/site";

export const graphqlUri =
  import.meta.env.GRAPHQL_URI ??
  import.meta.env.VITE_GRAPHQL_URI ??
  "https://api.example.com/graphql";

export const apiBaseUrl =
  import.meta.env.API_URL ??
  import.meta.env.VITE_API_URL ??
  graphqlUri.replace(/\/graphql\/?$/, "");

export const googleClientId =
  import.meta.env.GOOGLE_CLIENT_ID ??
  import.meta.env.VITE_GOOGLE_CLIENT_ID ??
  "";

/** Public Turnstile site key. The secret stays on the backend. */
export const turnstileSiteKey =
  import.meta.env.TURNSTILE_SITE_KEY ??
  import.meta.env.VITE_TURNSTILE_SITE_KEY ??
  "";

export const turnstileEnabled =
  (
    import.meta.env.TURNSTILE_ENABLED ??
    import.meta.env.VITE_TURNSTILE_ENABLED ??
    "false"
  ).toLowerCase() === "true";

/** Quick-access code; must match pc-backend BYPASS. */
export const authBypass =
  (import.meta.env.VITE_BYPASS ?? import.meta.env.VITE_bypass ?? "").trim();

export const AUTH_TOKEN_KEY = "transporteur-auth-token";

/** Canonical site origin for SEO (sitemap / llm.txt should match). */
export { siteUrl, absoluteUrl, getRuntimeOrigin } from "./seo/site";

/**
 * Public APK install URL. Defaults to the file served from this site
 * (`/crossmed.apk`). Override with VITE_APK_URL if needed.
 */
export function getApkDownloadUrl(): string {
  const configured = (import.meta.env.VITE_APK_URL ?? "").trim();
  if (configured) {
    return configured;
  }
  if (typeof window !== "undefined") {
    return `${getRuntimeOrigin()}/crossmed.apk`;
  }
  return absoluteUrl("/crossmed.apk");
}

/** Resolved at module load; prefer getApkDownloadUrl() when origin may change. */
export const apkDownloadUrl = getApkDownloadUrl();

export function isAuthBypassIdentity(value: string): boolean {
  return Boolean(authBypass) && value.trim().toLowerCase() === authBypass.toLowerCase();
}
