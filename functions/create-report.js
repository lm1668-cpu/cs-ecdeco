/**
 * 迪高售後報修 — 建立 GitHub Issue（serverless stub）
 *
 * 用途：接受 POST JSON，用環境變數 GITHUB_TOKEN 喺 lm1668-cpu/cs-ecdeco 開 Issue，
 * 回傳 { ok, issue_url, issue_number, notify_email }。
 * 前端開完 Issue 後以【電郵】通知（mailto / 日後可接 SMTP）；WhatsApp 預設關閉。
 *
 * 部署（擇一）：
 *   A) Netlify Functions：本檔放 functions/create-report.js →
 *      POST https://YOUR_SITE/.netlify/functions/create-report
 *   B) Cloudflare Workers：見檔尾 export；設 secret GITHUB_TOKEN，綁 route
 *   C) 其他 Node serverless：呼叫 handleCreateReport(body, env)
 *
 * 環境變數（只放主機 Secrets，永不 commit）：
 *   GITHUB_TOKEN  — fine-grained PAT：Issues: Read and write（限 lm1668-cpu/cs-ecdeco）
 *                   或 classic PAT：repo / public_repo（視 repo 可見性）
 *   GITHUB_OWNER  — 預設 lm1668-cpu
 *   GITHUB_REPO   — 預設 cs-ecdeco
 *   ALLOW_ORIGIN  — CORS 來源，例 https://cs.ecdeco.com.hk（多個用逗號；* 僅預覽）
 *   NOTIFY_EMAIL  — 回傳畀前端嘅預設通知電郵（預設 info@ecdeco.com.hk）
 *
 * 本 stub 唔代發電郵（避免再加 mail API secret）；前端用 mailto 開啟預填郵件。
 * 若要伺服器代發，可另加 RESEND_API_KEY／SMTP 並擴充本檔。
 *
 * 請求 JSON 例：
 * {
 *   "guest": "陳大文",
 *   "phone": "+852 91234567",
 *   "project": "太古城示範單位",
 *   "projectId": "p1",
 *   "time": "11/10/2026 14:30",
 *   "problem": "主人房地台空鼓…",
 *   "attachments": ["photo1.jpg", "clip.mp4"],
 *   "photoCount": 1,
 *   "videoCount": 1,
 *   "mediaNote": "媒體未上載 GitHub；請經電郵附件或稍後補傳。"
 * }
 */

"use strict";

const DEFAULT_OWNER = "lm1668-cpu";
const DEFAULT_REPO = "cs-ecdeco";

function corsHeaders(origin, allowOriginEnv) {
  const allow = (allowOriginEnv || "*").trim();
  let acao = "*";
  if (allow !== "*") {
    const list = allow.split(",").map((s) => s.trim()).filter(Boolean);
    if (origin && list.includes(origin)) acao = origin;
    else if (list.length === 1) acao = list[0];
    else acao = list[0] || "*";
  }
  return {
    "Access-Control-Allow-Origin": acao,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(status, body, headers) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

function buildIssueTitle(report) {
  const proj = String(report.project || report.projectName || "未指定項目").trim();
  const short = String(report.problem || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
  const suffix = short ? ` — ${short}${String(report.problem || "").trim().length > 40 ? "…" : ""}` : "";
  return `【售後報修】${proj}${suffix}`;
}

function buildIssueBody(report) {
  const guest = report.guest || report.customerName || "—";
  const phone = report.phone || "—";
  const project = report.project || report.projectName || "—";
  const time = report.time || report.whenLabel || "—";
  const problem = report.problem || "—";
  const attachments = Array.isArray(report.attachments)
    ? report.attachments
    : Array.isArray(report.fileNames)
      ? report.fileNames
      : [];
  const photoCount =
    typeof report.photoCount === "number"
      ? report.photoCount
      : attachments.filter((n) => /\.(jpe?g|png|gif|webp|heic)$/i.test(String(n))).length;
  const videoCount =
    typeof report.videoCount === "number"
      ? report.videoCount
      : attachments.filter((n) => /\.(mp4|mov|webm|m4v)$/i.test(String(n))).length;
  const mediaNote =
    report.mediaNote ||
    "媒體檔案未上載至 GitHub Issue；請經電郵附件補傳，或稍後另行傳送相片／短片。";

  const attachLines =
    attachments.length > 0
      ? attachments.map((n) => `- \`${String(n).replace(/`/g, "")}\``).join("\n")
      : "_無檔名記錄_";

  const countParts = [];
  if (photoCount) countParts.push(`相片 ${photoCount} 張`);
  if (videoCount) countParts.push(`短片 ${videoCount} 段`);
  if (!countParts.length && attachments.length) {
    countParts.push(`共 ${attachments.length} 個檔案`);
  }
  const countLine = countParts.length ? countParts.join("／") : "無";

  return [
    "## 迪高售後報修",
    "",
    "| 欄位 | 內容 |",
    "|------|------|",
    `| 客人 | ${escapeMdCell(guest)} |`,
    `| 電話 | ${escapeMdCell(phone)} |`,
    `| 項目 | ${escapeMdCell(project)} |`,
    `| 時間 | ${escapeMdCell(time)} |`,
    "",
    "### 問題描述",
    "",
    String(problem),
    "",
    "### 附件",
    "",
    `**統計：** ${countLine}`,
    "",
    attachLines,
    "",
    `> **媒體說明：** ${mediaNote}`,
    "",
    "---",
    "_由售後 App 經 serverless API 自動建立_",
  ].join("\n");
}

function escapeMdCell(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

/**
 * @param {object} report
 * @param {{ GITHUB_TOKEN?: string, GITHUB_OWNER?: string, GITHUB_REPO?: string, NOTIFY_EMAIL?: string, ALLOW_ORIGIN?: string }} env
 */
async function createGitHubIssue(report, env) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    const err = new Error("GITHUB_TOKEN is not configured");
    err.code = "NO_TOKEN";
    throw err;
  }
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const title = buildIssueTitle(report);
  const body = buildIssueBody(report);

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "cs-ecdeco-create-report",
    },
    body: JSON.stringify({
      title,
      body,
      // 唔預設 labels：repo 未建立同名 label 會令 API 失敗；需要時喺 GitHub 手動加
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data && data.message) || `GitHub API ${res.status}`
    );
    err.code = "GITHUB_API";
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return {
    html_url: data.html_url,
    number: data.number,
    title: data.title,
  };
}

