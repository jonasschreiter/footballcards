import { createClient } from "@/lib/supabase/server";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const STORAGE_BUCKET = "card-images";

function detectImageMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return "image/jpeg";

  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;
  if (isPng) return "image/png";

  const isGif =
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61;
  if (isGif) return "image/gif";

  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  if (isWebp) return "image/webp";

  return null;
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
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

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size === 0) {
      return Response.json({ error: "Kein Bild hochgeladen." }, { status: 400 });
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return Response.json(
        { error: "Bild ist zu gross. Maximal 10 MB." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    const detectedMimeType = detectImageMimeType(bytes);

    if (!detectedMimeType) {
      return Response.json(
        { error: "Ungueltiges Bildformat. Erlaubt: JPG, PNG, GIF, WEBP." },
        { status: 400 }
      );
    }

    const filePath = `${user.id}/${crypto.randomUUID()}.${extensionForMimeType(detectedMimeType)}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, bytes, {
        cacheControl: "3600",
        upsert: false,
        contentType: detectedMimeType,
      });

    if (uploadError) {
      console.error("Secure image upload failed", { message: uploadError.message });
      return Response.json(
        { error: "Bild-Upload fehlgeschlagen." },
        { status: 502 }
      );
    }

    return Response.json({ path: filePath });
  } catch {
    return Response.json({ error: "Interner Fehler beim Bild-Upload." }, { status: 500 });
  }
}
