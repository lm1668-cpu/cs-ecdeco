# 迪高售後服務（手機網頁 App）

已合作客人專用售後入口：睇自己項目、保養範圍詳情、非保養供應商聯絡、一鍵聯絡迪高。

- **正式網址（預定）：** `https://cs.ecdeco.com.hk`（DNS／Hosting **未改前唔好擅自設定**）
- **風格參考：** 手機網頁 App（類似 jobs.renocamp.io 嘅簡單靜態／SPA）
- **品牌：** 對齊《迪高簡易品牌視覺規範》同 `ecdeco_logo.png`
- **語言：** 繁體中文（香港）
- **狀態：** MVP 預覽（示範登入＋本地 JSON／JS 資料＋本機 Admin）

> **DNS／Hosting 須 Kelvin 批准先改；本頁價目已按 12/10 確認上線。**

---

## 本機預覽

喺本目錄執行：

```bash
cd /workspace/customer/cs-ecdeco
npm run dev
```

然後瀏覽器打開：

```
http://127.0.0.1:5173/          # 客人端
http://127.0.0.1:5173/admin.html # 管理端（本機 Demo）
```

唔想用 npm 亦可：

```bash
cd /workspace/customer/cs-ecdeco
python3 -m http.server 8080 --bind 127.0.0.1
# 客人端 http://127.0.0.1:8080/
# 管理端 http://127.0.0.1:8080/admin.html
```

> 建議用手機闊度（Chrome DevTools device mode）預覽；亦可「加入主畫面」測試基本 PWA meta／manifest。
>
> 內容更新後請 bump `sw.js` 嘅 `CACHE`（而家 `ecdeco-cs-v3`）；HTML／JS／CSS 用 network-first，客人會見到「有新版本，撳更新」。詳見 `DEPLOY.md`。

---

## 正式登入方向（Kelvin 11/10）

手機號碼作帳號、客人自設密碼、電郵收啟動／重設連結；**唔用 SMS OTP**（客人唔多）。預覽版暫仍用下面示範 OTP，接後端時再換。

## 示範登入（客人端）

| 項目 | 值 |
|------|-----|
| 手機 | `91234567`（兩個項目）或 `98765432`（一個項目） |
| 驗證碼 | `123456`（固定，僅預覽） |

未登記手機號碼會提示「未有登記項目」。

---

## 管理端（本機 Admin Demo）

| 項目 | 值 |
|------|-----|
| 網址 | `admin.html` |
| PIN | `246810`（僅本機示範，非正式保安） |

功能：

1. 新增／編輯項目（名稱、地址、完工日、EC Job #、客人手機連結）
2. 管理保養範圍（可選說明類型：泥水／油漆／木工／水電／電氣／其他）同非保養供應商
3. 供應商清單（方便加入非保養項目）
4. 客人手機戶口
5. **儲存至 `localStorage`**（key：`ecdeco_cs_data_override`）；匯出／匯入 JSON；清除覆寫還原 `js/data.js`
6. 客人端 `app.js` **優先讀取** localStorage 覆寫（同一瀏覽器）
7. **報修記錄** tab：睇客人端提交嘅報修（key：`ecdeco_cs_problem_reports`；只存文字／檔名，唔存媒體 blob）

Admin 與客人端需同一 origin（例如都用 `127.0.0.1:5173`）先共享 localStorage。

---

## 迪高聯絡（已按 10/10 更新）

`js/data.js` → `contact`：

| 欄位 | 值 |
|------|-----|
| email | `info@ecdeco.com.hk` |
| phone | `+852 6826 2764` |
| phoneTel | `+85268262764` |
| whatsapp | `85268262764`（`wa.me`） |

**切勿使用大本營號碼 6179 1102。**

---

## 報修表單（Kelvin 11/10）

「聯絡迪高」頁售後報修：

1. 問題描述（必填）
2. 可選上傳相片／短片（`image/*`、`video/*`；預覽；相片 <10MB、短片 <50MB）
3. 已登入則預填相關項目
4. 提交後：
   - 寫入 `localStorage`（`ecdeco_cs_problem_reports`）
   - 若已設定 `js/report-config.js` → `REPORT_API_URL`：`POST` 到 serverless → 喺 `lm1668-cpu/cs-ecdeco` **建立 GitHub Issue**
   - **電郵通知**（預設 `info@ecdeco.com.hk`，可用 `NOTIFY_EMAIL` 改）：開啟 mailto 預填摘要＋Issue URL
   - **WhatsApp 預設關閉**（`OPEN_WHATSAPP: false`）；設 `true` 先額外開 `wa.me`
   - 可下載文字摘要；Web Share 作後備；媒體唔上 GitHub，請電郵附件補傳

訊息格式例：

```
【迪高售後報修】
客人：…
電話：…
項目：…
時間：11/10/2026 …
問題：…
附件：相片 x張／短片 x段（請經電郵附件補傳…）
GitHub Issue：https://github.com/lm1668-cpu/cs-ecdeco/issues/N
```

### 報修 API 設定（生產）

前端**唔可以**放 GitHub PAT。請部署 `functions/create-report.js`：

