import { demoEntities } from "@/lib/demo-data";
import type { EntityType } from "@/lib/types";
import { db, id, json, now, readSession } from "@/lib/server";

const configs: Record<EntityType, { table: string; prefix: string; fields: string[]; required: string[]; numeric?: string[]; boolean?: string[] }> = {
  events: { table: "events", prefix: "evt", fields: ["title","summary","startAt","endAt","status","heroImage","rules","isActive","isDemo"], required: ["title","summary","startAt","endAt"] , boolean: ["isActive","isDemo"] },
  shops: { table: "shops", prefix: "shop", fields: ["eventId","name","category","address","phone","description","latitude","longitude","openHours","bonusPoints","isActive","isDemo"], required: ["name","category","address","description"], numeric: ["bonusPoints"], boolean: ["isActive","isDemo"] },
  challenges: { table: "challenges", prefix: "challenge", fields: ["eventId","shopId","title","category","description","question","answer","checkpointCode","points","sortOrder","isActive","isDemo"], required: ["title","category","description","question","answer","checkpointCode"], numeric: ["points","sortOrder"], boolean: ["isActive","isDemo"] },
  announcements: { table: "announcements", prefix: "notice", fields: ["eventId","title","content","level","publishAt","isActive","isDemo"], required: ["title","content","publishAt"], boolean: ["isActive","isDemo"] },
  prizes: { table: "prizes", prefix: "prize", fields: ["eventId","name","description","pointsCost","stock","imageUrl","redemptionNote","isActive","isDemo"], required: ["name","description","pointsCost"], numeric: ["pointsCost","stock"], boolean: ["isActive","isDemo"] },
  members: { table: "members", prefix: "member", fields: ["memberCode","name","phone","email","points","status","isActive","isDemo"], required: ["memberCode","name","phone"], numeric: ["points"], boolean: ["isActive","isDemo"] },
};
const snake = (value: string) => value.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), typeof value === "number" && (key === "is_active" || key === "is_demo") ? Boolean(value) : value]));
function typeFrom(url: string) { const value = new URL(url).searchParams.get("type") as EntityType; return value in configs ? value : null; }
async function authorized(request: Request) { return Boolean(await readSession(request, "admin")); }

export async function GET(request: Request) {
  if (!(await authorized(request))) return json({ error: "請先登入管理後台" }, { status: 401 });
  const type = typeFrom(request.url); if (!type) return json({ error: "資料類型錯誤" }, { status: 400 });
  try { const result = await db().prepare(`SELECT * FROM ${configs[type].table} ORDER BY updated_at DESC`).all(); return json({ demo: false, records: result.results.map((x) => camel(x as Record<string, unknown>)) }); }
  catch { return json({ demo: true, records: demoEntities[type] }); }
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return json({ error: "請先登入管理後台" }, { status: 401 });
  const type = typeFrom(request.url); if (!type || type === "members") return json({ error: "資料類型不可新增" }, { status: 400 });
  const body = await request.json() as Record<string, unknown>; const config = configs[type];
  if (config.required.some((field) => !String(body[field] ?? "").trim())) return json({ error: "請填寫所有必填欄位" }, { status: 400 });
  const values: Record<string, unknown> = { ...body, id: id(config.prefix), createdAt: now(), updatedAt: now(), isActive: body.isActive ?? true, isDemo: body.isDemo ?? false };
  const fields = ["id", ...config.fields, "createdAt", "updatedAt"].filter((field, i, list) => list.indexOf(field) === i);
  const params = fields.map((field) => config.boolean?.includes(field) ? (values[field] ? 1 : 0) : config.numeric?.includes(field) ? Number(values[field] || 0) : values[field] ?? null);
  await db().prepare(`INSERT INTO ${config.table} (${fields.map(snake).join(",")}) VALUES (${fields.map(() => "?").join(",")})`).bind(...params).run();
  return json({ ok: true, id: values.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await authorized(request))) return json({ error: "請先登入管理後台" }, { status: 401 });
  const type = typeFrom(request.url); if (!type) return json({ error: "資料類型錯誤" }, { status: 400 });
  const body = await request.json() as Record<string, unknown>; if (!body.id) return json({ error: "缺少資料 ID" }, { status: 400 });
  const config = configs[type]; const fields = config.fields.filter((field) => field in body);
  if (!fields.length) return json({ error: "沒有可更新欄位" }, { status: 400 });
  const params = fields.map((field) => config.boolean?.includes(field) ? (body[field] ? 1 : 0) : config.numeric?.includes(field) ? Number(body[field] || 0) : body[field] ?? null);
  const timestamp = now();
  params.push(timestamp, body.id);
  const update = db().prepare(`UPDATE ${config.table} SET ${fields.map((field) => `${snake(field)}=?`).join(",")},updated_at=? WHERE id=?`).bind(...params);
  if (type === "members" && fields.includes("points")) {
    const previous = await db().prepare("SELECT points FROM members WHERE id=?").bind(body.id).first<{ points: number }>();
    const difference = Number(body.points) - Number(previous?.points || 0);
    await db().batch([update, db().prepare("INSERT INTO point_transactions (id,member_id,amount,reason,reference_type,reference_id,created_at) VALUES (?,?,?,?,?,?,?)").bind(id("pts"), body.id, difference, "管理員調整點數", "adjustment", String(body.id), timestamp)]);
  } else await update.run();
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await authorized(request))) return json({ error: "請先登入管理後台" }, { status: 401 });
  const type = typeFrom(request.url); if (!type || type === "members") return json({ error: "資料類型不可刪除" }, { status: 400 });
  const body = await request.json() as { id?: string }; if (!body.id) return json({ error: "缺少資料 ID" }, { status: 400 });
  await db().prepare(`DELETE FROM ${configs[type].table} WHERE id=?`).bind(body.id).run(); return json({ ok: true });
}
