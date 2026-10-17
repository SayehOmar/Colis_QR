import type { Environments } from "@paddle/paddle-js";

export type PlanId = "monthly" | "quarterly" | "yearly";

export interface Tier {
  id: PlanId;
  description: string;
  features: string[];
  priceId: string;
}

function requiredEnv(name: keyof ImportMetaEnv): string {
  const value = String(import.meta.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function readPaddleBrowserConfig(): {
  environment: Environments;
  clientToken: string;
  tiers: Tier[];
} {
  const environment = requiredEnv("PADDLE_ENV");
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("PADDLE_ENV must be sandbox or production");
  }
  const clientToken = (
    import.meta.env.PADDLE_CLIENT_TOKEN ??
    import.meta.env.VITE_PADDLE_CLIENT_TOKEN ??
    ""
  ).trim();
  if (!clientToken) {
    throw new Error("PADDLE_CLIENT_TOKEN is not set");
  }

  return {
    environment,
    clientToken,
    tiers: [
      {
        id: "monthly",
        description: "Carrier tools, billed every month.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: requiredEnv("PADDLE_PRICE_MONTHLY"),
      },
      {
        id: "quarterly",
        description: "Carrier tools, billed every 3 months.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: requiredEnv("PADDLE_PRICE_QUARTERLY"),
      },
      {
        id: "yearly",
        description: "Carrier tools, billed every year.",
        features: ["QR scanner", "Operations dashboard", "Unlimited scans"],
        priceId: requiredEnv("PADDLE_PRICE_YEARLY"),
      },
    ],
  };
}
