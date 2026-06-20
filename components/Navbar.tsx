"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function Navbar({ initialEmail }: { initialEmail: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(initialEmail);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    const supabase = createClient();
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
      <div className="w-full px-2 sm:px-4 lg:px-8 xl:px-12 2xl:px-16 py-1.5 sm:h-16 flex items-center justify-end">
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          {email ? (
            <>
              <span className="text-slate-400 hidden lg:inline max-w-52 truncate">{email}</span>
              <button
                onClick={handleLogout}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3 py-1.5 rounded font-semibold transition-colors"
              >
                Abmelden
              </button>
            </>
          ) : pathname !== "/login" ? (
            <a href="/login" className="hover:text-emerald-300 transition-colors">
              Anmelden
            </a>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
