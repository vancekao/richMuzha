import { env } from "cloudflare:workers";

export type SessionRole = "admin" | "member";
type Session = { role: SessionRole; subject: string; name: string; exp: number };

export function db(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function signature(value: string) {
  const secret = env.AUTH_SECRET || (env.DEMO_MODE !== "false" ? "demo-only-change-before-production" : "");
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

export async function makeSession(role: SessionRole, subject: string, name: string) {
  const data: Session = { role, subject, name, exp: Date.now() + 1000 * 60 * 60 * (role === "admin" ? 8 : 24 * 14) };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  return `${encoded}.${await signature(encoded)}`;
}

export async function readSession(request: Request, expected: SessionRole): Promise<Session | null> {
  const name = expected === "admin" ? "rmz_admin" : "rmz_member";
  const raw = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`))?.slice(name.length + 1);
  if (!raw) return null;
  const [encoded, provided] = raw.split(".");
  if (!encoded || !provided || (await signature(encoded)) !== provided) return null;
  try {
    const value = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const session = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)))) as Session;
    return session.role === expected && session.exp > Date.now() ? session : null;
  } catch { return null; }
}

export function sessionCookie(role: SessionRole, token: string) {
  const name = role === "admin" ? "rmz_admin" : "rmz_member";
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${role === "admin" ? 28800 : 1209600}; Secure`;
}

export function clearSessionCookie(role: SessionRole) {
  const name = role === "admin" ? "rmz_admin" : "rmz_member";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers || {}) } });
}

export async function verifyPin(pin: string, stored: string) {
  if (stored.startsWith("demo:")) return env.DEMO_MODE !== "false" && pin === stored.slice(5);
  const [iterationsText, salt64, expected] = stored.split(":");
  const iterations = Number(iterationsText);
  if (!iterations || !salt64 || !expected) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations, salt: Uint8Array.from(atob(salt64), (c) => c.charCodeAt(0)) }, key, 256);
  return bytesToBase64Url(new Uint8Array(bits)) === expected;
}

export function id(prefix: string) { return `${prefix}_${crypto.randomUUID()}`; }
export function now() { return new Date().toISOString(); }
