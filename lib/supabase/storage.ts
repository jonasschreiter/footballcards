import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "card-images";
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60;

function extractStoragePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const markers = [
      `/storage/v1/object/public/${STORAGE_BUCKET}/`,
      `/storage/v1/object/authenticated/${STORAGE_BUCKET}/`,
      `/storage/v1/object/sign/${STORAGE_BUCKET}/`,
    ];

    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    if (!marker) return null;

    const index = url.pathname.indexOf(marker);
    if (index === -1) return null;

    const rawPath = url.pathname.slice(index + marker.length);
    return decodeURIComponent(rawPath);
  } catch {
    return null;
  }
}

export async function resolveCardImageUrl(
  supabase: SupabaseClient,
  storedImageValue: string | null,
  expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!storedImageValue) return null;

  const storagePath = extractStoragePath(storedImageValue);

  if (!storagePath) {
    // Keep external image URLs untouched.
    return storedImageValue;
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}
