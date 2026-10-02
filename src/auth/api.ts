import { AUTH_TOKEN_KEY, apiBaseUrl } from "../config";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  created_at?: string | null;
  has_access?: boolean;
  email_verified?: boolean;
  email_verification_required?: boolean;
  is_admin?: boolean;
  trial_ends_at?: string | null;
  subscription_status?: string | null;
  subscription_plan?: string | null;
  subscription_ends_at?: string | null;
  can_change_password?: boolean;
  auth_provider?: "password" | "google" | string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface BillingPlan {
  id: string;
  label: string;
  price_eur: number;
  interval: string;
  interval_count: number;
  configured: boolean;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((item: { msg?: string }) => item.msg ?? "Error").join(", ");
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function authRegister(input: {
  email: string;
  password: string;
  name?: string;
  turnstileToken?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name ?? "",
      turnstile_token: input.turnstileToken ?? "",
    }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function authLogin(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function authGoogle(token: {
  idToken?: string;
  accessToken?: string;
}): Promise<AuthResponse> {
  const body =
    token.idToken != null
      ? { id_token: token.idToken }
      : { access_token: token.accessToken };

  const response = await fetch(`${apiBaseUrl}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function authMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function updateProfile(
  token: string,
  name: string
): Promise<AuthUser> {
  const response = await fetch(`${apiBaseUrl}/auth/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function fetchBillingPlans(): Promise<BillingPlan[]> {
  const response = await fetch(`${apiBaseUrl}/billing/plans`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { plans: BillingPlan[] };
  return data.plans ?? [];
}

export async function startCheckout(token: string, plan: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/billing/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plan }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function openBillingPortal(token: string): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/billing/portal`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function verifyEmail(token: string): Promise<{ status: string; user?: AuthUser }> {
  const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function resendVerification(token: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/resend-verification`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export function postAuthPath(user: AuthUser): string {
  if (user.email_verification_required && user.email_verified === false) {
    return "/verify-email";
  }
  return user.has_access === false ? "/billing" : "/dashboard";
}

export function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
