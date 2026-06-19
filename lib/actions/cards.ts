"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CardInsert, CardUpdate } from "@/lib/types";

export async function createCard(data: CardInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("cards")
    .insert({ ...data, user_id: user.id });

  if (error) throw new Error(error.message);

  revalidatePath("/cards");
}

export async function updateCard(id: string, data: CardUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("cards")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/cards");
}

export async function deleteCard(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/cards");
}
