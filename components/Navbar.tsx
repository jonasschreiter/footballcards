"use client";

import Link from "next/link";
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
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:h-14 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 justify-between">
        <Link
          href="/cards"
          className="font-bold text-base sm:text-lg tracking-tight hover:text-green-200 transition-colors"
        >
          ⚽ Karten-Katalog
        </Link>
        <div className="w-full sm:w-auto flex items-center justify-end gap-2 sm:gap-4 text-sm">
          {email ? (
            <>
              <Link
                href="/cards/new"
                className="hover:text-green-200 transition-colors px-2 py-1 rounded-md border border-green-500/30"
              >
                + Neue Karte
              </Link>
              <span className="text-green-200 hidden lg:inline max-w-52 truncate">{email}</span>
              <button
                onClick={handleLogout}
                className="bg-green-800 hover:bg-green-900 px-3 py-1.5 rounded transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-green-200 transition-colors">
              Anmelden
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
