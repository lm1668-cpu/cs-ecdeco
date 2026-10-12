# 報修 API｜方案 A（Cloudflare Worker）部署步驟

**批核：** Kelvin 13/10/2026 批方案 A（Cloudflare Worker；靜態站留 GitHub Pages；PAT 稍後畀）  
**硬規則：** **唔改** `cs.ecdeco.com.hk` DNS／CNAME、唔改 Hostinger／Vodien 主站；**唔**把 `GITHUB_TOKEN` 寫入前端或 git。

**目標：** 客人喺售後 App 提交報修 → Worker 開 GitHub Issue（`lm1668-cpu/cs-ecdeco`）→ 前端 mailto 預填 `info@ecdeco.com.hk`（本階段唔代發電郵）。

---

## 一、Kelvin 要做（一次）

### 1. GitHub fine-grained PAT（你話稍後畀）

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate  
2. **Repository access：** Only select → `lm1668-cpu/cs-ecdeco`  
3. **Permissions：** Repository permissions → Issues = **Read and write**（其餘保持 No access）  
4. 產生後把 token **私訊／Secure Form 交客戶部**（唔貼公開 chat／唔 commit）  
5. 客戶部只放入 Cloudflare Worker Secret，唔入 repo

### 2. Cloudflare 帳號（若未有）

- 用你現有 Cloudflare 帳號即可（Workers Free $0／月，每日約 10 萬請求）  
- **本階段唔使**把 `cs.ecdeco.com.hk` 加做 Cloudflare 代理／改 name server  
- Worker 用預設 `*.workers.dev` URL 即可

---

## 二、客戶部要做（收到 PAT 後）

| 步 | 內容 | 改 DNS？ |
|----|------|----------|
| A2 | 由 `functions/create-report.js` 出 Worker（檔尾適配例）；`ALLOW_ORIGIN=https://cs.ecdeco.com.hk`；`NOTIFY_EMAIL=info@ecdeco.com.hk` | 否 |
| A3 | `wrangler secret put GITHUB_TOKEN`（Kelvin 畀嘅 PAT）；可選 vars：`GITHUB_OWNER=lm1668-cpu`、`GITHUB_REPO=cs-ecdeco` | 否 |
| A4 | 部署得 `https://<name>.<subdomain>.workers.dev`（或同等）；寫入 `js/report-config.js` → `REPORT_API_URL`；push GitHub Pages | 否 |
| A5 | 測一次：App 提交示範報修 → 出新 Issue → mailto 預填 `info@ecdeco.com.hk` | 否 |

**CLI 概要（客戶部執行，唔使你改 DNS）：**

```bash
# 目錄例：worker 獨立或 monorepo 子目錄
npx wrangler deploy
npx wrangler secret put GITHUB_TOKEN
# 可選
npx wrangler secret put ALLOW_ORIGIN   # 值：https://cs.ecdeco.com.hk
```

**前端只改一行（部署後）：** `js/report-config.js` 設 `REPORT_API_URL` 為 Worker URL；**唔**放 token。

---

## 三、明確唔做（除非另批）

| 項目 | 狀態 |
|------|------|
| 改 `cs` CNAME／A 記錄 | ❌ 唔做 |
| 指去 Hostinger／Vodien | ❌ 唔做 |
| Cloudflare 代理整站／Custom Domain route `cs.ecdeco.com.hk/api/...` | ❌ 第二階段另批 |
| 伺服器代發電郵（Resend／SMTP） | ❌ 第二階段另批 |
| 登出／動 大本營 WA | ❌ 無關 |

---

## 四、驗收標準

1. `POST` Worker → HTTP 201，回傳 `issue_url`／`issue_number`  
2. `lm1668-cpu/cs-ecdeco` Issues 出現新「【售後報修】…」  
3. App 開 mailto 至 `info@ecdeco.com.hk`，正文含 Issue 連結  
4. 瀏覽器 CORS 只允許 `https://cs.ecdeco.com.hk`  
5. repo 內無任何 PAT／secret

---

## 五、而家卡喺邊

**等 Kelvin 交 GitHub PAT。** 收到後客戶部即部署＋測，再回報 Worker URL 同示範 Issue 編號。
