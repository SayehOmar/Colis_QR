import type { Paddle, PricePreviewParams } from "@paddle/paddle-js";
import { useEffect, useMemo, useState } from "react";
import { readPaddleBrowserConfig, type PlanId, type Tier } from "./paddleConfig";
import { loadPaddle } from "./paddle";

export type PaddlePrices = Record<string, string>;

export async function fetchVisitorCountry(): Promise<string | null> {
  try {
    const response = await fetch("/api/visitor-country");
    if (!response.ok) {
      return null;
    }
    const body = (await response.json()) as { country?: unknown };
    const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
    if (!/^[A-Z]{2}$/.test(country)) {
      return null;
    }
    return country;
  } catch {
    return null;
  }
}

function previewErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "error" in error) {
    const detail = (error as { error?: { detail?: string } }).error?.detail;
    if (detail) {
      return detail;
    }
  }
  return error instanceof Error ? error.message : "Paddle could not load prices";
}

export function useSandboxCheckout() {
  const config = useMemo(() => {
    try {
      return { value: readPaddleBrowserConfig(), error: null as string | null };
    } catch (err) {
      return {
        value: null,
        error: err instanceof Error ? err.message : "Paddle is not configured",
      };
    }
  }, []);
  const tiers: Tier[] = config.value?.tiers ?? [];
  const [paddle, setPaddle] = useState<Paddle | undefined>();
  const [country, setCountry] = useState<string | null>(null);
  const [countryReady, setCountryReady] = useState(false);
  const [prices, setPrices] = useState<PaddlePrices>({});
  const [loading, setLoading] = useState(tiers.length > 0);
  const [error, setError] = useState<string | null>(config.error);

  useEffect(() => {
    let cancelled = false;
    void fetchVisitorCountry().then((value) => {
      if (!cancelled) {
        setCountry(value);
        setCountryReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!config.value) {
      return;
    }
    let cancelled = false;
    void loadPaddle()
      .then((instance) => {
        if (!cancelled) {
          setPaddle(instance);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Paddle.js failed to load");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [config.value]);

  useEffect(() => {
    if (!paddle || !countryReady || tiers.length === 0) {
      return;
    }
    const params: PricePreviewParams = {
      items: tiers.map((tier) => ({ priceId: tier.priceId, quantity: 1 })),
      ...(country ? { address: { countryCode: country } } : {}),
    };
    setLoading(true);
    setError(null);
    void paddle
      .PricePreview(params)
      .then((response) => {
        const next: PaddlePrices = {};
        for (const item of response.data.details.lineItems) {
          next[item.price.id] = item.formattedTotals.total;
        }
        setPrices(next);
      })
      .catch((err: unknown) => {
        setError(previewErrorMessage(err));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [paddle, country, countryReady, tiers]);

  function formattedPrice(plan: PlanId): string | null {
    const tier = tiers.find((item) => item.id === plan);
    if (!tier) {
      return null;
    }
    return prices[tier.priceId] ?? null;
  }

  return {
    loading,
    error,
    formattedPrice,
    ready: Boolean(paddle) && tiers.length > 0,
  };
}
