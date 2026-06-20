import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCardImageUrl } from "@/lib/supabase/storage";

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
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-5 sm:mb-6">
        Karte bearbeiten
      </h1>
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
