import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveCardImageUrl } from "@/lib/supabase/storage";

export const dynamic = "force-dynamic";
import type { Card } from "@/lib/types";
import CardsSearchPanel from "@/components/CardsSearchPanel";

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

  const cardsWithSignedImageUrl = await Promise.all(
    ((cards ?? []) as Card[]).map(async (card) => ({
      ...card,
      image_url: await resolveCardImageUrl(supabase, card.image_url),
    }))
  );

  return (
    <div className="space-y-6">
      <div className="form-reveal form-reveal-1 border border-slate-700/80 bg-slate-900/65 rounded-2xl px-2 py-2 sm:px-3 sm:py-2.5 shadow-lg shadow-black/20 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-full h-24 sm:h-28 overflow-hidden">
          <Image
            src="/cards-vault-logo.png"
            alt="Cards-Vault Logo"
            width={520}
            height={240}
            priority
            className="h-full w-auto max-w-full object-contain"
          />
        </div>
        <Link
          href="/cards/new"
          className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors w-full sm:w-auto"
        >
          + Neue Karte
        </Link>
      </div>

      <CardsSearchPanel cards={cardsWithSignedImageUrl} />
    </div>
  );
}
