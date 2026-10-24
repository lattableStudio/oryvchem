import { buildLlmsFull } from "@/lib/llms";

export const revalidate = 300;

export async function GET() {
  return new Response(await buildLlmsFull(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=600" },
  });
}
