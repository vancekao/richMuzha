import { demoRedemptions } from "@/lib/demo-data";
import { db, json, now, readSession } from "@/lib/server";

async function guard(request: Request) { return await readSession(request, "admin"); }
export async function GET(request: Request) {
  if (!(await guard(request))) return json({ error: "請先登入管理後台" }, { status: 401 });
  try { const result = await db().prepare("SELECT r.id,r.member_id AS memberId,m.name AS memberName,r.prize_id AS prizeId,p.name AS prizeName,r.points_cost AS pointsCost,r.claim_code AS claimCode,r.status,r.requested_at AS requestedAt,r.verified_at AS verifiedAt,r.note FROM redemptions r JOIN members m ON m.id=r.member_id JOIN prizes p ON p.id=r.prize_id ORDER BY r.requested_at DESC").all(); return json({ demo: false, records: result.results }); }
  catch { return json({ demo: true, records: demoRedemptions }); }
}
export async function PATCH(request: Request) {
  const admin = await guard(request); if (!admin) return json({ error: "請先登入管理後台" }, { status: 401 });
  const body = await request.json() as { claimCode?: string; status?: string; note?: string };
  if (!body.claimCode || !["verified","cancelled"].includes(body.status || "")) return json({ error: "核銷資料不完整" }, { status: 400 });
  const result = await db().prepare("UPDATE redemptions SET status=?,verified_at=?,verified_by=?,note=? WHERE claim_code=? AND status='pending'").bind(body.status, now(), admin.subject, body.note || "", body.claimCode.trim().toUpperCase()).run();
  if (!result.meta.changes) return json({ error: "找不到待核銷的兌換單" }, { status: 404 });
  return json({ ok: true });
}
