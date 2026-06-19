"use client";

import { useTransition } from "react";
import { deleteCard } from "@/lib/actions/cards";

export default function DeleteCardButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!confirm("Karte wirklich löschen?")) return;
    startTransition(async () => {
      await deleteCard(id);
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex-1 text-center text-sm text-rose-300 hover:text-rose-200 font-medium transition-colors disabled:opacity-50"
    >
      {isPending ? "Löscht…" : "Löschen"}
    </button>
  );
}
