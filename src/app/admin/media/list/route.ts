import { isAdmin } from "@/lib/auth";
import { listMedia } from "@/lib/media";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });
  const items = await listMedia();
  return Response.json({ items: items.map((m) => ({ id: m.id, filename: m.filename, alt: m.alt })) }, { headers: { "Cache-Control": "no-store" } });
}
