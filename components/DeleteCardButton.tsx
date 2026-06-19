"use client";

import { useTransition } from "react";
import { deleteCard } from "@/lib/actions/cards";

export default function DeleteCardButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Karte wirklich löschen?")) return;
    startTransition(async () => {
      await deleteCard(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex-1 text-center text-sm text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? "Löscht…" : "Löschen"}
    </button>
  );
}
