import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import OffersPage from "./OffersPage";

const offer = {
  id: 1,
  title: "Test Flug",
  offer_type: "flight" as const,
  location: "Paris",
  rating: "4.5",
  base_price: "100.00",
  dynamic_unit_price: "120.00",
  available_units: 10,
  provider: {
    id: 1,
    name: "Sky",
  },
};

describe("OffersPage", () => {
  it("opens booking sidebar after selecting an offer", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OffersPage
          authUser={{ id: 1, username: "max", email: "max@example.com" }}
          offers={[offer]}
          loadingOffers={false}
          filters={{
            type: "",
            location: "",
            min_price: "",
            max_price: "",
            min_rating: "",
          }}
          form={{
            offer_id: 0,
            customer_name: "Max",
            customer_email: "max@example.com",
            quantity: 1,
          }}
          onFilterChange={vi.fn()}
          onFormChange={vi.fn()}
          onSearch={vi.fn(async () => undefined)}
          onBook={vi.fn(async () => true)}
          onSelectOffer={vi.fn()}
        />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /buchung ausw/i }));

    expect(screen.getByRole("heading", { name: "Buchung abschliessen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zur/i })).toBeInTheDocument();
  });

  it("renders potentially malicious offer values as plain text", () => {
    const maliciousOffer = {
      ...offer,
      title: "<script>alert('xss')</script>",
      location: "<img src=x onerror=alert(1)>",
      provider: {
        ...offer.provider,
        name: "<svg onload=alert(1)>",
      },
    };

    const { container } = render(
      <MemoryRouter>
        <OffersPage
          authUser={{ id: 1, username: "max", email: "max@example.com" }}
          offers={[maliciousOffer]}
          loadingOffers={false}
          filters={{
            type: "",
            location: "",
            min_price: "",
            max_price: "",
            min_rating: "",
          }}
          form={{
            offer_id: 1,
            customer_name: "Max",
            customer_email: "max@example.com",
            quantity: 1,
          }}
          onFilterChange={vi.fn()}
          onFormChange={vi.fn()}
          onSearch={vi.fn(async () => undefined)}
          onBook={vi.fn(async () => true)}
          onSelectOffer={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
    expect(screen.getByText("Ort: <img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(screen.getByText("Anbieter: <svg onload=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("img[src='x']")).not.toBeInTheDocument();
    expect(container.querySelector("svg[onload]")).not.toBeInTheDocument();
  });
});
