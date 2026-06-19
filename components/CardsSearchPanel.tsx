"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteCardButton from "@/components/DeleteCardButton";
import type { Card } from "@/lib/types";

const conditionLabel: Record<Card["condition"], string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  poor: "Poor",
};

const conditionColor: Record<Card["condition"], string> = {
  mint: "bg-emerald-900/40 text-emerald-300 border border-emerald-800",
  near_mint: "bg-cyan-900/40 text-cyan-300 border border-cyan-800",
  excellent: "bg-sky-900/40 text-sky-300 border border-sky-800",
  good: "bg-amber-900/40 text-amber-300 border border-amber-800",
  poor: "bg-rose-900/40 text-rose-300 border border-rose-800",
};

interface Props {
  cards: Card[];
}

export default function CardsSearchPanel({ cards }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [rookieOnly, setRookieOnly] = useState(false);

  const teams = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.team))).sort((a, b) =>
      a.localeCompare(b, "de")
    );
  }, [cards]);

  const seasons = useMemo(() => {
    return Array.from(new Set(cards.map((card) => card.year))).sort((a, b) =>
      b.localeCompare(a, "de")
    );
  }, [cards]);

  const filteredCards = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return cards.filter((card) => {
      if (teamFilter !== "all" && card.team !== teamFilter) return false;
      if (seasonFilter !== "all" && card.year !== seasonFilter) return false;
      if (rookieOnly && !card.rookie_card) return false;

      if (!query) return true;

      const haystack = [
        card.player_name,
        card.team,
        card.year,
        card.notes ?? "",
        card.rookie_card ? "rookie" : "",
        conditionLabel[card.condition],
        card.psa_graded && card.psa_grade !== null ? `PSA ${card.psa_grade}` : "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [cards, searchTerm, teamFilter, seasonFilter, rookieOnly]);

  return (
    <>
      <section className="form-reveal form-reveal-2 mb-6 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 shadow-lg shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-3">
          <span className="text-emerald-300 mr-1">◈</span>Suche & Filter
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Suche nach Spieler, Verein, Notiz, PSA..."
            className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:col-span-2"
          />

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Alle Vereine</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <select
            value={seasonFilter}
            onChange={(e) => setSeasonFilter(e.target.value)}
            className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Alle Saisons</option>
            {seasons.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 cursor-pointer hover:border-amber-500/50 transition-colors">
            <input
              type="checkbox"
              checked={rookieOnly}
              onChange={(e) => setRookieOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            Nur Rookie
          </label>
          <p className="text-xs text-slate-400">
            Treffer: {filteredCards.length} von {cards.length}
          </p>
        </div>
      </section>

      {cards.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">🃏</p>
          <p className="text-lg font-medium text-slate-200">Noch keine Karten</p>
          <p className="text-sm mt-1">Lege deine erste Karte an.</p>
          <Link
            href="/cards/new"
            className="inline-block mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Erste Karte anlegen
          </Link>
        </div>
      )}

      {cards.length > 0 && filteredCards.length === 0 && (
        <div className="form-reveal form-reveal-3 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-8 text-center text-slate-400">
          Keine Karten passend zu deinen Filtern gefunden.
        </div>
      )}

      <div className="grid gap-4 justify-start [grid-template-columns:repeat(auto-fill,minmax(260px,340px))]">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => router.push(`/cards/${card.id}`)}
            className="form-reveal form-reveal-4 max-w-[340px] w-full bg-slate-900/80 rounded-2xl shadow-lg shadow-black/20 border border-slate-700/70 p-4 sm:p-5 flex flex-col gap-2 hover:border-slate-500 transition-colors cursor-pointer"
          >
            {card.image_url && (
              <Image
                src={card.image_url}
                alt={`Karte von ${card.player_name}`}
                width={800}
                height={500}
                unoptimized
                className="w-full h-auto max-h-96 object-contain rounded-xl border border-slate-800 mb-2"
              />
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-slate-100 text-base leading-tight">
                  {card.player_name}
                </h2>
                <p className="text-sm text-slate-400">
                  {card.team} · {card.year}
                </p>
                {card.psa_graded && card.psa_grade !== null && (
                  <p className="text-xs text-violet-300 font-semibold mt-1">
                    PSA {card.psa_grade}
                  </p>
                )}
                {card.rookie_card && (
                  <p className="inline-flex w-fit text-xs text-amber-300 font-semibold mt-1 rounded-lg border border-amber-700/70 bg-amber-950/40 px-2 py-0.5">
                    Rookie
                  </p>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${conditionColor[card.condition]}`}
              >
                {conditionLabel[card.condition]}
              </span>
            </div>

            {card.notes && <p className="text-xs text-slate-500 line-clamp-2">{card.notes}</p>}

            <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800">
              <Link
                href={`/cards/${card.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-center text-sm text-emerald-300 hover:text-emerald-200 font-medium transition-colors py-2 rounded-md hover:bg-emerald-500/10"
              >
                Details
              </Link>
              <Link
                href={`/cards/${card.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-center text-sm text-cyan-300 hover:text-cyan-200 font-medium transition-colors py-2 rounded-md hover:bg-cyan-500/10"
              >
                Bearbeiten
              </Link>
              <DeleteCardButton id={card.id} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
