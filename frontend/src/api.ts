import type { AuthUser, Booking, Offer } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1];
  return value ? decodeURIComponent(value) : "";
}

function csrfSafeMethod(method = "GET") {
  return ["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

function buildHeaders(options?: RequestInit) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };

  const method = options?.method || "GET";
  if (!csrfSafeMethod(method)) {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  return headers;
}

async function refreshSession() {
  const response = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders({ method: "POST" }),
  });

  return response.ok;
}

async function request<T>(path: string, options?: RequestInit, retryOnAuthFailure = true): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: buildHeaders(options),
  });

  if (response.status === 401 && retryOnAuthFailure && path !== "/auth/refresh/") {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok) {
    let detail = "Unbekannter Fehler";
    try {
      const payload = await response.json();
      detail = payload.detail || JSON.stringify(payload);
    } catch {
      // Keep fallback message.
    }
    throw new Error(detail);
  }

  return response.json();
}

export function fetchOffers(filters: {
  type?: string;
  location?: string;
  min_price?: string;
  max_price?: string;
  min_rating?: string;
}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  return request<Offer[]>(`/offers/?${params.toString()}`);
}

export function ensureCsrfCookie() {
  return request<{ detail: string }>("/auth/csrf/", undefined, false);
}

export function registerUser(payload: { username: string; email: string; password: string }) {
  return request<AuthUser>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function loginUser(payload: { username: string; password: string }) {
  return request<AuthUser>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export function fetchCurrentUser() {
  return request<AuthUser>("/auth/me/");
}

export function logoutUser() {
  return request<{ detail: string }>("/auth/logout/", {
    method: "POST",
    body: JSON.stringify({}),
  }, false);
}

export function createBooking(payload: {
  offer_id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
}) {
  return request<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchBookings() {
  return request<Booking[]>("/bookings/");
}

export function payBooking(bookingId: number) {
  return request<Booking>(`/bookings/${bookingId}/pay/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function cancelBooking(bookingId: number, reason: string) {
  return request<{ booking: Booking; cancellation: { refund_amount: string; reason: string; canceled_at: string } }>(
    `/bookings/${bookingId}/cancel/`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
}
