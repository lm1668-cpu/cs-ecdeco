# 迪高售後服務（手機網頁 App）

已合作客人專用售後入口：睇自己項目、保養範圍、非保養供應商聯絡、一鍵聯絡迪高。

- **正式網址（預定）：** `https://cs.ecdeco.com.hk`（DNS／Hosting **未改前唔好擅自設定**）
- **風格參考：** 手機網頁 App（類似 jobs.renocamp.io 嘅簡單靜態／SPA）
- **品牌：** 對齊《迪高簡易品牌視覺規範》同 `ecdeco_logo.png`
- **語言：** 繁體中文（香港）
- **狀態：** MVP 預覽（示範登入＋本地 JSON／JS 資料）

---

## 本機預覽

喺本目錄執行：

```bash
cd /workspace/customer/cs-ecdeco
npm run dev
```

然後瀏覽器打開：

```
http://127.0.0.1:5173/
```

唔想用 npm 亦可：

```bash
cd /workspace/customer/cs-ecdeco
python3 -m http.server 8080 --bind 127.0.0.1
# 打開 http://127.0.0.1:8080/
```

> 建議用手機闊度（Chrome DevTools device mode）預覽；亦可「加入主畫面」測試基本 PWA meta／manifest。

---

## 示範登入

| 項目 | 值 |
|------|-----|
| 手機 | `91234567`（兩個項目）或 `98765432`（一個項目） |
| 驗證碼 | `123456`（固定，僅預覽） |

未登記手機號碼會提示「未有登記項目」。

---

## 畫面一覽（MVP）

1. **歡迎／登入** — logo、標語「你嘅項目 · 售後服務」、手機 OTP（mock）
2. **我的項目** — 示範兩個項目列表
3. **項目詳情** — 基本資料、有保養範圍、非保養範圍（連供應商）
4. **供應商聯絡** — 品牌／型號、電話／電郵／網址、標籤「非迪高保養範圍」
5. **聯絡迪高** — WhatsApp／電話／電郵；預填「項目名 —— 我想查售後／報修」
6. **關於** — 一句定位＋連結 [ecdeco.com.hk](https://ecdeco.com.hk)（唔硬銷、唔提大本營）

---

## 目錄結構

```
cs-ecdeco/
├── index.html              # SPA 入口
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # 基本 offline cache
├── package.json            # npm run dev / preview
├── css/styles.css
├── js/data.js              # 示範資料＋聯絡 placeholder
├── js/app.js               # 路由同畫面
├── assets/logo.png
├── icons/                  # 192 / 512 / apple-touch
├── README.md
└── DEPLOY.md               # 上線選項（唔執行 DNS）
```

---

## 上線前 Kelvin 必須改嘅項目

1. **迪高對外聯絡**（`js/data.js` → `contact`）  
   - `whatsapp`、`phone`、`phoneTel`、`email`  
   - 現為 placeholder（`852XXXXXXXX`）  
   - **切勿使用大本營號碼 6179 1102**
2. 以真實項目／客人手機替換示範資料（或接後端 API）
3. 確認 `cs.ecdeco.com.hk` 嘅 Hosting／DNS（見 `DEPLOY.md`；**須 Kelvin 批准先改**）

---

## 日後接真實後端（建議）

而家所有客人／項目／保養／供應商都喺 `js/data.js`。接後端時可：

1. 登入：後端發真實 SMS／WhatsApp OTP；前端唔再寫死 `demoOtp`
2. API 例：`GET /api/me`、`GET /api/projects`、`GET /api/projects/:id`（只回傳該客人可見資料）
3. 聯絡方式改由環境變數或後台設定注入，唔寫死喺前端
4. HTTPS 必須；唔公開其他客人項目

過渡期亦可用 Google Sheet／OneDrive 表由客戶部更新，再由簡單後端或靜態 build 產出 JSON。

---

## 明確唔做

- 唔硬銷、唔公開註冊、唔導大本營／招聘  
- 唔擅自改 DNS／Hostinger／正式站  
- App 說明以合約為準，唔取代法律文件  

---

**版本：** MVP 0.1（2026-10-10）  
**負責人：** 迪高客戶及售後服務部  
