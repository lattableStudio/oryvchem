import { getMediaFile } from "@/lib/media";

type P = { params: Promise<{ id: string }> };

// Media bytes never change for a given id (only the alt text does), so they are cached forever.
export async function GET(req: Request, { params }: P) {
  const { id: raw } = await params;
  const id = /^\d{1,15}$/.test(raw) ? Number(raw) : 0;
  if (!id) return new Response("Not found", { status: 404 });
  const etag = `"m${id}"`;
  const headers: Record<string, string> = {
    ETag: etag,
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  let file: Awaited<ReturnType<typeof getMediaFile>> = null;
  try {
    file = await getMediaFile(id);
  } catch (e) {
    console.error("[media] read failed", e);
    return new Response("Unavailable", { status: 503 });
  }
  if (!file) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(file.data), { headers: { ...headers, "Content-Type": file.mime, "Content-Length": String(file.data.length) } });
}
