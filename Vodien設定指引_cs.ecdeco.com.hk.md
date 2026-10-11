# Vodien 設定指引：`cs.ecdeco.com.hk`（迪高售後 App）

日期：11/10/2026  
用途：喺 Vodien 開子網域、上載靜態網頁，並預留報修 API。  
**重要：** 未獲 Kelvin 批准前，唔好改 `ecdeco.com.hk` 主站檔案或錯誤覆蓋主站。

---

## 你會得到咩

| 項目 | 結果 |
|------|------|
| 網址 | `https://cs.ecdeco.com.hk/`（客人版售後 App） |
| 後台 | `https://cs.ecdeco.com.hk/admin.html`（PIN 見 README） |
| 報修 API（稍後） | 建議 `https://cs.ecdeco.com.hk/api/create-report`（視 Hosting 有冇 Node／CGI） |

原始檔案喺 GitHub：https://github.com/lm1668-cpu/cs-ecdeco  

---

## 第一步：登入 Vodien

1. 開瀏覽器去 [Vodien 客戶區](https://www.vodien.com/) → **Client Area / 客戶登入**。  
2. 用你管理 `ecdeco.com.hk` 嗰個帳號登入。  
3. 搵 **Services / My Products** → 揀 **ecdeco.com.hk** 相關 Hosting（或 Domain）。  
4. 撳 **Login to cPanel**（或「管理主機」）。  
   - 如果冇 cPanel、係 Plesk／其他面板，步驟名稱會略有唔同，但概念一樣：子網域 + 文件目錄 + DNS + SSL。

---

## 第二步：建立子網域 `cs`

喺 cPanel：

1. 搵 **Domains** → **Subdomains**（或 **Domains** 列表入面 Add Domain）。  
2. 填：  
   - **Subdomain：** `cs`  
   - **Domain：** `ecdeco.com.hk`  
   - 完整會變成 **`cs.ecdeco.com.hk`**  
3. **Document Root（文件根目錄）** 建議：  
   - `public_html/cs`  
   - 或系統自動產生嘅 `cs.ecdeco.com.hk` 目錄  
4. 記住呢個目錄路徑（上載檔案要用）。  
5. 儲存。

> 唔好將文件根目錄設成主站 `public_html` 根目錄，否則會蓋住官網。

---

## 第三步：DNS（通常自動，仍要核對）

1. 喺 Vodien／cPanel 開 **Zone Editor** 或 **DNS Management**（域名 `ecdeco.com.hk`）。  
2. 確認有一條類似：  
   - **Type：** `A` 或 `CNAME`  
   - **Name／Host：** `cs`  
   - **Value：** 指向呢部 Hosting 嘅 IP（A）或主機名（CNAME）  
3. 如果開子網域時系統已自動加，就唔使改。  
4. TTL 可先用 300–3600。  
5. **未批准前唔好改其他記錄**（例如 `@`、`www`、電郵 MX）。

生效可能要幾分鐘至幾小時。電腦用 `ping cs.ecdeco.com.hk` 或上網查 DNS 睇吓有冇指對。

---

## 第四步：上載售後 App 檔案

### 準備檔案

從 GitHub 下載最新版，或用我部電腦嘅 `/workspace/customer/cs-ecdeco/`。  
**要上載嘅最小集：**

```
index.html
admin.html
manifest.webmanifest
sw.js
css/          （成個資料夾）
js/           （成個資料夾，含 app.js、data.js、admin.js、report-config.js）
assets/       （logo）
icons/        （圖示）
```

唔一定要上：`README.md`、`DEPLOY.md`、`server/`、`functions/`、`.git/`。

### 用 cPanel File Manager

1. cPanel → **File Manager**。  
2. 進入第二步嗰個 Document Root（例如 `public_html/cs`）。  
3. 確認入面係空嘅（或者只有預設 `index.html`；有就刪或改名備份）。  
4. **Upload** 上述檔案／資料夾；或本機 zip 後上載再 **Extract**。  
5. 核對：根目錄有 `index.html`，同埋 `css/`、`js/` 資料夾。

### 用 FTP／SFTP（可選）

- Host：cPanel 顯示嘅 FTP 伺服器  
- 用戶／密碼：Hosting FTP 帳號  
- 上傳到 Document Root  

---

## 第五步：開 SSL（HTTPS）

1. cPanel → **SSL/TLS Status** 或 **Let’s Encrypt**／**AutoSSL**。  
2. 對 `cs.ecdeco.com.hk` 剔選 → **Run AutoSSL**／簽發憑證。  
3. 完成後用瀏覽器開：  
   - `https://cs.ecdeco.com.hk/`  
4. 如自動轉址未開：cPanel → **Force HTTPS Redirect**（只對呢個子網域）。

---

## 第六步：試網頁

1. 開 `https://cs.ecdeco.com.hk/`  
2. 示範登入：手機 `91234567`，驗證碼 `123456`（預覽用）。  
3. 試項目、保養說明、聯絡頁。  
4. 後台：`https://cs.ecdeco.com.hk/admin.html`（PIN 見 README，而家係 `246810`）。

---

## 第七步：報修 API（開 Issue + 電郵通知）

靜態 Hosting **多數唔可以直接跑 Node API**。有三種做法（揀一個）：

### 方案 A（推薦）：Vodien 若有「Application／Node.js」或可跑 Passenger

1. 問 Vodien 客服／睇 cPanel 有冇 **Setup Node.js App**。  
2. 有嘅話：  
   - Application root：例如 `nodejs/cs-report`  
   - Application URL：`cs.ecdeco.com.hk` 下面路徑 `/api` 或獨立子網域 `api-cs.ecdeco.com.hk`  
   - Startup：用 repo 入面 `server/index.js`  
   - 環境變數：  
     - `GITHUB_TOKEN`＝你開嘅 fine-grained PAT（Issues: Read and write）  
     - `NOTIFY_EMAIL`＝`info@ecdeco.com.hk`  
     - `ALLOW_ORIGIN`＝`https://cs.ecdeco.com.hk`  
3. 然後改 `js/report-config.js`：  
   ```js
   REPORT_API_URL: "https://cs.ecdeco.com.hk/api/",  // 改成實際 URL
   NOTIFY_EMAIL: "info@ecdeco.com.hk",
   OPEN_WHATSAPP: false,
   ```  
4. 再上載更新咗嘅 `js/report-config.js`。

### 方案 B：另開免費 Cloudflare Worker 做 API

1. Cloudflare 開 Worker，貼 `functions/create-report.js` 適配碼。  
2. Secret 設 `GITHUB_TOKEN`。  
3. `REPORT_API_URL` 填 Worker 網址。  
4. 網頁仍放 Vodien。

### 方案 C：暫時無 API

- `REPORT_API_URL` 留空。  
- 客人提交會開電郵預填去 `info@ecdeco.com.hk`，唔自動開 GitHub Issue。

**Token 唔可以放喺公開網頁或 `report-config.js`。**

---

## 檢查清單（你自己剔）

- [ ] 已開子網域 `cs.ecdeco.com.hk`，Document Root **唔係**主站根目錄  
- [ ] DNS `cs` 記錄正確  
- [ ] 已上載靜態檔，`https://cs.ecdeco.com.hk/` 打得開  
- [ ] SSL 正常（瀏覽器鎖頭）  
- [ ] 示範登入／後台試過  
- [ ]（可選）API 已部署，`REPORT_API_URL` 已填，測試開到新 Issue  

---

## 常見問題

**開咗子網域但網頁 404**  
→ Document Root 錯，或未上載 `index.html`。

**見到迪高官網而唔係售後 App**  
→ 子網域指錯咗主站目錄；改回 `public_html/cs` 之類獨立目錄。

**HTTPS 警告**  
→ 等 AutoSSL 簽完，或喺 SSL/TLS Status 手動簽 `cs.ecdeco.com.hk`。

**報修開唔到 Issue**  
→ 未設 API／Token，或 `REPORT_API_URL` 仍係空。

---

## 完成後話我知

請回覆：  
1. 子網域 + SSL 是否 OK  
2. Document Root 路徑  
3. 有冇 Node.js App（方便我幫你接 API）  

我可以再幫你改 `REPORT_API_URL`、推 GitHub、同埋對測報修流程。
