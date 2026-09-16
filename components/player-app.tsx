"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Gift, LogIn, MapPin, Megaphone, QrCode, Sparkles, Store, Ticket, UserRound } from "lucide-react";
import { Toaster, toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { demoSnapshot } from "@/lib/demo-data";
import type { DataRecord, PublicSnapshot } from "@/lib/types";

type View = "explore" | "tasks" | "shops" | "rewards" | "profile";

export function PlayerApp() {
  const [data, setData] = useState<PublicSnapshot>(demoSnapshot);
  const [view, setView] = useState<View>("explore");
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<DataRecord | null>(null);
  const [pendingPrize, setPendingPrize] = useState<DataRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => { try { const response = await fetch("/api/public", { cache: "no-store" }); if (response.ok) setData(await response.json()); } catch {} }, []);
  // Initial synchronization with the public API; state changes happen after I/O.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh]);

  const completed = data.completedChallengeIds.length;
  const memberName = String(data.member?.name || "訪客").replace("（示範會員）", "");
  const firstName = memberName.slice(0, 1);
  const handleLogin = async (form: FormData) => {
    setLoading(true);
    const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "member", memberCode: form.get("memberCode"), pin: form.get("pin") }) });
    const result = await response.json() as { error?: string };
    setLoading(false); if (!response.ok) { toast.error(result.error || "登入失敗"); return; } setLoginOpen(false); await refresh(); toast.success("登入成功，歡迎回來！");
  };
  const handleCheckin = useCallback(async (values: { code: string; answer: string }) => {
    if (data.demo && String(data.member?.id) === "member-demo-wen") {
      const challenge = data.challenges.find((item) => String(item.checkpointCode) === values.code.trim().toUpperCase());
      if (!challenge) throw new Error("找不到這個關卡碼");
      if (String(challenge.answer).trim() !== values.answer.trim()) throw new Error("答案還不正確，再觀察一下吧");
      if (data.completedChallengeIds.includes(challenge.id)) throw new Error("此關卡已完成，不能重複集點");
      setData((old) => ({ ...old, member: old.member ? { ...old.member, points: Number(old.member.points) + Number(challenge.points) } : null, completedChallengeIds: [...old.completedChallengeIds, challenge.id] }));
      return { ok: true, points: Number(challenge.points), title: String(challenge.title), demo: true };
    }
    const response = await fetch("/api/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const result = await response.json() as { error?: string; points?: number; title?: string }; if (!response.ok) throw new Error(result.error || "闖關失敗"); await refresh(); return { ...result, ok: true };
  }, [data, refresh]);
  const submitCheckin = async (form: FormData) => {
    setLoading(true); try { const result = await handleCheckin({ code: String(form.get("code")), answer: String(form.get("answer")) }); setCheckinOpen(false); toast.success(`完成「${result.title}」，獲得 ${result.points} 點！`); } catch (error) { toast.error(error instanceof Error ? error.message : "闖關失敗"); } finally { setLoading(false); }
  };
  const redeem = useCallback(async (prizeId: string) => {
    const prize = data.prizes.find((item) => item.id === prizeId); if (!prize) throw new Error("找不到獎品");
    if (!data.member) throw new Error("請先登入會員"); if (Number(data.member.points) < Number(prize.pointsCost)) throw new Error("旅點不足");
    if (data.demo) { const claimCode = `WS-DEMO-${Math.floor(1000 + Math.random() * 9000)}`; setData((old) => ({ ...old, member: old.member ? { ...old.member, points: Number(old.member.points) - Number(prize.pointsCost) } : null, redemptions: [{ id: crypto.randomUUID(), prizeId, prizeName: prize.name, pointsCost: prize.pointsCost, claimCode, status: "pending", requestedAt: new Date().toISOString() }, ...old.redemptions] })); return { ok: true, claimCode, demo: true }; }
    const response = await fetch("/api/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prizeId }) }); const result = await response.json() as { error?: string; claimCode?: string }; if (!response.ok) throw new Error(result.error || "兌換失敗"); await refresh(); return { ...result, ok: true };
  }, [data, refresh]);
  const confirmRedeem = async () => { if (!pendingPrize) return; setLoading(true); try { const result = await redeem(pendingPrize.id); setPendingPrize(null); toast.success(`兌換完成，核銷碼：${result.claimCode}`); setView("profile"); } catch (error) { toast.error(error instanceof Error ? error.message : "兌換失敗"); } finally { setLoading(false); } };

  useEffect(() => {
    const context = typeof document === "undefined" ? undefined : (document as unknown as { modelContext?: { registerTool: (tool: unknown, options?: unknown) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return; const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({ name: "submit_checkpoint", title: "提交闖關答案", description: "輸入文山真人大富翁關卡碼與答案，完成關卡並領取一次性點數。", inputSchema: { type: "object", properties: { code: { type: "string" }, answer: { type: "string" } }, required: ["code","answer"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const value = input as { code?: string; answer?: string }; if (!value.code || !value.answer) throw new Error("code 與 answer 為必填"); return handleCheckin({ code: value.code, answer: value.answer }); } }, { signal: lifecycle.signal })).catch(() => {});
    void Promise.resolve(context.registerTool({ name: "request_prize_redemption", title: "申請獎品兌換", description: "使用目前會員旅點申請兌換指定獎品，成功後回傳核銷碼。", inputSchema: { type: "object", properties: { prizeId: { type: "string" } }, required: ["prizeId"], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: async (input: unknown) => { const value = input as { prizeId?: string }; if (!value.prizeId) throw new Error("prizeId 為必填"); return redeem(value.prizeId); } }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, [handleCheckin, redeem]);

  return (
    <main className="player-shell">
      <Toaster position="top-center" richColors />
      {data.demo && <div className="demo-ribbon" role="status">示範模式・以下活動、店家、點數與核銷皆為測試資料</div>}
      <header className="mobile-header"><button className="brand bare-button" onClick={() => setView("explore")}><span className="brand-mark">文</span><span>文山真人大富翁</span></button><button className="avatar-button" aria-label="開啟會員頁" onClick={() => setView("profile")}>{firstName || <UserRound size={18} />}</button></header>
      {view === "explore" && <Explore data={data} name={memberName} completed={completed} onNavigate={setView} onCheckin={() => { setSelectedChallenge(null); setCheckinOpen(true); }} />}
      {view === "tasks" && <Tasks data={data} onCheckin={(challenge) => { setSelectedChallenge(challenge); setCheckinOpen(true); }} />}
      {view === "shops" && <Shops data={data} />}
      {view === "rewards" && <Rewards data={data} onRedeem={(prize) => data.member ? setPendingPrize(prize) : setLoginOpen(true)} />}
      {view === "profile" && <Profile data={data} onLogin={() => setLoginOpen(true)} onLogout={async () => { await fetch("/api/session?role=member", { method: "DELETE" }); setData(demoSnapshot); toast.success("已登出會員"); }} />}
      <nav className="bottom-nav" aria-label="主要導覽"><Nav active={view === "explore"} label="探索" icon={<MapPin size={21} />} onClick={() => setView("explore")} /><Nav active={view === "tasks"} label="任務" icon={<QrCode size={21} />} onClick={() => setView("tasks")} /><Nav active={view === "shops"} label="店家" icon={<Store size={21} />} onClick={() => setView("shops")} /><Nav active={view === "rewards"} label="獎品" icon={<Ticket size={21} />} onClick={() => setView("rewards")} /><Nav active={view === "profile"} label="我的" icon={<UserRound size={21} />} onClick={() => setView("profile")} /></nav>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>會員登入</DialogTitle><DialogDescription>登入後才能保存闖關點數與兌換獎品。示範帳號：WENSHAN001 / PIN 2026。</DialogDescription></DialogHeader><form action={handleLogin} className="dialog-form"><label>會員編號<input name="memberCode" defaultValue="WENSHAN001" required autoComplete="username" /></label><label>4 位 PIN<input name="pin" defaultValue="2026" required inputMode="numeric" type="password" autoComplete="current-password" /></label><DialogFooter><Button type="submit" disabled={loading}>{loading ? "登入中…" : "登入會員"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>{selectedChallenge ? String(selectedChallenge.title) : "輸入關卡碼"}</DialogTitle><DialogDescription>{selectedChallenge ? String(selectedChallenge.question) : "完成現場任務後，輸入關卡碼與答案。示範可使用 TEA2026 / 部分發酵茶。"}</DialogDescription></DialogHeader><form action={submitCheckin} className="dialog-form"><label>關卡碼<input name="code" defaultValue={selectedChallenge ? String(selectedChallenge.checkpointCode || "") : "TEA2026"} required /></label><label>答案<input name="answer" defaultValue={selectedChallenge ? String(selectedChallenge.answer || "") : "部分發酵茶"} required /></label><DialogFooter><Button type="submit" disabled={loading}>{loading ? "確認中…" : "完成闖關"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={Boolean(pendingPrize)} onOpenChange={(open) => !open && setPendingPrize(null)}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>確認兌換</DialogTitle><DialogDescription>將扣除 {Number(pendingPrize?.pointsCost || 0).toLocaleString()} 旅點，兌換「{String(pendingPrize?.name || "")}」。核銷前請勿將核銷碼交給他人。</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPendingPrize(null)}>先不要</Button><Button onClick={confirmRedeem} disabled={loading}>{loading ? "處理中…" : "確認兌換"}</Button></DialogFooter></DialogContent></Dialog>
    </main>
  );
}

function PageTitle({ kicker, title, back }: { kicker: string; title: string; back?: () => void }) { return <div className="page-title">{back && <button className="back-button" onClick={back}><ArrowLeft size={19} /></button>}<div><p className="eyebrow">{kicker}</p><h1>{title}</h1></div></div>; }
function Explore({ data, name, completed, onNavigate, onCheckin }: { data: PublicSnapshot; name: string; completed: number; onNavigate: (v: View) => void; onCheckin: () => void }) { const latest = data.announcements[0]; return <>
  <section className="welcome" id="top"><div><p className="eyebrow">{String(data.event.title)}</p><h1>早安，{name}！<br />今天想走哪一格？</h1></div><div className="points-card"><span><Sparkles size={18} /> 我的旅點</span><strong>{Number(data.member?.points || 0).toLocaleString()}</strong><small>{data.member ? "闖關、集點、換好禮" : "登入後開始累積"}</small></div></section>
  {latest && <button className="announcement-strip" onClick={() => toast.info(String(latest.content))}><Megaphone size={17} /><span><strong>{String(latest.title)}</strong>{String(latest.content)}</span><ArrowRight size={17} /></button>}
  <section className="map-card"><Image src="/wenshan-map.png" alt="以貓空纜車、茶園、景美溪與街區構成的文山探索地圖插畫" fill priority sizes="(max-width:760px) 100vw,720px" /><div className="map-shade" /><div className="map-copy"><span className="map-kicker"><MapPin size={16} /> 本週推薦路線</span><h2>溪畔到茶山<br />5 格輕旅行</h2><p>已完成 {completed} / {data.challenges.length} 個據點</p><button className="primary-link bare-button" onClick={() => onNavigate("tasks")}>繼續闖關 <ArrowRight size={18} /></button></div></section>
  <section className="quick-actions"><button onClick={onCheckin}><span className="action-icon orange"><QrCode size={22} /></span><span>輸入關卡碼<small>完成任務集點</small></span></button><button onClick={() => onNavigate("rewards")}><span className="action-icon green"><Ticket size={22} /></span><span>獎品兌換<small>查看可兌好禮</small></span></button></section>
  <section className="section-block"><div className="section-heading"><div><p className="eyebrow">NEXT STOPS</p><h2>附近的下一格</h2></div><button className="text-button" onClick={() => onNavigate("tasks")}>查看全部</button></div><div className="stop-list">{data.challenges.slice(0,3).map((stop,index) => <button className="stop-card" key={stop.id} onClick={() => onNavigate("tasks")}><span className={`stop-number tone-${index}`}>{String(Number(stop.sortOrder || index+1)).padStart(2,"0")}</span><span><small>{String(stop.category)}關卡</small><strong>{String(stop.title)}</strong><em>完成可獲得 {Number(stop.points)} 點</em></span><ArrowRight size={19} /></button>)}</div></section>
  </>; }
function Tasks({ data, onCheckin }: { data: PublicSnapshot; onCheckin: (v: DataRecord) => void }) { return <section className="content-page"><PageTitle kicker="MISSION MAP" title="學習關卡" /><div className="progress-panel"><span>活動進度</span><strong>{data.completedChallengeIds.length} / {data.challenges.length}</strong><Progress value={(data.completedChallengeIds.length / Math.max(data.challenges.length,1)) * 100} /></div><div className="task-grid">{data.challenges.map((item, index) => { const done = data.completedChallengeIds.includes(item.id); return <article className={`task-card ${done ? "done" : ""}`} key={item.id}><span className="task-index">{done ? <Check size={19} /> : String(index+1).padStart(2,"0")}</span><div><span className="pill">{String(item.category)}</span><h2>{String(item.title)}</h2><p>{String(item.description)}</p><small>{done ? "已完成" : `完成可得 ${item.points} 點`}</small></div><Button size="sm" variant={done ? "secondary" : "default"} disabled={done} onClick={() => onCheckin(item)}>{done ? "已集點" : "開始"}</Button></article>; })}</div></section>; }
function Shops({ data }: { data: PublicSnapshot }) { return <section className="content-page"><PageTitle kicker="LOCAL PARTNERS" title="合作店家" /><div className="shop-grid">{data.shops.map((shop,index) => <article className="shop-card" key={shop.id}><div className={`shop-visual tone-${index%3}`}><Store size={30} /></div><div><span className="pill">{String(shop.category)}</span><h2>{String(shop.name)}</h2><p>{String(shop.description)}</p><dl><div><dt>地址</dt><dd>{String(shop.address)}</dd></div><div><dt>營業</dt><dd>{String(shop.openHours)}</dd></div></dl></div></article>)}</div></section>; }
function Rewards({ data, onRedeem }: { data: PublicSnapshot; onRedeem: (v: DataRecord) => void }) { return <section className="content-page" id="rewards"><PageTitle kicker="REWARD SHOP" title="旅點好禮" /><p className="page-intro">目前有 <strong>{Number(data.member?.points || 0).toLocaleString()}</strong> 旅點。送出兌換後，請向工作人員出示核銷碼。</p><div className="reward-grid">{data.prizes.map((prize,index) => { const enough = Number(data.member?.points || 0) >= Number(prize.pointsCost); return <article className="reward-card" key={prize.id}><div className={`reward-art tone-${index%3}`}><Gift size={38} /></div><span className="pill">庫存 {Number(prize.stock)}</span><h2>{String(prize.name)}</h2><p>{String(prize.description)}</p><div><strong>{Number(prize.pointsCost).toLocaleString()} 點</strong><Button size="sm" variant={enough ? "default" : "secondary"} onClick={() => onRedeem(prize)}>{data.member ? (enough ? "兌換" : "點數不足") : "登入兌換"}</Button></div></article>; })}</div></section>; }
function Profile({ data, onLogin, onLogout }: { data: PublicSnapshot; onLogin: () => void; onLogout: () => void }) { return <section className="content-page" id="profile"><PageTitle kicker="MY JOURNEY" title="我的旅程" />{data.member ? <><div className="profile-card"><span className="profile-avatar">{String(data.member.name).slice(0,1)}</span><div><h2>{String(data.member.name)}</h2><p>會員編號 {String(data.member.memberCode)}</p></div><strong>{Number(data.member.points).toLocaleString()}<small>旅點</small></strong></div><h2 className="subheading">我的兌換</h2>{data.redemptions.length ? <div className="redemption-list">{data.redemptions.map((record) => <article key={record.id}><span className={`status ${record.status}`}>{record.status === "pending" ? "待核銷" : record.status === "verified" ? "已核銷" : "已取消"}</span><h3>{String(record.prizeName)}</h3><code>{String(record.claimCode)}</code><p>請於現場交由工作人員核銷</p></article>)}</div> : <div className="empty-state"><Ticket size={28} /><p>還沒有兌換紀錄</p></div>}<Button variant="outline" className="logout-button" onClick={onLogout}>登出會員</Button></> : <div className="login-callout"><LogIn size={35} /><h2>登入後保存旅程</h2><p>使用活動現場取得的會員編號與 PIN 登入。</p><Button onClick={onLogin}>登入會員</Button></div>}</section>; }
function Nav({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>; }
