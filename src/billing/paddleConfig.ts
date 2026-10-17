import type { Environments } from "@paddle/paddle-js";

export type PlanId = "monthly" | "quarterly" | "yearly";

export interface Tier {
  id: PlanId;
  description: string;
  features: string[];
  priceId: string;
}

function readEnv(...names: (keyof ImportMetaEnv | string)[]): string {
  for (const name of names) {
    const value = String(
      (import.meta.env as Record<string, string | undefined>)[name] ?? "",
    ).trim();
    if (value) {
      return value;
    }
  }
  return "";
}

/** Catalog amounts shown when PricePreview is unavailable. */
export const FALLBACK_PLAN_PRICES: Record<PlanId, string> = {
  monthly: "€20",
  quarterly: "€52",
  yearly: "€192",
};

export function readPaddleBrowserConfig(): {
  environment: Environments;
  clientToken: string;
  tiers: Tier[];
} {
  const environment = readEnv("PADDLE_ENV", "VITE_PADDLE_ENV");
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("Paddle checkout is not configured");
  }
  const clientToken = readEnv("PADDLE_CLIENT_TOKEN", "VITE_PADDLE_CLIENT_TOKEN");
  if (!clientToken) {
    throw new Error("Paddle checkout is not configured");
  }

  const monthly = readEnv("PADDLE_PRICE_MONTHLY", "VITE_PADDLE_PRICE_MONTHLY");
  const quarterly = readEnv(
    "PADDLE_PRICE_QUARTERLY",
    "VITE_PADDLE_PRICE_QUARTERLY",
  );
  const yearly = readEnv("PADDLE_PRICE_YEARLY", "VITE_PADDLE_PRICE_YEARLY");
  if (!monthly || !quarterly || !yearly) {
    throw new Error("Paddle checkout is not configured");
  }

  return {
    environment,
    clientToken,
    tiers: [
      {
        id: "monthly",
        description: "Carrier tools, billed every month.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: monthly,
      },
      {
        id: "quarterly",
        description: "Carrier tools, billed every 3 months.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: quarterly,
      },
      {
        id: "yearly",
        description: "Carrier tools, billed every year.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: yearly,
      },
    ],
  };
}
