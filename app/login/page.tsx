"use client";

import { useState } from "react";
import { login, signup } from "@/lib/actions/auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = mode === "login" ? await login(formData) : await signup(formData);

      if (result && "error" in result) {
        setError(result.error ?? "Unbekannter Fehler");
      } else if (result && "message" in result) {
        setMessage(result.message ?? null);
      } else if (mode === "signup") {
        setError("Registrierung fehlgeschlagen. Bitte Eingaben prüfen.");
      }
    } catch {
      // Successful login triggers a framework redirect error for navigation flow.
      // Do not surface this as a user-facing error.
      if (mode === "login") return;
      setError("Aktion fehlgeschlagen. Bitte versuche es erneut.");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm bg-slate-900/85 border border-slate-700 rounded-2xl shadow-xl shadow-black/30 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-emerald-300">Cards-Vault</h1>

        <div className="flex rounded-lg overflow-hidden border border-slate-700 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "login"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            Registrieren
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              E-Mail
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border border-slate-700 bg-slate-950/80 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Passwort
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              className="w-full border border-slate-700 bg-slate-950/80 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Einladungscode
              </label>
              <input
                name="invite_code"
                type="text"
                required
                autoComplete="off"
                className="w-full border border-slate-700 bg-slate-950/80 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Code eingeben"
              />
              <p className="text-xs text-slate-400 mt-1">
                Groß/Kleinschreibung und Leerzeichen werden ignoriert.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-300 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? "Lädt…" : mode === "login" ? "Anmelden" : "Konto erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