/**
 * Shared handler used by Netlify / Cloudflare / other adapters.
 * @returns {Promise<{ statusCode: number, headers: object, body: string }>}
 */
async function handleCreateReport(eventLike, env) {
  const method = (eventLike.httpMethod || eventLike.method || "GET").toUpperCase();
  const origin =
    (eventLike.headers &&
      (eventLike.headers.origin || eventLike.headers.Origin)) ||
    "";
  const cors = corsHeaders(origin, env.ALLOW_ORIGIN);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed" }, cors);
  }

  let report;
  try {
    const raw =
      typeof eventLike.body === "string"
        ? eventLike.body
        : eventLike.body != null
          ? JSON.stringify(eventLike.body)
          : "";
    report = raw ? JSON.parse(raw) : {};
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body" }, cors);
  }

  if (!report || typeof report !== "object") {
    return jsonResponse(400, { ok: false, error: "Expected JSON object" }, cors);
  }

  const problem = String(report.problem || "").trim();
  if (!problem) {
    return jsonResponse(400, { ok: false, error: "problem is required" }, cors);
  }

  try {
    const issue = await createGitHubIssue(report, env);
    const notifyEmail = env.NOTIFY_EMAIL || "info@ecdeco.com.hk";
    return jsonResponse(
      201,
      {
        ok: true,
        issue_url: issue.html_url,
        issue_number: issue.number,
        title: issue.title,
        notify_email: notifyEmail,
      },
      cors
    );
  } catch (err) {
    if (err.code === "NO_TOKEN") {
      return jsonResponse(
        500,
        { ok: false, error: "Server misconfigured: GITHUB_TOKEN missing" },
        cors
      );
    }
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
    return jsonResponse(
      status,
      {
        ok: false,
        error: err.message || "Failed to create issue",
        code: err.code || "UNKNOWN",
      },
      cors
    );
  }
}

/** Netlify Functions entry */
exports.handler = async function handler(event) {
  const env = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_REPO: process.env.GITHUB_REPO,
    ALLOW_ORIGIN: process.env.ALLOW_ORIGIN,
    NOTIFY_EMAIL: process.env.NOTIFY_EMAIL || "info@ecdeco.com.hk",
  };
  return handleCreateReport(event, env);
};

exports.handleCreateReport = handleCreateReport;
exports.buildIssueBody = buildIssueBody;
exports.buildIssueTitle = buildIssueTitle;

/*
 * --- Cloudflare Workers / Pages Functions 適配例（複製到 worker 或另檔）---
 *
 * export default {
 *   async fetch(request, env) {
 *     const url = new URL(request.url);
 *     if (url.pathname !== "/" && !url.pathname.endsWith("/create-report")) {
 *       return new Response("Not found", { status: 404 });
 *     }
 *     const eventLike = {
 *       httpMethod: request.method,
 *       headers: Object.fromEntries(request.headers),
 *       body: request.method === "POST" ? await request.text() : "",
 *     };
 *     const result = await handleCreateReport(eventLike, env);
 *     return new Response(result.body || null, {
 *       status: result.statusCode,
 *       headers: result.headers,
 *     });
 *   },
 * };
 *
 * wrangler secret put GITHUB_TOKEN
 * （可選）GITHUB_OWNER / GITHUB_REPO / ALLOW_ORIGIN 用 vars 或 secrets
 */
