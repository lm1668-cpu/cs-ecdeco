# 售後報修 → GitHub Issue 方案說明

目標：客人喺靜態站提交報修後，**自動**喺 `lm1668-cpu/cs-ecdeco` 開 Issue，再以**【電郵】通知**迪高（預設 `info@ecdeco.com.hk`，可於 config 改）。

Kelvin 11/10：**唔再預設開 WhatsApp**。`OPEN_WHATSAPP` 預設 `false`；僅手動開啟時先額外用 `wa.me`。

**前端唔可以安全存放 GitHub PAT。** 任何把 token／webhook secret 寫進 `js/` 嘅做法都唔接受。

---

## 推薦：Serverless relay（已提供 stub）

檔案：`functions/create-report.js`

流程：

1. 客人填表（`app.js`）
2. `POST` JSON → `REPORT_API_URL`（Cloudflare Worker / Netlify Function）
3. Function 用環境變數 **`GITHUB_TOKEN`** 呼叫 GitHub Issues API
4. 回傳 `issue_url`（同可選 `notify_email`）
5. 前端開啟 **mailto**（預填摘要＋Issue URL）→ 收件人 `NOTIFY_EMAIL`
6. （可選）若 `OPEN_WHATSAPP === true` 先額外開 `wa.me`

本 stub **唔代發電郵**（避免再加 mail API secret）。日後可用 Resend／SMTP 擴充 Function 真正代發。

### 建立 fine-grained PAT

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained
2. Resource owner：`lm1668-cpu`；只授權 repo **`cs-ecdeco`**
3. Permissions：**Issues → Read and write**（Contents 唔需要 write）
4. 產生 token 後**只**貼上主機 Secret，**唔好** commit、唔好放 `report-config.js`

### Cloudflare Worker（簡）

1. 用 `functions/create-report.js` 檔尾註解改成 Worker `fetch` handler
2. `wrangler secret put GITHUB_TOKEN`
3. （建議）`ALLOW_ORIGIN=https://cs.ecdeco.com.hk`；可選 `NOTIFY_EMAIL`
4. 部署後將 URL 寫入 `js/report-config.js` → `REPORT_API_URL`

### Netlify Functions（簡）

1. 本 repo 已有 `functions/create-report.js`（`exports.handler`）
2. Site settings → Environment variables → `GITHUB_TOKEN`
3. 可選：`ALLOW_ORIGIN`、`GITHUB_OWNER`、`GITHUB_REPO`、`NOTIFY_EMAIL`
4. `REPORT_API_URL` = `https://YOUR_SITE/.netlify/functions/create-report`

### 前端設定

```js
// js/report-config.js
window.ECDECO_REPORT_CONFIG = {
  REPORT_API_URL: "https://YOUR_WORKER_OR_FUNCTION_URL",
  GITHUB_OWNER: "lm1668-cpu",
  GITHUB_REPO: "cs-ecdeco",
  NOTIFY_EMAIL: "info@ecdeco.com.hk",
  OPEN_WHATSAPP: false,
  WHATSAPP: "85268262764",
};
```

`REPORT_API_URL` 留空 → 唔開 Issue；仍存 localStorage + 開電郵摘要（MVP）。

---

## 備援：GitHub Actions（`report.yml`）

`.github/workflows/report.yml` 支援 `workflow_dispatch` 同 `repository_dispatch`（type `cs-ecdeco-report`）。

瀏覽器直接打 `repository_dispatch` 仍需 secret —— **唔能放前端**。正式路徑請用 serverless。

---

## 唔建議／僅 Demo

| 做法 | 原因 |
|------|------|
| 前端 PAT / `repository_dispatch` secret | Secret 會洩露 |
| 只開 `issues/new?title=&body=` 預填 | 要客人有 GitHub 登入；唔適合訪客 |
| 預設自動開 WhatsApp | Kelvin 11/10 改為電郵通知 |
| 純 localStorage | Admin 本機可見，但無中央 Issue |

---

## Issue 正文欄位

- 客人、電話、項目、時間
- 問題描述
- 附件檔名列表＋相片／短片數量
- 媒體說明（檔案未上 GitHub，請電郵附件補傳）

---

## 本機測試 Function（概念）

```bash
curl -sS -X POST "$REPORT_API_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "guest":"測試客人",
    "phone":"+852 91234567",
    "project":"示範項目",
    "time":"11/10/2026 10:00",
    "problem":"測試報修內容",
    "attachments":["a.jpg"],
    "photoCount":1,
    "videoCount":0
  }'
# 期望：{"ok":true,"issue_url":"https://github.com/lm1668-cpu/cs-ecdeco/issues/N","notify_email":"info@ecdeco.com.hk",...}
```

**唔好**把真實 token 寫入本文件或任何已追蹤檔案。
