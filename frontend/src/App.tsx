import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import {
  cancelBooking,
  ensureCsrfCookie,
  createBooking,
  fetchBookings,
  fetchCurrentUser,
  fetchOffers,
  loginUser,
  logoutUser,
  payBooking,
  registerUser,
} from "./api";
import Header from "./components/Header";
import AuthPage from "./pages/AuthPage";
import BookingsPage from "./pages/BookingsPage";
import OffersPage from "./pages/OffersPage";
import type { AuthUser, Booking, Offer } from "./types";

export default function App() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [filters, setFilters] = useState({
    type: "",
    location: "",
    min_price: "",
    max_price: "",
    min_rating: "",
  });

  const [form, setForm] = useState({
    offer_id: 0,
    customer_name: "",
    customer_email: "",
    quantity: 1,
  });

  async function loadOffers(activeFilters = filters) {
    setLoadingOffers(true);
    setError("");
    try {
      const data = await fetchOffers(activeFilters);
      setOffers(data);
      if (data.length > 0 && form.offer_id === 0) {
        setForm((prev) => ({ ...prev, offer_id: data[0].id }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingOffers(false);
    }
  }

  async function reloadBookings() {
    setLoadingBookings(true);
    setError("");
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadBookings() {
    if (!authUser) {
      setBookings([]);
      return;
    }

    await reloadBookings();
  }

  useEffect(() => {
    ensureCsrfCookie().catch(() => undefined);
    loadOffers();

    fetchCurrentUser()
      .then((user) => {
        setAuthUser(user);
        return fetchBookings();
      })
      .then((data) => setBookings(data))
      .catch(() => undefined);
  }, []);

  async function handleRegister(payload: { username: string; email: string; password: string }) {
    setError("");
    setAuthMessage("");
    try {
      await registerUser(payload);
      setAuthMessage("Registrierung erfolgreich. Du kannst dich jetzt einloggen.");
      setNotice("Account erstellt.");
      navigate("/auth");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleLogin(payload: { username: string; password: string }) {
    setError("");
    setAuthMessage("");

    try {
      const user = await loginUser(payload);
      setAuthUser(user);
      setForm((prev) => ({
        ...prev,
        customer_email: user.email || prev.customer_email,
        customer_name: prev.customer_name || user.username,
      }));
      setAuthMessage(`Eingeloggt als ${user.username}.`);
      setNotice("Login erfolgreich.");
      await reloadBookings();
      navigate("/buchungen");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleLogout() {
    await logoutUser().catch(() => undefined);
    setAuthUser(null);
    setBookings([]);
    setAuthMessage("Ausgeloggt.");
    setNotice("Du wurdest ausgeloggt.");
    navigate("/auth");
  }

  async function handleBook() {
    if (!authUser) {
      setError("Bitte zuerst einloggen.");
      return false;
    }

    setError("");
    try {
      await createBooking(form);
      await reloadBookings();
      setNotice("Buchung erfolgreich erstellt.");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }

  async function handlePay(bookingId: number) {
    if (!authUser) {
      setError("Bitte zuerst einloggen.");
      return;
    }

    try {
      await payBooking(bookingId);
      await reloadBookings();
      setNotice("Zahlung wurde simuliert.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCancel(bookingId: number) {
    if (!authUser) {
      setError("Bitte zuerst einloggen.");
      return;
    }

    const reason = prompt("Optionaler Stornogrund", "Plan geändert") || "";
    try {
      await cancelBooking(bookingId, reason);
      await reloadBookings();
      setNotice("Buchung wurde storniert.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand to-white text-ink">
      <Header authUser={authUser} onLogout={handleLogout} />

      {notice && (
        <div className="mx-auto mt-4 w-full max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 border border-mint bg-green-50 px-4 py-2 text-sm font-semibold text-mint">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Hinweis schließen"
              className="border border-mint px-2 py-0.5 text-xs font-bold hover:bg-green-100"
            >
              X
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-auto mt-4 w-full max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 border border-coral bg-red-50 px-4 py-2 text-sm font-semibold text-coral">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Fehler schließen"
              className="border border-coral px-2 py-0.5 text-xs font-bold hover:bg-red-100"
            >
              X
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/auth"
          element={
            <AuthPage
              authUser={authUser}
              authMessage={authMessage}
              onDismissAuthMessage={() => setAuthMessage("")}
              onRegister={handleRegister}
              onLogin={handleLogin}
            />
          }
        />
        <Route
          path="/angebote"
          element={
            <OffersPage
              authUser={authUser}
              offers={offers}
              loadingOffers={loadingOffers}
              filters={filters}
              form={form}
              onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
              onSearch={() => loadOffers()}
              onFormChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
              onBook={handleBook}
              onSelectOffer={(offerId) => {
                setForm((prev) => ({ ...prev, offer_id: offerId }));
                setNotice("Angebot für Buchung übernommen.");
              }}
            />
          }
        />
        <Route
          path="/buchungen"
          element={
            <BookingsPage
              authUser={authUser}
              bookings={bookings}
              loadingBookings={loadingBookings}
              onRefresh={() => loadBookings()}
              onPay={handlePay}
              onCancel={handleCancel}
            />
          }
        />
        <Route path="*" element={<Navigate to="/angebote" replace />} />
      </Routes>
    </div>
  );
}
