import { Link } from "react-router-dom";

import type { AuthUser, Booking } from "../types";

type BookingsPageProps = {
  authUser: AuthUser | null;
  bookings: Booking[];
  loadingBookings: boolean;
  onRefresh: () => Promise<void>;
  onPay: (bookingId: number) => Promise<void>;
  onCancel: (bookingId: number) => Promise<void>;
};

export default function BookingsPage({
  authUser,
  bookings,
  loadingBookings,
  onRefresh,
  onPay,
  onCancel,
}: BookingsPageProps) {
  if (!authUser) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="border border-coral bg-red-50 p-5 shadow-flat">
          <h2 className="text-xl font-bold text-coral">Login erforderlich</h2>
          <p className="mt-2 text-sm text-slate-700">
            Für Buchung erstellen, zahlen und stornieren musst du eingeloggt sein.
          </p>
          <Link to="/auth" className="mt-4 inline-block border border-ocean px-4 py-2 text-sm font-semibold text-ocean">
            Zur Login-Seite
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="border border-slate-200 bg-white p-5 shadow-flat">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Meine Buchungen</h2>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingBookings}
            className="border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {loadingBookings ? "Lädt..." : "Aktualisieren"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {bookings.map((booking) => (
            <article key={booking.id} className="border border-slate-200 bg-slate-50 p-3">
              <p className="font-semibold">Referenz: {booking.reference}</p>
              <p className="text-sm text-slate-600">Angebot: {booking.offer.title}</p>
              <p className="text-sm text-slate-600">Status: {booking.status}</p>
              <p className="text-sm text-slate-600">Zahlung: {booking.payment_status}</p>
              <p className="text-sm font-semibold">Total: CHF {booking.total_price}</p>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onPay(booking.id)}
                  disabled={booking.payment_status !== "unpaid" || booking.status !== "active"}
                  className="bg-ocean px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Zahlung simulieren
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(booking.id)}
                  disabled={booking.status !== "active"}
                  className="bg-coral px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Stornieren
                </button>
              </div>
            </article>
          ))}

          {bookings.length === 0 && <p className="text-sm text-slate-500">Noch keine Buchungen vorhanden.</p>}
        </div>
      </section>
    </section>
  );
}
