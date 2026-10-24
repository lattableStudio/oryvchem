import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { MAX_FILES, saveUpload } from "@/lib/media";

// A route handler (not a server action) so uploads aren't capped by the 1 MB action body limit.
// The client sends one file per request to stay under serverless request-size limits.
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });
  const origin = req.headers.get("origin");
  let originHost: string | null = null;
  try { originHost = origin ? new URL(origin).host : null; } catch { return Response.json({ error: "Bad origin" }, { status: 403 }); }
  if (originHost && originHost !== req.headers.get("host")) return Response.json({ error: "Bad origin" }, { status: 403 });
  if (Number(req.headers.get("content-length") ?? 0) > 45 * 1024 * 1024) return Response.json({ error: "Upload too large" }, { status: 413 });
  const files = (await req.formData()).getAll("file").filter((f): f is File => f instanceof File).slice(0, MAX_FILES);
  if (!files.length) return Response.json({ error: "No file" }, { status: 400 });
  const results = [];
  for (const f of files) results.push(await saveUpload(f));
  revalidatePath("/admin/media");
  const errors = results.flatMap((r) => ("error" in r ? [r.error] : []));
  return Response.json({ ids: results.flatMap((r) => ("id" in r ? [r.id] : [])), errors }, { status: errors.length && errors.length === results.length ? 422 : 200 });
}
