"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createCard, updateCard } from "@/lib/actions/cards";
import type { Card, CardInsert } from "@/lib/types";

interface Props {
  card?: Card;
  previewImageUrl?: string | null;
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

export default function CardForm({ card, previewImageUrl }: Props) {
  const router = useRouter();
  const isEdit = !!card;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | null>(null);
  const [analysisDone, setAnalysisDone] = useState(isEdit);
  const [playerName, setPlayerName] = useState(card?.player_name ?? "");
  const [team, setTeam] = useState(card?.team ?? "");
  const [year, setYear] = useState<string>(card?.year ?? "");
  const [condition, setCondition] = useState<Card["condition"]>(card?.condition ?? "excellent");
  const [notes, setNotes] = useState(card?.notes ?? "");
  const [rookieCard, setRookieCard] = useState(card?.rookie_card ?? false);
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
          year: string | null;
          condition: Card["condition"] | null;
          rookie_card: boolean | null;
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
      if (payload.data.year) setYear(payload.data.year);
      if (payload.data.condition) setCondition(payload.data.condition);
      if (payload.data.notes) setNotes(payload.data.notes);
      if (payload.data.rookie_card !== null) setRookieCard(payload.data.rookie_card);

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

    const isPsaGraded = fd.get("psa_graded") === "on";
    const isRookieCard = fd.get("rookie_card") === "on";
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
      const uploadFd = new FormData();
      uploadFd.append("image", imageFile);

      const uploadResponse = await fetch("/api/cards/upload-image", {
        method: "POST",
        body: uploadFd,
      });

      const uploadPayload = (await uploadResponse.json()) as {
        error?: string;
        path?: string;
      };

      if (!uploadResponse.ok || !uploadPayload.path) {
        setError(uploadPayload.error ?? "Bild-Upload fehlgeschlagen.");
        setLoading(false);
        return;
      }

      imageUrl = uploadPayload.path;
    }

    const data: CardInsert = {
      player_name: playerName,
      team,
      year,
      condition,
      rookie_card: isRookieCard,
      psa_graded: isPsaGraded,
      psa_grade: psaGrade,
      purchase_price: card?.purchase_price ?? null,
      current_value: card?.current_value ?? null,
      notes: notes.trim() || null,
      image_url: imageUrl,
    };

    try {
      if (isEdit) {
        await updateCard(card.id, data);
      } else {
        await createCard(data);
      }
      setSaved(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      router.push("/cards");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
      setSaved(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 max-w-2xl w-full pb-24 sm:pb-0">
      {/* Hidden file input – always present so the submit path can read it */}
      <input
        id="image_file_input"
        name="image_file"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setAnalysisDone(false);
            void recognizeCard(file);
          }
        }}
      />

