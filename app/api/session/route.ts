import { env } from "cloudflare:workers";
import { db, json, makeSession, readSession, sessionCookie, clearSessionCookie, verifyPin } from "@/lib/server";

export async function GET(request: Request) {
  const admin = await readSession(request, "admin");
  const member = await readSession(request, "member");
  return json({ admin, member });
}

export async function POST(request: Request) {
  const body = await request.json() as { role?: string; email?: string; password?: string; memberCode?: string; pin?: string };
  if (body.role === "admin") {
    const email = env.ADMIN_EMAIL || "admin@wenshan.demo";
    const password = env.ADMIN_PASSWORD || "WenshanDemo!2026";
    const demoAllowed = env.DEMO_MODE !== "false";
    if (body.email !== email || body.password !== password || (!env.ADMIN_PASSWORD && !demoAllowed)) return json({ error: "帳號或密碼錯誤" }, { status: 401 });
    const token = await makeSession("admin", email, "活動管理員");
    return json({ ok: true, demo: !env.ADMIN_PASSWORD }, { headers: { "Set-Cookie": sessionCookie("admin", token) } });
  }
  if (body.role === "member") {
    try {
      const member = await db().prepare("SELECT id,name,pin_hash AS pinHash,status FROM members WHERE member_code=?").bind(body.memberCode?.trim().toUpperCase()).first<{ id: string; name: string; pinHash: string; status: string }>();
      if (!member || member.status !== "active" || !(await verifyPin(body.pin || "", member.pinHash))) return json({ error: "會員編號或 PIN 錯誤" }, { status: 401 });
      const token = await makeSession("member", member.id, member.name);
      return json({ ok: true }, { headers: { "Set-Cookie": sessionCookie("member", token) } });
    } catch { 
      if (env.DEMO_MODE !== "false" && body.memberCode?.toUpperCase() === "WENSHAN001" && body.pin === "2026") {
        const token = await makeSession("member", "member-demo-wen", "陳小文（示範會員）");
        return json({ ok: true, demo: true }, { headers: { "Set-Cookie": sessionCookie("member", token) } });
      }
      return json({ error: "會員資料庫尚未初始化" }, { status: 503 });
    }
  }
  return json({ error: "不支援的登入類型" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const role = new URL(request.url).searchParams.get("role") === "admin" ? "admin" : "member";
  return json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie(role) } });
}
