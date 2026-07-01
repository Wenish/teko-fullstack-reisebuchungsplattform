import { FormEvent, useState } from "react";

import type { AuthUser } from "../types";

type AuthPageProps = {
  authUser: AuthUser | null;
  authMessage: string;
  onDismissAuthMessage: () => void;
  onRegister: (payload: { username: string; email: string; password: string }) => Promise<void>;
  onLogin: (payload: { username: string; password: string }) => Promise<void>;
};

export default function AuthPage({ authUser, authMessage, onDismissAuthMessage, onRegister, onLogin }: AuthPageProps) {
  const [register, setRegister] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    await onRegister(register);
    setRegister({ username: "", email: "", password: "" });
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    await onLogin(login);
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-2">
      <form onSubmit={handleRegister} className="border border-slate-200 bg-white p-5 shadow-flat">
        <h2 className="text-xl font-bold">Registrieren</h2>
        <p className="mt-1 text-sm text-slate-600">Neuen Account für Buchungen erstellen.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="register-username" className="mb-1 block text-sm font-semibold">
              Benutzername
            </label>
            <input
              id="register-username"
              className="w-full border border-slate-300 p-2"
              value={register.username}
              onChange={(e) => setRegister((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm font-semibold">
              E-Mail
            </label>
            <input
              id="register-email"
              type="email"
              className="w-full border border-slate-300 p-2"
              value={register.email}
              onChange={(e) => setRegister((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm font-semibold">
              Passwort
            </label>
            <input
              id="register-password"
              type="password"
              className="w-full border border-slate-300 p-2"
              value={register.password}
              onChange={(e) => setRegister((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
        </div>

        <button className="mt-4 bg-ocean px-4 py-2 font-semibold text-white">Registrieren</button>
      </form>

      <form onSubmit={handleLogin} className="border border-slate-200 bg-white p-5 shadow-flat">
        <h2 className="text-xl font-bold">Einloggen</h2>
        <p className="mt-1 text-sm text-slate-600">Basic Auth Login für geschützte Buchungsfunktionen.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="login-username" className="mb-1 block text-sm font-semibold">
              Benutzername
            </label>
            <input
              id="login-username"
              className="w-full border border-slate-300 p-2"
              value={login.username}
              onChange={(e) => setLogin((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-semibold">
              Passwort
            </label>
            <input
              id="login-password"
              type="password"
              className="w-full border border-slate-300 p-2"
              value={login.password}
              onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
        </div>

        <button className="mt-4 bg-mint px-4 py-2 font-semibold text-white">Einloggen</button>

        {authUser && <p className="mt-3 text-sm font-semibold text-mint">Aktiv eingeloggt als {authUser.username}</p>}
        {authMessage && (
          <div className="mt-2 flex items-center justify-between gap-2 border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span>{authMessage}</span>
            <button
              type="button"
              onClick={onDismissAuthMessage}
              aria-label="Auth Hinweis schließen"
              className="border border-slate-400 px-2 py-0.5 text-xs font-bold hover:bg-slate-100"
            >
              X
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
