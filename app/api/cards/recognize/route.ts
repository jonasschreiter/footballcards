import { createClient } from "@/lib/supabase/server";

const CARD_CONDITIONS = ["mint", "near_mint", "excellent", "good", "poor"] as const;

type CardCondition = (typeof CARD_CONDITIONS)[number];

interface RecognitionResult {
  player_name: string | null;
  team: string | null;
  year: string | null;
  condition: CardCondition | null;
  psa_graded: boolean | null;
  psa_grade: number | null;
  notes: string | null;
  confidence: number | null;
}

function isCondition(value: unknown): value is CardCondition {
  return typeof value === "string" && CARD_CONDITIONS.includes(value as CardCondition);
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNullableYear(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1800 || value > 2100) return null;
  return value;
}

function yearToSeason(year: number | null): string | null {
  if (year === null || year < 1800 || year > 2100) return null;
  const startYear = year % 100;
  const endYear = (startYear + 1) % 100;
  return `${String(startYear).padStart(2, "0")}/${String(endYear).padStart(2, "0")}`;
}

function asNullableGrade(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 0 || value > 10) return null;
  return value;
}

function asNullableConfidence(value: unknown): number | null {
  if (typeof value !== "number") return null;
  if (value < 0 || value > 1) return null;
  return value;
}

function normalizeResult(payload: unknown): RecognitionResult {
  const obj = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  const psaGraded = typeof obj.psa_graded === "boolean" ? obj.psa_graded : null;
  const psaGradeRaw = asNullableGrade(obj.psa_grade);

  return {
    player_name: asNullableString(obj.player_name),
    team: asNullableString(obj.team),
    year: yearToSeason(asNullableYear(obj.year)),
    condition: isCondition(obj.condition) ? obj.condition : null,
    psa_graded: psaGraded,
    psa_grade: psaGraded === true ? psaGradeRaw : null,
    notes: asNullableString(obj.notes),
    confidence: asNullableConfidence(obj.confidence),
  };
}

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractStructuredResult(payload: unknown): unknown | null {
  if (typeof payload !== "object" || payload === null) return null;

  const root = payload as Record<string, unknown>;

  if (typeof root.output_text === "string") {
    const parsed = tryParseJson(root.output_text);
    if (parsed !== null) return parsed;
  }

  if (typeof root.output_parsed === "object" && root.output_parsed !== null) {
    return root.output_parsed;
  }

  const output = Array.isArray(root.output) ? root.output : [];

  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];

    for (const part of content) {
      if (typeof part !== "object" || part === null) continue;
      const partObj = part as Record<string, unknown>;

      if (typeof partObj.text === "string") {
        const parsed = tryParseJson(partObj.text);
        if (parsed !== null) return parsed;
      }

      if (typeof partObj.value === "string") {
        const parsed = tryParseJson(partObj.value);
        if (parsed !== null) return parsed;
      }

      if (typeof partObj.parsed === "object" && partObj.parsed !== null) {
        return partObj.parsed;
      }
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

    if (!apiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY ist nicht gesetzt." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return Response.json({ error: "Kein Bild hochgeladen." }, { status: 400 });
    }

    if (!image.type.startsWith("image/")) {
      return Response.json({ error: "Nur Bilddateien sind erlaubt." }, { status: 400 });
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (image.size > maxSizeBytes) {
      return Response.json(
        { error: "Bild ist zu gross. Maximal 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "Du extrahierst Informationen von Fussball-Sammelkarten. Antworte nur mit valider JSON-Struktur gemaess Schema.",
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Analysiere das Bild der Karte und extrahiere: player_name, team, year, condition (mint|near_mint|excellent|good|poor), psa_graded (boolean), psa_grade (0-10 oder null), notes (optional), confidence (0 bis 1). Verwende null fuer unbekannt.",
              },
              {
                type: "input_image",
                image_url: `data:${image.type};base64,${base64}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "card_recognition",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                player_name: { type: ["string", "null"] },
                team: { type: ["string", "null"] },
                year: { type: ["integer", "null"] },
                condition: {
                  type: ["string", "null"],
                  enum: ["mint", "near_mint", "excellent", "good", "poor", null],
                },
                psa_graded: { type: ["boolean", "null"] },
                psa_grade: { type: ["integer", "null"] },
                notes: { type: ["string", "null"] },
                confidence: { type: ["number", "null"] },
              },
              required: [
                "player_name",
                "team",
                "year",
                "condition",
                "psa_graded",
                "psa_grade",
                "notes",
                "confidence",
              ],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `Erkennung fehlgeschlagen: ${errorText}` },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as unknown;
    const parsed = extractStructuredResult(payload);

    if (parsed === null) {
      return Response.json(
        { error: "Modell hat keine strukturierte Antwort geliefert." },
        { status: 502 }
      );
    }

    return Response.json({ data: normalizeResult(parsed) });
  } catch {
    return Response.json({ error: "Interner Fehler bei der Erkennung." }, { status: 500 });
  }
}
