import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import Header from "./Header";

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("shows login button on the right when user is logged out", () => {
    render(
      <MemoryRouter>
        <Header authUser={null} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Nicht eingeloggt")).toBeInTheDocument();
  });

  it("hides login and shows logout when user is logged in", () => {
    render(
      <MemoryRouter>
        <Header authUser={{ id: 1, username: "max", email: "max@example.com" }} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText("Login")).not.toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.getByText("Eingeloggt als max")).toBeInTheDocument();
  });

  it("renders malicious username as text, not as HTML", () => {
    const { container } = render(
      <MemoryRouter>
        <Header authUser={{ id: 1, username: "<img src=x onerror=alert(1)>", email: "x@example.com" }} onLogout={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Eingeloggt als <img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img[src='x']")).not.toBeInTheDocument();
  });
});
