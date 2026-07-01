import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { AuthUser, Offer } from "../types";

const offerTypeLabels: Record<string, string> = {
  flight: "Flug",
  hotel: "Hotel",
  car: "Mietwagen",
};

type OffersPageProps = {
  authUser: AuthUser | null;
  offers: Offer[];
  loadingOffers: boolean;
  filters: {
    type: string;
    location: string;
    min_price: string;
    max_price: string;
    min_rating: string;
  };
  form: {
    offer_id: number;
    customer_name: string;
    customer_email: string;
    quantity: number;
  };
  onFilterChange: (key: "type" | "location" | "min_price" | "max_price" | "min_rating", value: string) => void;
  onFormChange: (key: "offer_id" | "customer_name" | "customer_email" | "quantity", value: string | number) => void;
  onSearch: () => Promise<void>;
  onBook: () => Promise<boolean>;
  onSelectOffer: (offerId: number) => void;
};

export default function OffersPage({
  authUser,
  offers,
  loadingOffers,
  filters,
  form,
  onFilterChange,
  onFormChange,
  onSearch,
  onBook,
  onSelectOffer,
}: OffersPageProps) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const selectedOffer = useMemo(() => offers.find((offer) => offer.id === form.offer_id) || null, [offers, form.offer_id]);

  async function handleBookSubmit(event: React.FormEvent) {
    event.preventDefault();
    const success = await onBook();
    if (success) {
      setIsBookingOpen(false);
    }
  }

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-8">
      <div className="border border-slate-200 bg-white p-5 shadow-flat">
        <h2 className="text-xl font-bold">Angebote suchen</h2>
        <p className="mt-1 text-sm text-slate-600">Filter setzen, passendes Angebot finden und für Buchung auswählen.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="filter-type" className="mb-1 block text-sm font-semibold">
              Typ
            </label>
            <select
              id="filter-type"
              className="w-full border border-slate-300 p-2"
              value={filters.type}
              onChange={(e) => onFilterChange("type", e.target.value)}
            >
              <option value="">Alle Typen</option>
              <option value="flight">Flug</option>
              <option value="hotel">Hotel</option>
              <option value="car">Mietwagen</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-location" className="mb-1 block text-sm font-semibold">
              Ort
            </label>
            <input
              id="filter-location"
              className="w-full border border-slate-300 p-2"
              value={filters.location}
              onChange={(e) => onFilterChange("location", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="filter-min-price" className="mb-1 block text-sm font-semibold">
              Mindestpreis
            </label>
            <input
              id="filter-min-price"
              className="w-full border border-slate-300 p-2"
              value={filters.min_price}
              onChange={(e) => onFilterChange("min_price", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="filter-max-price" className="mb-1 block text-sm font-semibold">
              Höchstpreis
            </label>
            <input
              id="filter-max-price"
              className="w-full border border-slate-300 p-2"
              value={filters.max_price}
              onChange={(e) => onFilterChange("max_price", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="filter-rating" className="mb-1 block text-sm font-semibold">
              Mindestbewertung
            </label>
            <input
              id="filter-rating"
              className="w-full border border-slate-300 p-2"
              placeholder="z. B. 4.0"
              value={filters.min_rating}
              onChange={(e) => onFilterChange("min_rating", e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="mt-4 bg-ocean px-4 py-2 font-semibold text-white disabled:opacity-40"
          onClick={onSearch}
          disabled={loadingOffers}
        >
          {loadingOffers ? "Suche läuft..." : "Angebote suchen"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className={`border bg-white p-4 shadow-flat ${
              form.offer_id === offer.id ? "border-ocean bg-blue-50" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold">{offer.title}</h3>
              <span className="border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold">
                {offerTypeLabels[offer.offer_type]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">Ort: {offer.location}</p>
            <p className="text-sm text-slate-600">Anbieter: {offer.provider.name}</p>
            <p className="text-sm text-slate-600">Bewertung: {offer.rating}</p>
            <p className="text-sm text-slate-600">Verfügbar: {offer.available_units}</p>
            <p className="mt-2 font-semibold text-ocean">Dynamischer Preis: CHF {offer.dynamic_unit_price}</p>

            <button
              type="button"
              className="mt-3 border border-ocean px-3 py-2 text-sm font-semibold text-ocean hover:bg-ocean hover:text-white"
              onClick={() => {
                onSelectOffer(offer.id);
                setIsBookingOpen(true);
              }}
            >
              {form.offer_id === offer.id ? "Für Buchung ausgewählt" : "Für Buchung auswählen"}
            </button>
          </article>
        ))}
      </div>

      {offers.length === 0 && <p className="mt-6 text-sm text-slate-500">Keine Angebote gefunden.</p>}

      {isBookingOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setIsBookingOpen(false)} />
          <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-slate-300 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Buchung abschliessen</h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="border border-slate-300 px-3 py-1 text-sm font-semibold"
              >
                Zurück
              </button>
            </div>

            {!authUser && (
              <div className="mb-4 border border-coral bg-red-50 p-3 text-sm text-slate-700">
                Für Buchungen musst du eingeloggt sein.
                <div className="mt-2">
                  <Link to="/auth" className="border border-ocean px-3 py-1 text-sm font-semibold text-ocean">
                    Zur Login-Seite
                  </Link>
                </div>
              </div>
            )}

            {selectedOffer && (
              <div className="mb-4 border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{selectedOffer.title}</p>
                <p>Ort: {selectedOffer.location}</p>
                <p>Dynamischer Preis: CHF {selectedOffer.dynamic_unit_price}</p>
              </div>
            )}

            <form className="space-y-3" onSubmit={handleBookSubmit}>
              <div>
                <label htmlFor="sidebar-offer" className="mb-1 block text-sm font-semibold">
                  Angebot
                </label>
                <select
                  id="sidebar-offer"
                  className="w-full border border-slate-300 p-2"
                  value={form.offer_id}
                  onChange={(e) => onFormChange("offer_id", Number(e.target.value))}
                  disabled={!authUser}
                  required
                >
                  {offers.length === 0 && <option value={0}>Keine Angebote vorhanden</option>}
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {offer.title} ({offer.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sidebar-name" className="mb-1 block text-sm font-semibold">
                  Name
                </label>
                <input
                  id="sidebar-name"
                  className="w-full border border-slate-300 p-2"
                  value={form.customer_name}
                  onChange={(e) => onFormChange("customer_name", e.target.value)}
                  disabled={!authUser}
                  required
                />
              </div>

              <div>
                <label htmlFor="sidebar-email" className="mb-1 block text-sm font-semibold">
                  E-Mail
                </label>
                <input
                  id="sidebar-email"
                  type="email"
                  className="w-full border border-slate-300 p-2"
                  value={form.customer_email}
                  onChange={(e) => onFormChange("customer_email", e.target.value)}
                  disabled={!authUser}
                  required
                />
              </div>

              <div>
                <label htmlFor="sidebar-quantity" className="mb-1 block text-sm font-semibold">
                  Menge
                </label>
                <input
                  id="sidebar-quantity"
                  type="number"
                  min={1}
                  className="w-full border border-slate-300 p-2"
                  value={form.quantity}
                  onChange={(e) => onFormChange("quantity", Number(e.target.value))}
                  disabled={!authUser}
                  required
                />
              </div>

              <button
                className="w-full bg-mint px-4 py-2 font-semibold text-white disabled:opacity-40"
                disabled={!authUser}
              >
                Buchung abschliessen
              </button>
            </form>
          </aside>
        </>
      )}
    </section>
  );
}
