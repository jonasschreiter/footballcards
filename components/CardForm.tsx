"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createCard, updateCard } from "@/lib/actions/cards";
import { createClient } from "@/lib/supabase/client";
import type { Card, CardInsert } from "@/lib/types";

interface Props {
  card?: Card;
}

const CONDITIONS: { value: Card["condition"]; label: string }[] = [
  { value: "mint", label: "Mint" },
  { value: "near_mint", label: "Near Mint" },
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "poor", label: "Poor" },
];

export default function CardForm({ card }: Props) {
  const router = useRouter();
  const isEdit = !!card;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [psaGraded, setPsaGraded] = useState(card?.psa_graded ?? false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    const isPsaGraded = fd.get("psa_graded") === "on";
    const rawPsaGrade = fd.get("psa_grade") as string | null;
    const psaGrade =
      isPsaGraded && rawPsaGrade ? Number.parseInt(rawPsaGrade, 10) : null;

    if (isPsaGraded && (psaGrade === null || Number.isNaN(psaGrade))) {
      setError("Bitte waehle einen PSA-Grade zwischen 0 und 10.");
      setLoading(false);
      return;
    }

    let imageUrl = card?.image_url ?? null;
    const imageFile = fd.get("image_file");

    if (imageFile instanceof File && imageFile.size > 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Bitte melde dich erneut an, bevor du ein Bild hochlaedst.");
        setLoading(false);
        return;
      }

      const extension = (imageFile.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const filePath = `${user.id}/${crypto.randomUUID()}.${extension || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("card-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: imageFile.type || undefined,
        });

      if (uploadError) {
        setError(`Bild-Upload fehlgeschlagen: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const data: CardInsert = {
      player_name: fd.get("player_name") as string,
      team: fd.get("team") as string,
      year: parseInt(fd.get("year") as string, 10),
      condition: fd.get("condition") as Card["condition"],
      psa_graded: isPsaGraded,
      psa_grade: psaGrade,
      notes: (fd.get("notes") as string) || null,
      image_url: imageUrl,
    };

    try {
      if (isEdit) {
        await updateCard(card.id, data);
      } else {
        await createCard(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Spielername *
          </label>
          <input
            name="player_name"
            required
            defaultValue={card?.player_name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team *
          </label>
          <input
            name="team"
            required
            defaultValue={card?.team}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      <div className="space-y-3 border border-gray-200 rounded-lg p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            name="psa_graded"
            type="checkbox"
            checked={psaGraded}
            onChange={(e) => setPsaGraded(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
          />
          PSA-Grade?
        </label>

        {psaGraded && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PSA Grade
            </label>
            <select
              name="psa_grade"
              required={psaGraded}
              defaultValue={card?.psa_grade ?? ""}
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option value="">Bitte waehlen</option>
              {Array.from({ length: 11 }, (_, grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jahrgang *
          </label>
          <input
            name="year"
            type="number"
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            defaultValue={card?.year ?? new Date().getFullYear()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Zustand *
          </label>
          <select
            name="condition"
            required
            defaultValue={card?.condition ?? "excellent"}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bild hochladen
        </label>
        <input
          name="image_file"
          type="file"
          accept="image/*"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-green-50 file:text-green-700 file:font-medium"
        />
        <p className="text-xs text-gray-500 mt-1">
          Optional. Wenn du ein Bild auswaehlst, wird es in Supabase Storage gespeichert.
        </p>
      </div>

      {card?.image_url && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aktuelles Bild
          </label>
          <Image
            src={card.image_url}
            alt={`Karte von ${card.player_name}`}
            width={512}
            height={320}
            unoptimized
            className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-200"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notizen
        </label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={card?.notes ?? ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? "Speichert…" : isEdit ? "Speichern" : "Karte anlegen"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
