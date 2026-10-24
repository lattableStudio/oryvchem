import { db } from "./db";

/** Images only. Type is decided from the file's magic bytes, never from the client-supplied mime. */
export const MAX_BYTES = 4 * 1024 * 1024;
export const MAX_FILES = 10;
export const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export type MediaItem = { id: string; filename: string; mime: string; size: number; alt: string; created_at: Date | string };

export function sniffImage(b: Uint8Array): string | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return "image/gif";
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (b.length >= 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

/** Safe display name that always ends in the extension matching the sniffed type. */
export function cleanFilename(name: string, mime: string): string {
  const base = name.split(/[\\/]/).pop() ?? "image";
  const stem = base.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^\w\- ]+/g, "_").replace(/^[_ .-]+|[_ .-]+$/g, "").slice(0, 80);
  return `${stem || "image"}.${EXT[mime]}`;
}

export async function listMedia(): Promise<MediaItem[]> {
  const sql = await db();
  if (!sql) return [];
  return sql<MediaItem[]>`select id, filename, mime, size, alt, created_at from media order by id desc limit 500`;
}

export async function getMediaFile(id: number): Promise<{ mime: string; data: Buffer } | null> {
  const sql = await db();
  if (!sql) return null;
  const [r] = await sql<{ mime: string; data: Buffer }[]>`select mime, data from media where id = ${id}`;
  return r ?? null;
}

/** Validates and stores one uploaded image. Returns the new id or an error message. */
export async function saveUpload(file: File): Promise<{ id: string } | { error: string }> {
  if (file.size > MAX_BYTES) return { error: `${file.name}: larger than 4 MB` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length) return { error: `${file.name}: empty file` };
  const mime = sniffImage(bytes);
  if (!mime) return { error: `${file.name}: not a JPEG, PNG, WebP, GIF or AVIF image` };
  const sql = await db();
  if (!sql) return { error: "Database is not configured" };
  const filename = cleanFilename(file.name, mime);
  const [row] = await sql<{ id: string }[]>`insert into media (filename, mime, size, data) values (${filename}, ${mime}, ${bytes.length}, ${Buffer.from(bytes)}) returning id`;
  return { id: row.id };
}
