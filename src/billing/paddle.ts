type PaddleCheckoutOpenOptions = {
  transactionId?: string;
  settings?: {
    successUrl?: string;
    displayMode?: "overlay" | "inline";
    theme?: "light" | "dark";
  };
};

type PaddleGlobal = {
  Environment?: { set: (env: "sandbox" | "production") => void };
  Initialize: (options: {
    token: string;
    eventCallback?: (event: { name?: string; data?: unknown }) => void;
  }) => void;
  Checkout: {
    open: (options: PaddleCheckoutOpenOptions) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleGlobal;
  }
}

let paddleReady: Promise<PaddleGlobal> | null = null;

function loadPaddleScript(): Promise<void> {
  if (window.Paddle) {
    return Promise.resolve();
  }
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-paddle-js="v2"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Paddle.js")),
      );
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.dataset.paddleJs = "v2";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.head.appendChild(script);
  });
}

export async function ensurePaddle(options: {
  clientToken: string;
  environment: "sandbox" | "production";
  onEvent?: (event: { name?: string; data?: unknown }) => void;
}): Promise<PaddleGlobal> {
  if (!options.clientToken) {
    throw new Error("Paddle client token is missing");
  }
  if (!paddleReady) {
    paddleReady = (async () => {
      await loadPaddleScript();
      const paddle = window.Paddle;
      if (!paddle) {
        throw new Error("Paddle.js did not initialize");
      }
      if (options.environment === "sandbox" && paddle.Environment) {
        paddle.Environment.set("sandbox");
      }
      paddle.Initialize({
        token: options.clientToken,
        eventCallback: options.onEvent,
      });
      return paddle;
    })().catch((err) => {
      paddleReady = null;
      throw err;
    });
  }
  return paddleReady;
}

export async function openPaddleCheckout(options: {
  clientToken: string;
  environment: "sandbox" | "production";
  transactionId: string;
  successUrl: string;
}): Promise<void> {
  const paddle = await ensurePaddle({
    clientToken: options.clientToken,
    environment: options.environment,
  });
  paddle.Checkout.open({
    transactionId: options.transactionId,
    settings: {
      successUrl: options.successUrl,
      displayMode: "overlay",
      theme: "light",
    },
  });
}
