"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLogin() {
  const router = useRouter(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function login(form: FormData) { setLoading(true); setError(""); const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: "admin", email: form.get("email"), password: form.get("password") }) }); const result = await response.json() as { error?: string }; setLoading(false); if (!response.ok) return setError(result.error || "登入失敗"); router.push("/admin"); }
  return <main className="admin-login-shell"><Link href="/" className="back-home"><ArrowLeft size={18} /> 回到手機前台</Link><section className="admin-login-card"><div className="admin-login-brand"><span className="brand-mark">文</span><div><strong>文山真人大富翁</strong><small>管理員後台</small></div></div><div className="login-icon"><LockKeyhole /></div><h1>管理員登入</h1><p>登入後可管理活動內容、會員點數與兌獎核銷。</p><form action={login} className="dialog-form"><label>管理員信箱<input name="email" type="email" defaultValue="admin@wenshan.demo" required autoComplete="username" /></label><label>密碼<input name="password" type="password" defaultValue="WenshanDemo!2026" required autoComplete="current-password" /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" size="lg" disabled={loading}>{loading ? "登入中…" : "登入後台"}</Button></form><div className="demo-credentials"><strong>示範登入資料</strong><span>admin@wenshan.demo</span><span>WenshanDemo!2026</span><small>正式部署前請於環境變數更換，且關閉 DEMO_MODE。</small></div></section></main>;
}
