import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Meine Karten</h1>
        <Link
          href="/cards/new"
          className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          + Neue Karte
        </Link>
      </div>

      <CardsSearchPanel cards={(cards ?? []) as Card[]} />
    </div>
  );
}
