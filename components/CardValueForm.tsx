"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCard } from "@/lib/actions/cards";

interface Props {
  id: string;
  purchasePrice: number | null;
  currentValue: number | null;
}

function parseCurrency(input: string): number | null {
  const normalized = input.replace(",", ".").trim();
  if (!normalized) return null;
  const value = Number.parseFloat(normalized);
  if (Number.isNaN(value) || value < 0) return null;
  return Number(value.toFixed(2));
}

export default function CardValueForm({ id, purchasePrice, currentValue }: Props) {
  const router = useRouter();
  const [purchase, setPurchase] = useState(purchasePrice?.toString() ?? "");
  const [value, setValue] = useState(currentValue?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profit =
    parseCurrency(value) !== null && parseCurrency(purchase) !== null
      ? Number((parseCurrency(value)! - parseCurrency(purchase)!).toFixed(2))
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const purchaseParsed = parseCurrency(purchase);
    const valueParsed = parseCurrency(value);

    if (purchase && purchaseParsed === null) {
      setError("Einkaufspreis muss eine positive Zahl sein.");
      setLoading(false);
      return;
    }

    if (value && valueParsed === null) {
      setError("Aktueller Wert muss eine positive Zahl sein.");
      setLoading(false);
      return;
    }

    try {
      await updateCard(id, {
        purchase_price: purchaseParsed,
        current_value: valueParsed,
      });
      setMessage("Werte gespeichert.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-reveal form-reveal-3 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
        <span className="text-emerald-300 mr-1">€</span>Wertentwicklung
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
            Einkaufspreis (€)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={purchase}
            onChange={(e) => setPurchase(e.target.value)}
            className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="z.B. 45.00"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
            Aktueller Wert (€)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="z.B. 89.99"
          />
        </div>
      </div>

      {profit !== null && (
        <p className={`text-sm font-medium ${profit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {profit >= 0 ? "Gewinn" : "Verlust"}: {profit.toFixed(2)} €
        </p>
      )}

      {error && <p className="text-sm text-rose-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-60 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        {loading ? "Speichert…" : "Werte speichern"}
      </button>
    </form>
  );
}
