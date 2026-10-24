import { db } from "./db";

/** Shared, database-backed hit counter (works across serverless instances). Falls back to memory without a DB. */
const mem = new Map<string, number[]>();

export function clientIp(h: Headers): string {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function count(key: string, windowSec: number): Promise<number> {
  const sql = await db().catch(() => null);
  if (sql) {
    const [r] = await sql<{ n: number }[]>`select count(*)::int n from rate_limits where key = ${key} and at > now() - make_interval(secs => ${windowSec})`;
    return r?.n ?? 0;
  }
  const now = Date.now();
  const recent = (mem.get(key) ?? []).filter((t) => now - t < windowSec * 1000);
  mem.set(key, recent);
  return recent.length;
}

/** Number of recorded hits for `key` within the window. */
export async function hits(key: string, windowSec: number): Promise<number> {
  try {
    return await count(key, windowSec);
  } catch (e) {
    console.error("[ratelimit] count failed", e);
    return 0; // fail open: never lock real users out because the limiter broke
  }
}

export async function record(key: string): Promise<void> {
  try {
    const sql = await db().catch(() => null);
    if (sql) {
      await sql`insert into rate_limits (key) values (${key})`;
      if (Math.random() < 0.02) await sql`delete from rate_limits where at < now() - interval '1 day'`;
    } else {
      mem.set(key, [...(mem.get(key) ?? []), Date.now()]);
    }
  } catch (e) {
    console.error("[ratelimit] record failed", e);
  }
}
