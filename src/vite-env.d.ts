/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
  readonly VITE_TURNSTILE_ENABLED: string;
  readonly VITE_GRAPHQL_URI: string;
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_BYPASS: string;
  readonly VITE_PADDLE_CLIENT_TOKEN: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_APK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
