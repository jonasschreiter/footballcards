"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCard, updateCard } from "@/lib/actions/cards";
import type { Card, CardInsert } from "@/lib/types";

interface Props {
  card?: Card;
}

const CONDITIONS: { value: Card["condition"]; label: string }[] = [
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "poor", label: "Poor" },
];

export default function CardForm({ card }: Props) {
  const router = useRouter();
  const isEdit = !!card;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data: CardInsert = {
      player_name: fd.get("player_name") as string,
      team: fd.get("team") as string,
      year: parseInt(fd.get("year") as string, 10),
      condition: fd.get("condition") as Card["condition"],
      notes: (fd.get("notes") as string) || null,
      image_url: (fd.get("image_url") as string) || null,
    };

    try {
      if (isEdit) {
        await updateCard(card.id, data);
      } else {
        await createCard(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Spielername *
          </label>
          <input
            name="player_name"
            required
            defaultValue={card?.player_name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team *
          </label>
          <input
            name="team"
            required
            defaultValue={card?.team}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jahrgang *
          </label>
          <input
            name="year"
            type="number"
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            defaultValue={card?.year ?? new Date().getFullYear()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zustand *
          </label>
          <select
            name="condition"
            required
            defaultValue={card?.condition ?? "excellent"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bild-URL
        </label>
        <input
          name="image_url"
          type="url"
          defaultValue={card?.image_url ?? ""}
          placeholder="https://…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notizen
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={card?.notes ?? ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? "Speichert…" : isEdit ? "Speichern" : "Karte anlegen"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
