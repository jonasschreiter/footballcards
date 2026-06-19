"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="bg-slate-950/80 text-slate-100 border-b border-slate-800 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:h-14 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 justify-between">
        <Link
          href="/cards"
          className="inline-flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight hover:text-emerald-300 transition-colors"
        >
          <Image
            src="/cards-vault-logo.png"
            alt="Cards-Vault Logo"
            width={34}
            height={34}
            priority
            className="h-8 w-8 rounded-md object-contain"
          />
          <span>Cards-Vault</span>
        </Link>
        <div className="w-full sm:w-auto flex items-center justify-end gap-2 sm:gap-4 text-sm">
          {email ? (
            <>
              <Link
                href="/cards/new"
                className="hover:text-emerald-300 transition-colors px-2 py-1 rounded-md border border-emerald-400/30 bg-emerald-500/10"
              >
                + Neue Karte
              </Link>
              <span className="text-slate-400 hidden lg:inline max-w-52 truncate">{email}</span>
              <button
                onClick={handleLogout}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded font-semibold transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-emerald-300 transition-colors">
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
