/**
 * 報修 API 設定（靜態站可改此檔，唔好放任何 GitHub PAT／secret）
 *
 * 生產：部署 functions/create-report.js（Netlify Function 或改成 Cloudflare Worker），
 * 將 GITHUB_TOKEN 只放喺主機環境變數／Secrets，再把 REPORT_API_URL 設成該 endpoint。
 *
 * Kelvin 11/10：開完 GitHub Issue 後以【電郵】通知（預設 info@ecdeco.com.hk）；
 * WhatsApp（wa.me）預設關閉，僅當 OPEN_WHATSAPP 為 true 先額外開啟。
 *
 * 留空 REPORT_API_URL = 唔打 API、唔開 Issue；仍存 localStorage + 開電郵摘要（MVP）。
 */
window.ECDECO_REPORT_CONFIG = {
  /** 例：https://cs-ecdeco-report.YOUR_SUBDOMAIN.workers.dev 或 /.netlify/functions/create-report */
  REPORT_API_URL: "",

  /** Issue 目標 repo（供文件／後端預設；前端唔用嚟直接 call GitHub） */
  GITHUB_OWNER: "lm1668-cpu",
  GITHUB_REPO: "cs-ecdeco",

  /** 報修成功後通知電郵（mailto 預填收件人） */
  NOTIFY_EMAIL: "info@ecdeco.com.hk",

  /**
   * 是否額外開啟 WhatsApp（wa.me）。Kelvin 11/10：預設 false。
   * 設 true 先會喺電郵之外再開 WhatsApp 預填同一摘要。
   */
  OPEN_WHATSAPP: false,

  /** WhatsApp 號碼（僅 OPEN_WHATSAPP 時用；與 data.js contact.whatsapp 一致） */
  WHATSAPP: "85268262764",
};
