import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "oryv_admin";
const TTL_S = 60 * 60 * 12;

function secret(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return process.env.ADMIN_SECRET ?? `oryvchem:${pw}`;
}
const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("hex");

export function adminEnabled(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = createHmac("sha256", "cmp").update(input).digest();
  const b = createHmac("sha256", "cmp").update(pw).digest();
  return timingSafeEqual(a, b);
}

export async function startSession() {
  const key = secret();
  if (!key) return;
  const exp = String(Math.floor(Date.now() / 1000) + TTL_S);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: TTL_S,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, mac] = v.split(".");
  if (!exp || !mac || Number(exp) < Date.now() / 1000) return false;
  const good = sign(exp, key);
  return mac.length === good.length && timingSafeEqual(Buffer.from(mac), Buffer.from(good));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