1. 建立 fine-grained PAT（只限 `lm1668-cpu/cs-ecdeco`，**Issues: Read and write**）
2. 將 token 設為 Cloudflare／Netlify 環境變數 **`GITHUB_TOKEN`**（可選 `NOTIFY_EMAIL`、`ALLOW_ORIGIN`）
3. 部署 Function／Worker 後，喺 `js/report-config.js` 填：

```js
REPORT_API_URL: "https://YOUR_FUNCTION_URL",
NOTIFY_EMAIL: "info@ecdeco.com.hk",
OPEN_WHATSAPP: false,
```

詳見 `scripts/create-report-issue.md`。備援：`.github/workflows/report.yml`（仍需 relay，唔好把 secret 放前端）。

`REPORT_API_URL` 留空時：唔開 Issue，只做本機記錄＋電郵預填（方便未部署 API 前預覽）。

---

## 畫面一覽（MVP）

1. **歡迎／登入** — 較大 logo（`.logo-welcome`）、標語「你嘅項目 · 售後服務」、手機 OTP（mock）
2. **我的項目** — 示範兩個項目列表
3. **項目詳情** — 基本資料、有保養範圍（可撳入詳情）、非保養範圍（連供應商）
4. **保養說明** — 涵蓋／常見不包括／如何報修／合約為準＋聯絡迪高 CTA
5. **供應商聯絡** — 品牌／型號、電話／電郵／網址、標籤「非迪高保養範圍」
6. **聯絡迪高** — **報修表單**（問題描述必填、可選相片／短片預覽、相關項目預填）→ 可選 `POST` serverless 開 GitHub Issue → **電郵通知**（預設 info@ecdeco.com.hk；WhatsApp 預設關）；存 localStorage 供 Admin 睇；下載文字摘要／Web Share 後備；另保留 WhatsApp／電話／電郵快捷；頁頂提示保養以外可睇維修價目
7. **維修價目**（`#/repairs-pricing`，別名 `#/services`）— **家居維修（保養以外）**收費表（A–F：上門檢查、水電、油漆、木工五金、冷氣檢查、附加費）＋最低消費 **HK$1,800**／次（Kelvin 12/10）＋聲明；保養內請用售後報修；CTA 連到聯絡表單
8. **關於** — 專用較大 logo（`.logo-about`）、定位文案＋連結維修價目／[ecdeco.com.hk](https://ecdeco.com.hk)（唔硬銷、唔提大本營）
9. **Admin** — 見上文

---

## 目錄結構

```
cs-ecdeco/
├── index.html              # 客人端 SPA 入口
├── admin.html              # 本機管理端
├── manifest.webmanifest
├── sw.js
├── package.json
├── css/styles.css
├── css/admin.css
├── js/data.js              # 示範資料＋聯絡＋保養說明＋維修價目
├── js/report-config.js     # 報修 API URL／通知電郵（唔放 secret）
├── js/app.js               # 客人端路由（讀 localStorage 覆寫）
├── js/admin.js             # 管理端（PIN + localStorage）
├── functions/create-report.js  # Netlify／Worker stub：開 GitHub Issue
├── .github/workflows/report.yml # Actions 備援開 Issue
├── scripts/create-report-issue.md
├── assets/logo.png
├── icons/
├── README.md
└── DEPLOY.md
```

---

## 上線前 Kelvin 必須確認

1. 聯絡號碼／電郵是否正確（見上表）
2. 關於頁文案、保養說明草稿是否 OK（Kelvin 可再改）
3. 以真實項目／客人手機替換示範資料（或用 Admin 匯出 JSON 再納入 `data.js`／後端）
4. Admin PIN 僅 Demo；正式環境必須換成真實登入／後端權限
5. 確認 `cs.ecdeco.com.hk` 嘅 Hosting／DNS（見 `DEPLOY.md`；**須 Kelvin 批准先改**）
6. **Review 通過後先 git push**

---

## 日後接真實後端（建議）

而家所有客人／項目／保養／供應商都喺 `js/data.js`（或 Admin localStorage 覆寫）。接後端時可：

1. 登入：後端發真實 SMS／WhatsApp OTP；前端唔再寫死 `demoOtp`
2. API 例：`GET /api/me`、`GET /api/projects`、`GET /api/projects/:id`
3. Admin 改為受保護後台；唔再靠前端 PIN
4. HTTPS 必須；唔公開其他客人項目
5. 報修：生產必須有 tiny backend／serverless（本 repo `functions/create-report.js`）保存 **GITHUB_TOKEN**；可再擴充真正代發電郵（SMTP／Resend），唔好把 PAT 放靜態前端

---

## 明確唔做

- 唔硬銷、唔公開註冊、唔導大本營／招聘  
- 唔擅自改 DNS／Hostinger／正式站  
- 唔擅自改正式 DNS（見 DEPLOY.md）  
- App 說明以合約為準，唔取代法律文件  

---

**版本：** MVP 0.5（2026-10-12 家居維修保養以外價目 `#/repairs-pricing`；最低消費 $1,800）  
**負責人：** 迪高客戶及售後服務部  
