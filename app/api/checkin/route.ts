import { db, id, json, now, readSession } from "@/lib/server";

export async function POST(request: Request) {
  const session = await readSession(request, "member"); if (!session) return json({ error: "請先登入會員" }, { status: 401 });
  const body = await request.json() as { code?: string; answer?: string };
  const challenge = await db().prepare("SELECT id,title,answer,points FROM challenges WHERE checkpoint_code=? AND is_active=1").bind(body.code?.trim().toUpperCase()).first<{ id: string; title: string; answer: string; points: number }>();
  if (!challenge) return json({ error: "找不到這個關卡碼" }, { status: 404 });
  if (challenge.answer.trim().toLowerCase() !== (body.answer || "").trim().toLowerCase()) return json({ error: "答案還不正確，再觀察一下吧" }, { status: 400 });
  const timestamp = now();
  try {
    await db().batch([
      db().prepare("INSERT INTO checkins (id,member_id,challenge_id,points,checked_in_at) VALUES (?,?,?,?,?)").bind(id("checkin"), session.subject, challenge.id, challenge.points, timestamp),
      db().prepare("INSERT INTO point_transactions (id,member_id,amount,reason,reference_type,reference_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("pts"), session.subject, challenge.points, `完成關卡：${challenge.title}`, "challenge", challenge.id, timestamp),
      db().prepare("UPDATE members SET points=points+?,updated_at=? WHERE id=?").bind(challenge.points, timestamp, session.subject),
    ]);
    return json({ ok: true, points: challenge.points, title: challenge.title });
  } catch { return json({ error: "此關卡已完成，不能重複集點" }, { status: 409 }); }
}
