import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCardImageUrl } from "@/lib/supabase/storage";
import Link from "next/link";

export const dynamic = "force-dynamic";
import CardForm from "@/components/CardForm";
import CardValueForm from "@/components/CardValueForm";
import type { Card } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCardPage({ params }: Props) {
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
  const previewImageUrl = await resolveCardImageUrl(supabase, typedCard.image_url);

  return (
    <div className="space-y-6">
      <div className="form-reveal form-reveal-1 border border-slate-700/80 bg-slate-900/65 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Karte bearbeiten</h1>
          <p className="text-sm text-slate-400 mt-1">{typedCard.player_name} · {typedCard.team} · {typedCard.year}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cards/${typedCard.id}`}
            className="inline-flex items-center justify-center text-slate-300 hover:text-slate-100 font-medium px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 transition-colors"
          >
            Zur Detailseite
          </Link>
          <Link
            href="/cards"
            className="inline-flex items-center justify-center text-slate-300 hover:text-slate-100 font-medium px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 transition-colors"
          >
            Zurück
          </Link>
        </div>
      </div>

      <CardForm card={typedCard} previewImageUrl={previewImageUrl} />
      <div className="mt-6 max-w-2xl">
        <CardValueForm
          id={typedCard.id}
          purchasePrice={typedCard.purchase_price}
          currentValue={typedCard.current_value}
        />
      </div>
    </div>
  );
}
