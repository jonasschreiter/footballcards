import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CardForm from "@/components/CardForm";

export const dynamic = "force-dynamic";

export default async function NewCardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-5 sm:mb-6">
        Neue Karte anlegen
      </h1>
      <CardForm />
    </div>
  );
}
