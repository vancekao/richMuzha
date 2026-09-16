import { demoSnapshot } from "@/lib/demo-data";
import { db, json, readSession } from "@/lib/server";

export async function GET(request: Request) {
  try {
    const database = db();
    const memberSession = await readSession(request, "member");
    const [eventResult, shops, challenges, announcements, prizes] = await Promise.all([
      database.prepare("SELECT id,title,summary,start_at AS startAt,end_at AS endAt,status,hero_image AS heroImage,rules,is_demo AS isDemo FROM events WHERE status='published' AND is_active=1 ORDER BY start_at DESC LIMIT 1").first(),
      database.prepare("SELECT id,event_id AS eventId,name,category,address,phone,description,latitude,longitude,open_hours AS openHours,bonus_points AS bonusPoints,is_demo AS isDemo FROM shops WHERE is_active=1 ORDER BY name").all(),
      database.prepare("SELECT id,event_id AS eventId,shop_id AS shopId,title,category,description,question,points,sort_order AS sortOrder,is_demo AS isDemo FROM challenges WHERE is_active=1 ORDER BY sort_order,title").all(),
      database.prepare("SELECT id,event_id AS eventId,title,content,level,publish_at AS publishAt,is_demo AS isDemo FROM announcements WHERE is_active=1 AND publish_at<=? ORDER BY publish_at DESC").bind(new Date().toISOString()).all(),
      database.prepare("SELECT id,event_id AS eventId,name,description,points_cost AS pointsCost,stock,image_url AS imageUrl,redemption_note AS redemptionNote,is_demo AS isDemo FROM prizes WHERE is_active=1 ORDER BY points_cost").all(),
    ]);
    if (!eventResult) return json(demoSnapshot);
    let member = null; let completedChallengeIds: string[] = []; let redemptions: unknown[] = [];
    if (memberSession) {
      member = await database.prepare("SELECT id,member_code AS memberCode,name,phone,email,points,status,is_demo AS isDemo FROM members WHERE id=? AND status='active'").bind(memberSession.subject).first();
      completedChallengeIds = ((await database.prepare("SELECT challenge_id AS challengeId FROM checkins WHERE member_id=?").bind(memberSession.subject).all()).results as { challengeId: string }[]).map((x) => x.challengeId);
      redemptions = (await database.prepare("SELECT r.id,r.prize_id AS prizeId,p.name AS prizeName,r.points_cost AS pointsCost,r.claim_code AS claimCode,r.status,r.requested_at AS requestedAt,r.verified_at AS verifiedAt,r.note FROM redemptions r JOIN prizes p ON p.id=r.prize_id WHERE r.member_id=? ORDER BY r.requested_at DESC").bind(memberSession.subject).all()).results;
    }
    return json({ demo: Boolean(eventResult.isDemo), event: eventResult, shops: shops.results, challenges: challenges.results, announcements: announcements.results, prizes: prizes.results, member, completedChallengeIds, redemptions });
  } catch (error) {
    console.warn("Public data unavailable; serving marked demo snapshot", error);
    return json(demoSnapshot);
  }
}
