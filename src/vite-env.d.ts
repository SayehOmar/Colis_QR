/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
  readonly TURNSTILE_SITE_KEY?: string;
  readonly VITE_TURNSTILE_ENABLED: string;
  readonly TURNSTILE_ENABLED?: string;
  readonly VITE_GRAPHQL_URI: string;
  readonly GRAPHQL_URI?: string;
  readonly VITE_API_URL: string;
  readonly API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly VITE_BYPASS: string;
  readonly VITE_SITE_URL: string;
  readonly SITE_URL?: string;
  readonly VITE_APK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
