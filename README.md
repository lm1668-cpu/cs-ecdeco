# 迪高售後服務（手機網頁 App）

已合作客人專用售後入口：睇自己項目、保養範圍詳情、非保養供應商聯絡、一鍵聯絡迪高。

- **正式網址（預定）：** `https://cs.ecdeco.com.hk`（DNS／Hosting **未改前唔好擅自設定**）
- **風格參考：** 手機網頁 App（類似 jobs.renocamp.io 嘅簡單靜態／SPA）
- **品牌：** 對齊《迪高簡易品牌視覺規範》同 `ecdeco_logo.png`
- **語言：** 繁體中文（香港）
- **狀態：** MVP 預覽（示範登入＋本地 JSON／JS 資料＋本機 Admin）

> **Kelvin 請先 review 本機改動，確認後先 push 上 GitHub。請勿在未批准前 git push。**

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

---

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

## 畫面一覽（MVP）

1. **歡迎／登入** — 較大 logo（`.logo-welcome`）、標語「你嘅項目 · 售後服務」、手機 OTP（mock）
2. **我的項目** — 示範兩個項目列表
3. **項目詳情** — 基本資料、有保養範圍（可撳入詳情）、非保養範圍（連供應商）
4. **保養說明** — 涵蓋／常見不包括／如何報修／合約為準＋聯絡迪高 CTA
5. **供應商聯絡** — 品牌／型號、電話／電郵／網址、標籤「非迪高保養範圍」
6. **聯絡迪高** — WhatsApp／電話／電郵；預填「項目名 —— 我想查售後／報修」
7. **關於** — 專用較大 logo（`.logo-about`）、定位文案＋連結 [ecdeco.com.hk](https://ecdeco.com.hk)（唔硬銷、唔提大本營）
8. **Admin** — 見上文

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
├── js/data.js              # 示範資料＋聯絡＋保養說明
├── js/app.js               # 客人端路由（讀 localStorage 覆寫）
├── js/admin.js             # 管理端（PIN + localStorage）
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

---

## 明確唔做

- 唔硬銷、唔公開註冊、唔導大本營／招聘  
- 唔擅自改 DNS／Hostinger／正式站  
- 唔擅自 git push（等 Kelvin review）  
- App 說明以合約為準，唔取代法律文件  

---

**版本：** MVP 0.2（2026-10-10 Kelvin 更新）  
**負責人：** 迪高客戶及售後服務部  
