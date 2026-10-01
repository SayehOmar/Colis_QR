export const graphqlUri =
  import.meta.env.VITE_GRAPHQL_URI ?? "https://api.example.com/graphql";

export const apiBaseUrl =
  import.meta.env.VITE_API_URL ??
  graphqlUri.replace(/\/graphql\/?$/, "");

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

/** Quick-access code; must match pc-backend BYPASS. */
export const authBypass =
  (import.meta.env.VITE_BYPASS ?? import.meta.env.VITE_bypass ?? "").trim();

export const AUTH_TOKEN_KEY = "transporteur-auth-token";

/** Public APK / install URL for the phone app QR on the profile page. */
export const apkDownloadUrl = (import.meta.env.VITE_APK_URL ?? "").trim();

/** Canonical site origin for SEO (sitemap / llm.txt should match). */
export { siteUrl, absoluteUrl } from "./seo/site";

export function isAuthBypassIdentity(value: string): boolean {
  return Boolean(authBypass) && value.trim().toLowerCase() === authBypass.toLowerCase();
}
