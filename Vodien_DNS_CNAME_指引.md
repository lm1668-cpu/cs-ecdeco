# `cs.ecdeco.com.hk` → GitHub Pages（唔上載 Vodien）

日期：11/10/2026  
做法：靜態檔繼續喺 GitHub Pages；Vodien 只改 DNS。

現有 Pages：https://lm1668-cpu.github.io/cs-ecdeco/

---

## 1. GitHub Pages 加自訂網域

1. 開 https://github.com/lm1668-cpu/cs-ecdeco/settings/pages  
2. **Custom domain** 填：`cs.ecdeco.com.hk` → Save  
3. 剔 **Enforce HTTPS**（DNS 生效後先剔得）  
4. 等 GitHub 出現 `CNAME` 檔（或手動喺 repo 根目錄加檔案內容一行：`cs.ecdeco.com.hk`）

---

## 2. Vodien DNS

1. 登入 Vodien → 管理 `ecdeco.com.hk` DNS／Zone Editor  
2. **新增／修改**記錄：  
   - **Type：** `CNAME`  
   - **Host／Name：** `cs`  
   - **Value／Points to：** `lm1668-cpu.github.io`  
   - TTL：300 或 Auto  
3. 如果已有 `cs` 嘅 A 記錄，刪除或改成上面 CNAME（唔好兩條一齊衝突）  
4. **唔好改** `@`、`www`、MX 等其他記錄  

---

## 3. 等待同測試

1. 等 5–60 分鐘（有時更耐）  
2. 開 https://cs.ecdeco.com.hk/  
3. 應見到售後 App；後台 https://cs.ecdeco.com.hk/admin.html  

若 404：喺 Pages 設定確認 Custom domain 已存，同埋 repo 有 `CNAME` 檔。

---

## 4. 報修 API（之後）

網頁喺 GitHub 都得；API 仍要另外部署（Cloudflare Worker／有 Node 嘅主機），再填 `js/report-config.js` 嘅 `REPORT_API_URL`。
