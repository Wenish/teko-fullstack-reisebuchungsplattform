import { NavLink } from "react-router-dom";

import type { AuthUser } from "../types";

type HeaderProps = {
  authUser: AuthUser | null;
  onLogout: () => void;
};

function navClass({ isActive }: { isActive: boolean }) {
  return `px-3 py-2 text-sm font-semibold transition ${
    isActive ? "bg-ink text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"
  }`;
}

export default function Header({ authUser, onLogout }: HeaderProps) {
  const isLoggedIn = Boolean(authUser);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reisebuchungsplattform</h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/angebote" className={navClass}>
            Angebote
          </NavLink>
          <NavLink to="/buchungen" className={navClass}>
            Buchungen
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <span className="border border-mint bg-green-50 px-3 py-2 text-xs font-semibold text-mint">
                Eingeloggt als {authUser?.username}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="border border-coral bg-red-50 px-3 py-2 text-xs font-semibold text-coral">Nicht eingeloggt</span>
              <NavLink to="/auth" className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Login
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
