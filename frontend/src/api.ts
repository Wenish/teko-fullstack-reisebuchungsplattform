import type { AuthUser, Booking, Offer } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export type BasicCredentials = {
  username: string;
  password: string;
};

function buildAuthHeader(credentials?: BasicCredentials) {
  if (!credentials) {
    return {} as Record<string, string>;
  }
  return {
    Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
  };
}

async function request<T>(path: string, options?: RequestInit, credentials?: BasicCredentials): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...buildAuthHeader(credentials),
    ...(options?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

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

export function registerUser(payload: { username: string; email: string; password: string }) {
  return request<AuthUser>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(credentials: BasicCredentials) {
  return request<AuthUser>("/auth/me/", undefined, credentials);
}

export function createBooking(payload: {
  offer_id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
}, credentials: BasicCredentials) {
  return request<Booking>("/bookings/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, credentials);
}

export function fetchBookings(credentials: BasicCredentials) {
  return request<Booking[]>("/bookings/", undefined, credentials);
}

export function payBooking(bookingId: number, credentials: BasicCredentials) {
  return request<Booking>(`/bookings/${bookingId}/pay/`, {
    method: "POST",
    body: JSON.stringify({}),
  }, credentials);
}

export function cancelBooking(bookingId: number, reason: string, credentials: BasicCredentials) {
  return request<{ booking: Booking; cancellation: { refund_amount: string; reason: string; canceled_at: string } }>(
    `/bookings/${bookingId}/cancel/`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    credentials
  );
}
