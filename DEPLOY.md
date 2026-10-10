# 迪高售後 App 部署說明（cs.ecdeco.com.hk）

> **重要：** 本文件只列出選項同步驟草案。  
> **唔好擅自改 DNS、Hostinger、Vodien 或任何正式環境。**  
> 所有指向 `cs.ecdeco.com.hk` 嘅變更必須 **Kelvin 書面／訊息批准** 後先執行。

預定公開網址：`https://cs.ecdeco.com.hk`

本專案係 **純靜態檔**（HTML／CSS／JS／圖示），任何支援靜態網站嘅主機都可放。

---

## 上線前檢查清單

- [ ] Kelvin 已填真實迪高 WhatsApp／電話／電郵（`js/data.js` → `contact`）  
      **唔用大本營 6179 1102**
- [ ] 示範資料已換成真實客人／項目，或已接後端
- [ ] 確認 `robots`：MVP 建議維持 `noindex`；公開後再決定
- [ ] HTTPS 憑證就緒
- [ ] Kelvin 批准 DNS／Hosting 變更

---

## 選項 A：Hostinger（靜態檔上傳）

適用：已有 Hostinger 帳戶／迪高相關 hosting。

1. 登入 Hostinger hPanel。
2. 為 `cs.ecdeco.com.hk` 準備 **子網域** 或獨立網站（**先問 Kelvin 用邊個方案**）。
3. 用 File Manager 或 FTP 上傳本目錄內容到該站 `public_html`（或指定 document root）：
   - `index.html`、`css/`、`js/`、`assets/`、`icons/`、`manifest.webmanifest`、`sw.js`
4. 確認首頁可開啟：`https://cs.ecdeco.com.hk/`
5. **DNS（僅 Kelvin 批准後）：**  
   - 通常加 `A` 或 `CNAME` 指到 Hostinger 提供嘅 IP／目標  
   - 或用 Hostinger 面板「Add subdomain」自動帶 DNS  
6. 開啟 Force HTTPS。

**注意：** 唔好覆蓋 `ecdeco.com.hk` 主站檔案；售後 App 應獨立目錄／獨立子網域。

---

## 選項 B：Vodien（靜態／子網域）

適用：域名或 hosting 喺 Vodien。

1. 登入 Vodien 客戶區／cPanel。
2. 建立子網域 `cs`（完整名 `cs.ecdeco.com.hk`）或按 Kelvin 指定嘅方式綁定。
3. 將靜態檔上傳到子網域對應目錄。
4. **DNS（僅 Kelvin 批准後）：**  
   - 喺域名 DNS 管理加 `A`／`CNAME` 指到 Vodien 主機  
   - TTL 可先用 300–3600 秒方便回滾
5. 申請／啟用 SSL（Let’s Encrypt 或 Vodien 提供）。

---

## 選項 C：其他靜態託管（備選）

例如 Cloudflare Pages、Netlify、GitHub Pages、物件儲存＋CDN：

1. 連接本 repo 或手動上傳 `cs-ecdeco/` 內容。
2. 建置指令：**唔需要**（純靜態；publish directory = 專案根目錄）。
3. 自訂網域設為 `cs.ecdeco.com.hk`（**DNS 變更仍須 Kelvin 批准**）。

呢啲平台方便預覽 URL，但正式品牌網域仍建議最終放喺 Kelvin 指定嘅 Hostinger／Vodien／現有基建。

---

## DNS 變更原則（必須 Kelvin 批准）

| 動作 | 可否自動做 |
|------|------------|
| 本機／預覽伺服器跑靜態檔 | ✅ 可以 |
| 寫 DEPLOY 說明、準備上傳包 | ✅ 可以 |
| 改 `cs.ecdeco.com.hk` DNS 記錄 | ❌ 禁止（除非 Kelvin 明確叫做） |
| 改 Hostinger／Vodien 正式設定 | ❌ 禁止（除非 Kelvin 明確叫做） |
| 動 `ecdeco.com.hk` 主站 | ❌ 禁止 |

建議批准訊息模板：

> 「批准將 cs.ecdeco.com.hk 指向〔Hostinger／Vodien／其他〕，並上載售後 App 靜態檔；唔改 ecdeco.com.hk 主站。」

---

## 上傳檔案清單（最小集）

```
index.html
manifest.webmanifest
sw.js
css/styles.css
js/data.js
js/app.js
assets/logo.png
icons/icon-192.png
icons/icon-512.png
icons/apple-touch-icon.png
```

可選：`README.md`、`DEPLOY.md`（唔一定要公開到網站）。

---

## 回滾

若上線後有問題：

1. 還原上一版靜態檔（保留一份 zip 備份）  
2. 或暫時將子網域指回舊目標／停用（**仍須 Kelvin 同意先改 DNS**）

---

**文件版本：** 2026-10-10  
**狀態：** 只作部署指引；未執行任何 DNS／Hosting 變更  
