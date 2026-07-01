export type OfferType = "flight" | "hotel" | "car";

export type Offer = {
  id: number;
  title: string;
  offer_type: OfferType;
  location: string;
  rating: string;
  base_price: string;
  dynamic_unit_price: string;
  available_units: number;
  provider: {
    id: number;
    name: string;
  };
};

export type Booking = {
  id: number;
  reference: string;
  offer: Offer;
  customer_name: string;
  customer_email: string;
  quantity: number;
  total_price: string;
  status: "active" | "canceled";
  payment_status: "unpaid" | "paid" | "refunded";
  created_at: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};
