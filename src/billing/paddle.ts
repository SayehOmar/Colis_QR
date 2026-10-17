import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { readPaddleBrowserConfig, type PlanId } from "./paddleConfig";

let paddlePromise: Promise<Paddle> | null = null;

export function loadPaddle(): Promise<Paddle> {
  if (!paddlePromise) {
    const config = readPaddleBrowserConfig();
    paddlePromise = initializePaddle({
      environment: config.environment,
      token: config.clientToken,
    })
      .then((paddle) => {
        if (!paddle) {
          throw new Error("Paddle.js did not initialize");
        }
        return paddle;
      })
      .catch((error: unknown) => {
        paddlePromise = null;
        throw error;
      });
  }
  return paddlePromise;
}

export async function openSandboxCheckout(input: {
  plan: PlanId;
  email?: string;
  userId?: number;
}): Promise<void> {
  const config = readPaddleBrowserConfig();
  const tier = config.tiers.find((item) => item.id === input.plan);
  if (!tier) {
    throw new Error(`Unknown plan ${input.plan}`);
  }
  const paddle = await loadPaddle();
  paddle.Checkout.open({
    items: [{ priceId: tier.priceId, quantity: 1 }],
    ...(input.email ? { customer: { email: input.email } } : {}),
    ...(input.userId != null
      ? {
          customData: {
            user_id: String(input.userId),
            plan: input.plan,
          },
        }
      : {}),
    settings: {
      displayMode: "overlay",
      variant: "one-page",
      theme: "light",
      successUrl: `${window.location.origin}/welcome`,
    },
  });
}
