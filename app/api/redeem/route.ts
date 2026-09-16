import { db, id, json, now, readSession } from "@/lib/server";

export async function POST(request: Request) {
  const session = await readSession(request, "member"); if (!session) return json({ error: "請先登入會員" }, { status: 401 });
  const { prizeId } = await request.json() as { prizeId?: string };
  const prize = await db().prepare("SELECT id,name,points_cost AS pointsCost,stock FROM prizes WHERE id=? AND is_active=1").bind(prizeId).first<{ id: string; name: string; pointsCost: number; stock: number }>();
  const member = await db().prepare("SELECT points FROM members WHERE id=? AND status='active'").bind(session.subject).first<{ points: number }>();
  if (!prize || prize.stock < 1) return json({ error: "獎品已兌換完畢" }, { status: 409 });
  if (!member || member.points < prize.pointsCost) return json({ error: "旅點不足" }, { status: 409 });
  const timestamp = now(); const redemptionId = id("redeem"); const claimCode = `WS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db().batch([
    db().prepare("INSERT INTO redemptions (id,member_id,prize_id,points_cost,claim_code,status,requested_at,note) VALUES (?,?,?,?,?,'pending',?,'')").bind(redemptionId, session.subject, prize.id, prize.pointsCost, claimCode, timestamp),
    db().prepare("UPDATE members SET points=points-?,updated_at=? WHERE id=? AND points>=?").bind(prize.pointsCost, timestamp, session.subject, prize.pointsCost),
    db().prepare("UPDATE prizes SET stock=stock-1,updated_at=? WHERE id=? AND stock>0").bind(timestamp, prize.id),
    db().prepare("INSERT INTO point_transactions (id,member_id,amount,reason,reference_type,reference_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("pts"), session.subject, -prize.pointsCost, `兌換獎品：${prize.name}`, "redemption", redemptionId, timestamp),
  ]);
  return json({ ok: true, claimCode });
}
