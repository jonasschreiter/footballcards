import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCardImageUrl } from "@/lib/supabase/storage";
import DeleteCardButton from "@/components/DeleteCardButton";
import CardValueForm from "@/components/CardValueForm";
import type { Card } from "@/lib/types";

export const dynamic = "force-dynamic";

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
  params: Promise<{ id: string }>;
}

export default async function CardDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !card) notFound();

  const typedCard = card as Card;
  const signedImageUrl = await resolveCardImageUrl(supabase, typedCard.image_url);

  return (
    <div className="space-y-6">
      <div className="form-reveal form-reveal-1 border border-slate-700/80 bg-slate-900/65 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">{typedCard.player_name}</h1>
          <p className="text-sm text-slate-400 mt-1">{typedCard.team} · {typedCard.year}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cards/${typedCard.id}/edit`}
            className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Bearbeiten
          </Link>
          <Link
            href="/cards"
            className="inline-flex items-center justify-center text-slate-300 hover:text-slate-100 font-medium px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 transition-colors"
          >
            Zurück
          </Link>
        </div>
      </div>

      <section className="form-reveal form-reveal-2 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 sm:p-5 space-y-4">
        {signedImageUrl && (
          <Image
            src={signedImageUrl}
            alt={`Karte von ${typedCard.player_name}`}
            width={960}
            height={640}
            unoptimized
            className="w-full h-auto max-h-[560px] object-contain rounded-xl border border-slate-700"
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${conditionColor[typedCard.condition]}`}>
            {conditionLabel[typedCard.condition]}
          </span>
          {typedCard.rookie_card && (
            <span className="inline-flex text-xs text-amber-300 font-semibold rounded-lg border border-amber-700/70 bg-amber-950/40 px-2 py-1">
              Rookie
            </span>
          )}
          {typedCard.psa_graded && typedCard.psa_grade !== null && (
            <span className="inline-flex text-xs text-violet-300 font-semibold rounded-lg border border-violet-700/70 bg-violet-950/40 px-2 py-1">
              PSA {typedCard.psa_grade}
            </span>
          )}
        </div>

        {typedCard.notes && (
          <p className="text-sm text-slate-300 rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5">
            {typedCard.notes}
          </p>
        )}
      </section>

      <CardValueForm
        id={typedCard.id}
        purchasePrice={typedCard.purchase_price}
        currentValue={typedCard.current_value}
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3">
        <DeleteCardButton id={typedCard.id} />
      </div>
    </div>
  );
}