      {/* Scan button – shown before first scan on new card */}
      {!isEdit && !showDataFields && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <button
            type="button"
            onClick={() => document.getElementById("image_file_input")?.click()}
            className="group relative flex flex-col items-center gap-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-slate-800/80 to-slate-900/90 px-12 py-10 shadow-2xl shadow-black/40 hover:border-emerald-400/60 hover:shadow-emerald-900/30 transition-all duration-300 active:scale-95"
          >
            <span className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/20 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-emerald-300 group-hover:text-emerald-200 transition-colors">
                <path d="M3 9V6a2 2 0 0 1 2-2h2" />
                <path d="M15 4h2a2 2 0 0 1 2 2v3" />
                <path d="M21 15v3a2 2 0 0 1-2 2h-2" />
                <path d="M9 20H7a2 2 0 0 1-2-2v-3" />
                <rect x="7" y="7" width="10" height="10" rx="1" />
              </svg>
            </span>
            <span className="text-center">
              <span className="block text-xl font-bold text-slate-100 group-hover:text-white transition-colors">Karte scannen</span>
              <span className="block text-sm text-slate-400 mt-1 group-hover:text-slate-300 transition-colors">Foto aufnehmen oder auswählen</span>
            </span>
          </button>
          {recognizing && (
            <p className="text-sm text-emerald-300 mt-8 animate-pulse">Karte wird erkannt…</p>
          )}
        </div>
      )}

      {/* After scan: show small re-scan link + confidence */}
      {showDataFields && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => document.getElementById("image_file_input")?.click()}
            className="text-xs text-slate-400 hover:text-emerald-300 transition-colors underline underline-offset-2"
          >
            Anderes Bild wählen
          </button>
          {recognitionConfidence !== null && !recognizing && (
            <span className="text-xs text-slate-500">
              Erkennungs-Sicherheit: {Math.round(recognitionConfidence * 100)}%
            </span>
          )}
          {recognizing && (
            <span className="text-xs text-emerald-300 animate-pulse">Karte wird erkannt…</span>
          )}
        </div>
      )}

      {/* Edit mode: file picker inline */}
      {isEdit && (
        <div className="form-reveal form-reveal-1 border border-slate-700/80 bg-slate-900/65 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/20">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
            <span className="text-emerald-300 mr-1">◈</span>Bild ersetzen
          </label>
          <button
            type="button"
            onClick={() => document.getElementById("image_file_input")?.click()}
            className="w-full border border-slate-700 bg-slate-950/70 text-slate-300 hover:text-slate-100 rounded-xl px-4 py-2.5 text-sm text-left transition-colors"
          >
            Neues Bild auswählen…
          </button>
        </div>
      )}

      {previewImageUrl && (
        <div className="form-reveal form-reveal-2 border border-slate-700/80 bg-slate-900/45 rounded-2xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
            <span className="text-cyan-300 mr-1">◫</span>Aktuelles Bild
          </label>
          <Image
            src={previewImageUrl}
            alt={card?.player_name ? `Karte von ${card.player_name}` : "Kartenbild"}
            width={512}
            height={320}
            unoptimized
            className="w-full h-auto max-h-96 object-contain rounded-xl border border-slate-700"
          />
        </div>
      )}

      {showDataFields && (
        <>
          <div className="form-reveal form-reveal-3 grid sm:grid-cols-2 gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 sm:p-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
                <span className="text-emerald-300 mr-1">◉</span>Spielername *
              </label>
              <input
                name="player_name"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
                <span className="text-cyan-300 mr-1">◆</span>Team *
              </label>
              <input
                name="team"
                required
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="form-reveal form-reveal-4 grid sm:grid-cols-2 gap-4 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 sm:p-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
                <span className="text-violet-300 mr-1">◍</span>Saison *
              </label>
              <select
                name="year"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
                <span className="text-amber-300 mr-1">◌</span>Zustand *
              </label>
              <select
                name="condition"
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value as Card["condition"])}
                className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-reveal form-reveal-5 space-y-4 border border-slate-700/80 bg-slate-900/70 rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">
              <span className="text-emerald-300 mr-1">✦</span>Zusätzliche Merkmale
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-slate-200 cursor-pointer hover:border-amber-500/50 transition-colors">
                <input
                  name="rookie_card"
                  type="checkbox"
                  checked={rookieCard}
                  onChange={(e) => setRookieCard(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-400 focus:ring-amber-400"
                />
                Rookie Card
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm font-medium text-slate-200 cursor-pointer hover:border-emerald-500/50 transition-colors">
                <input
                  name="psa_graded"
                  type="checkbox"
                  checked={psaGraded}
                  onChange={(e) => setPsaGraded(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                />
                PSA-Grade
              </label>
            </div>

            {psaGraded && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
                  PSA Grade
                </label>
                <select
                  name="psa_grade"
                  required={psaGraded}
                  value={psaGrade ?? ""}
                  onChange={(e) =>
                    setPsaGrade(e.target.value ? Number.parseInt(e.target.value, 10) : null)
                  }
                  className="premium-field w-full sm:w-56 border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <div className="form-reveal form-reveal-6 rounded-2xl border border-slate-700/70 bg-slate-900/45 p-4 sm:p-5">
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-300 mb-2">
              <span className="text-cyan-300 mr-1">✎</span>Notizen
            </label>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="premium-field w-full border border-slate-700 bg-slate-950/70 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-300 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {showDataFields && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-700/80 bg-slate-950/95 backdrop-blur px-3 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <button
              type="submit"
              disabled={loading || recognizing}
              className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-60 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              {saved ? "Gespeichert" : loading ? "Speichert…" : isEdit ? "Speichern" : "Karte anlegen"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/cards")}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-200"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <div className="hidden sm:flex flex-col-reverse sm:flex-row gap-3 pt-1">
        {showDataFields && (
          <button
            type="submit"
            disabled={loading || recognizing}
            className="bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 disabled:opacity-60 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition-colors w-full sm:w-auto"
          >
            {saved ? "Gespeichert" : loading ? "Speichert…" : isEdit ? "Speichern" : "Karte anlegen"}
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/cards")}
          className="text-slate-300 hover:text-slate-100 font-medium px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/50 transition-colors w-full sm:w-auto"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
