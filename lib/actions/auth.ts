"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/cards");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const inviteCode = (formData.get("invite_code") as string | null)?.trim() ?? "";
  const requiredInviteCode = process.env.SIGNUP_INVITE_CODE?.trim() ?? "";

  if (!requiredInviteCode) {
    return {
      error:
        "Registrierung ist aktuell deaktiviert (SIGNUP_INVITE_CODE fehlt auf dem Server).",
    };
  }

  if (inviteCode !== requiredInviteCode) {
    return { error: "Einladungscode ist ungültig." };
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  return { message: "Bitte E-Mail bestätigen." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
