import type { MayorContext, Prefs } from "@sbcal/core";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: init?.json !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  return data as T;
}

export interface Me {
  email: string;
  feed: { token: string; prefs: Prefs; updatedAt: string; lastFetchedAt: string | null } | null;
}

export interface MayorInfo extends MayorContext {
  mayorPerks: string[];
  ministerPerk: string | null;
  election: { year: number; leader: string | null; candidates: { name: string; votes: number }[] } | null;
}

export const api = {
  me: () => request<Me>("/api/me"),
  register: (email: string, password: string) =>
    request("/api/auth/register", { method: "POST", json: { email, password } }),
  login: (email: string, password: string) =>
    request("/api/auth/login", { method: "POST", json: { email, password } }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  saveFeed: (prefs: Prefs) => request<{ token: string }>("/api/feed", { method: "PUT", json: { prefs } }),
  rotateFeed: () => request<{ token: string }>("/api/feed/rotate", { method: "POST" }),
  deleteAccount: () => request("/api/me", { method: "DELETE" }),
  mayor: () => request<MayorInfo | null>("/api/mayor"),
};

export function feedUrls(token: string) {
  const https = `${window.location.origin}/cal/${token}.ics`;
  const webcal = https.replace(/^https?:/, "webcal:");
  return {
    https,
    webcal,
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
    outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent("SkyBlock Events")}`,
  };
}
