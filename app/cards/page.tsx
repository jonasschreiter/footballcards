import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import type { Card } from "@/lib/types";
import DeleteCardButton from "@/components/DeleteCardButton";

const conditionLabel: Record<Card["condition"], string> = {
  mint: "Mint",
  near_mint: "Near Mint",
  excellent: "Excellent",
  good: "Good",
  poor: "Poor",
};

const conditionColor: Record<Card["condition"], string> = {
  mint: "bg-emerald-100 text-emerald-800",
  near_mint: "bg-blue-100 text-blue-800",
  excellent: "bg-sky-100 text-sky-800",
  good: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default async function CardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Meine Karten</h1>
        <Link
          href="/cards/new"
          className="inline-flex items-center justify-center bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          + Neue Karte
        </Link>
      </div>

      {cards && cards.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">🃏</p>
          <p className="text-lg font-medium">Noch keine Karten</p>
          <p className="text-sm mt-1">Lege deine erste Karte an.</p>
          <Link
            href="/cards/new"
            className="inline-block mt-4 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Erste Karte anlegen
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards?.map((card: Card) => (
          <div
            key={card.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col gap-2 hover:shadow-md transition-shadow"
          >
            {card.image_url && (
              <Image
                src={card.image_url}
                alt={`Karte von ${card.player_name}`}
                width={800}
                height={500}
                unoptimized
                className="w-full h-auto max-h-96 object-contain rounded-xl border border-gray-100 mb-2"
              />
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-900 text-base leading-tight">
                  {card.player_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {card.team} · {card.year}
                </p>
                {card.psa_graded && card.psa_grade !== null && (
                  <p className="text-xs text-violet-700 font-semibold mt-1">
                    PSA {card.psa_grade}
                  </p>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${conditionColor[card.condition]}`}
              >
                {conditionLabel[card.condition]}
              </span>
            </div>

            {card.notes && (
              <p className="text-xs text-gray-400 line-clamp-2">{card.notes}</p>
            )}

            <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
              <Link
                href={`/cards/${card.id}/edit`}
                className="flex-1 text-center text-sm text-green-700 hover:text-green-900 font-medium transition-colors py-2 rounded-md hover:bg-green-50"
              >
                Bearbeiten
              </Link>
              <DeleteCardButton id={card.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
