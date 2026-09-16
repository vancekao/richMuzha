# 文山真人大富翁

以手機為主的文山街區實境闖關平台，包含參與者前台、管理員後台、共用 Cloudflare D1 資料庫、會員集點與兌獎核銷流程。此原始碼目前**尚未部署或發布**。

## 已完成功能

- 手機前台：探索首頁、活動公告、學習關卡、合作店家、旅點獎品、會員旅程。
- 會員流程：會員編號＋PIN 登入、輸入關卡碼與答案、一次性集點、防止重複集點、查看點數及兌換紀錄。
- 獎品流程：檢查點數與庫存、扣點、扣庫存、產生唯一核銷碼。
- 管理後台：管理員登入；活動、店家、學習關卡、公告、獎品的新增／編輯／刪除；會員查詢與點數調整；兌換單查詢與核銷。
- 共用資料庫：9 張 D1 / SQLite 資料表、關聯約束、唯一性約束、查詢索引與點數流水帳。
- 安全基礎：HttpOnly / SameSite session cookie、HMAC 簽章、後端權限檢查、正式密碼改用環境變數、會員 PIN 支援 PBKDF2。
- WebMCP：前台註冊 `submit_checkpoint` 與 `request_prize_redemption`，支援相容的 AI 瀏覽器操作同一套可見流程。

## 示範資料（請先看）

所有示範活動、店家、地址、電話、會員、點數與獎品都在名稱或介面橫幅上標示「示範」。它們**不是真實店家或真實活動資料**。

- 示範資料來源：`lib/demo-data.ts`、`db/seed-demo.sql`
- 示範會員：`WENSHAN001` / PIN `2026`
- 示範管理員：`admin@wenshan.demo` / `WenshanDemo!2026`
- 示範關卡：`TEA2026` / 答案 `部分發酵茶`

正式上線前務必刪除或替換示範資料、設定自己的管理員帳密，並將 `DEMO_MODE=false`。

## 技術架構

- Vinext / React 19 / TypeScript / Tailwind CSS 4
- Cloudflare Workers
- Cloudflare D1（SQLite）
- Drizzle schema 與 migration
- Wrangler 本機及部署工具

主要路由：

| 路由 | 用途 |
| --- | --- |
| `/` | 手機參與者前台 |
| `/admin/login` | 管理員登入 |
| `/admin` | 內容、會員與核銷管理 |
| `/api/public` | 前台共用資料與會員狀態 |
| `/api/checkin` | 闖關與集點 |
| `/api/redeem` | 申請獎品兌換 |
| `/api/admin/content` | 後台內容 CRUD |
| `/api/admin/redemptions` | 兌換單與核銷 |

## 本機執行

需求：Node.js 22.13 以上、pnpm 11、Cloudflare Wrangler。

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:local:migrate
pnpm db:local:seed
pnpm dev
```

開啟 `http://localhost:5173`。若不匯入資料，前台會自動顯示明確標示的唯讀示範快照；要完整測試資料寫入，請先執行 migrate 與 seed。

## 資料庫與資料安全

- Schema：`db/schema.ts`
- Migration：`drizzle/0000_illegal_nighthawk.sql`
- 選用示範資料：`db/seed-demo.sql`
- 點數異動一律記錄於 `point_transactions`；完成關卡以 `(member_id, challenge_id)` 唯一索引防止重複集點。
- 核銷以唯一 `claim_code` 辨識，只有 `pending` 狀態能被核銷。
- 正式會員的 `pin_hash` 格式為 `iterations:salt-base64:hash-base64url`，請使用 PBKDF2-SHA256 產生；`demo:2026` 僅能在 `DEMO_MODE` 未關閉時使用。
- 請定期以 Wrangler 匯出 D1；大型圖片日後可另接 R2，本版的視覺素材隨程式碼部署。

## 手動上傳 GitHub

1. 解壓縮 `richMuzha.zip`。
2. 在 GitHub 建立空白 repository，不要先加入 README 或 `.gitignore`。
3. 於專案資料夾執行：

```bash
git init
git add .
git commit -m "Initial richMuzha project"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

`.env`、`.dev.vars`、本機 D1、`node_modules`、建置輸出與壓縮檔都已排除，不應上傳。

## Cloudflare 部署說明（目前未執行）

1. 安裝相依套件並登入 Cloudflare：`pnpm install`、`pnpm exec wrangler login`。
2. 建立資料庫：`pnpm exec wrangler d1 create rich-muzha-db`。
3. 將 Cloudflare 回傳的 `database_id` 填入 `wrangler.deploy.jsonc`，替換全為 0 的本機預留 ID。
4. 建置：`pnpm build`。
5. 套用正式 schema：

```bash
pnpm exec wrangler d1 execute DB --remote --config wrangler.deploy.jsonc --file drizzle/0000_illegal_nighthawk.sql
```

6. 若只想先展示假資料，才執行以下指令；正式站通常應改由後台建立真實內容：

```bash
pnpm exec wrangler d1 execute DB --remote --config wrangler.deploy.jsonc --file db/seed-demo.sql
```

7. 設定機密，不要把值寫入 Git：

```bash
pnpm exec wrangler secret put AUTH_SECRET --config wrangler.deploy.jsonc
pnpm exec wrangler secret put ADMIN_EMAIL --config wrangler.deploy.jsonc
pnpm exec wrangler secret put ADMIN_PASSWORD --config wrangler.deploy.jsonc
```

8. 確認 `DEMO_MODE=false`、示範資料已移除或明確保留，再部署：`pnpm deploy:cloudflare`。

部署前建議加上自訂網域、Cloudflare Access 或其他管理後台網路層保護，並完成隱私權告知、資料保存政策、獎品規則與工作人員核銷 SOP。

## 已執行的驗證

- 前台、後台登入頁、共用 API 均回應成功。
- D1 migration 與 9 張資料表建立成功；示範 seed 匯入成功。
- 示範管理員與會員登入成功。
- 後台公告新增、更新、刪除 API 實際驗證成功，測試資料已清除。
- `TEA2026` 關卡成功加 100 點；第二次提交回傳 409，沒有重複加點。
- 成功兌換獎品、扣除旅點與庫存、建立核銷碼。
- 管理員成功核銷；會員端回讀為 `verified`，點數、完成關卡與兌換狀態一致。
- 最終 production build、TypeScript 型別檢查與 ESLint 均已通過。

## 專案狀態

此版本是可部署的完整 MVP。尚未包含簡訊 OTP、第三方金流、實體 QR 掃描器、圖片上傳後台或多角色權限；這些不在本次需求範圍內。
