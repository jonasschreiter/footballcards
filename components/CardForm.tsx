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

const SEASONS = Array.from({ length: 9 }, (_, i) => {
  const startYear = 18 + i;
  const endYear = 19 + i;
  return `${startYear}/${endYear}`;
});

export default function CardForm({ card }: Props) {
  const router = useRouter();
  const isEdit = !!card;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | null>(null);
  const [analysisDone, setAnalysisDone] = useState(isEdit);
  const [playerName, setPlayerName] = useState(card?.player_name ?? "");
  const [team, setTeam] = useState(card?.team ?? "");
  const [year, setYear] = useState<string>(card?.year ?? "");
  const [condition, setCondition] = useState<Card["condition"]>(card?.condition ?? "excellent");
  const [notes, setNotes] = useState(card?.notes ?? "");
  const [psaGraded, setPsaGraded] = useState(card?.psa_graded ?? false);
  const [psaGrade, setPsaGrade] = useState<number | null>(card?.psa_grade ?? null);
  const showDataFields = isEdit || analysisDone;

  async function recognizeCard(imageFile: File) {
    setRecognizing(true);
    setError(null);
    setRecognitionConfidence(null);

    try {
      const recognitionFd = new FormData();
      recognitionFd.append("image", imageFile);

      const response = await fetch("/api/cards/recognize", {
        method: "POST",
        body: recognitionFd,
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          player_name: string | null;
          team: string | null;
          year: number | null;
          condition: Card["condition"] | null;
          psa_graded: boolean | null;
          psa_grade: number | null;
          notes: string | null;
          confidence: number | null;
        };
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Erkennung fehlgeschlagen.");
      }

      if (payload.data.player_name) setPlayerName(payload.data.player_name);
      if (payload.data.team) setTeam(payload.data.team);
      if (payload.data.year) setYear(String(payload.data.year));
      if (payload.data.condition) setCondition(payload.data.condition);
      if (payload.data.notes) setNotes(payload.data.notes);

      if (payload.data.psa_graded !== null) {
        setPsaGraded(payload.data.psa_graded);
      }
      setPsaGrade(payload.data.psa_grade ?? null);
      setRecognitionConfidence(payload.data.confidence ?? null);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Die automatische Erkennung ist fehlgeschlagen."
      );
    } finally {
      setRecognizing(false);
      setAnalysisDone(true);
    }
  }

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

    if (!year || year === "") {
      setError("Bitte wähle eine Saison aus.");
      setLoading(false);
      return;
    }

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
      player_name: playerName,
      team,
      year,
      condition,
      psa_graded: isPsaGraded,
      psa_grade: psaGrade,
      notes: notes.trim() || null,
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
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg w-full">
      <div className="border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bild hochladen *
        </label>
        <input
          name="image_file"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setAnalysisDone(false);
              void recognizeCard(file);
            }
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-green-50 file:text-green-700 file:font-medium"
        />
        {!isEdit && !showDataFields && (
          <p className="text-xs text-gray-600 mt-2">
            Nach dem Upload analysiert die App das Foto und blendet danach alle Felder zum Bearbeiten ein.
          </p>
        )}
        {recognizing && <p className="text-xs text-green-700 mt-2">Erkennung laeuft...</p>}
        {recognitionConfidence !== null && !recognizing && (
          <p className="text-xs text-gray-600 mt-2">
            Erkennungs-Sicherheit: {Math.round(recognitionConfidence * 100)}%
          </p>
        )}
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
            className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200"
          />
        </div>
      )}

      {showDataFields && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spielername *
              </label>
              <input
                name="player_name"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
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
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saison *
              </label>
              <select
                name="year"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="">Saison wählen...</option>
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {season}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zustand *
              </label>
              <select
                name="condition"
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as Card["condition"])}
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
                  value={psaGrade ?? ""}
                  onChange={(e) =>
                    setPsaGrade(e.target.value ? Number.parseInt(e.target.value, 10) : null)
                  }
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        {showDataFields && (
          <button
            type="submit"
            disabled={loading || recognizing}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-5 py-2 rounded-lg transition-colors w-full sm:w-auto"
          >
            {loading ? "Speichert…" : isEdit ? "Speichern" : "Karte anlegen"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors w-full sm:w-auto"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
