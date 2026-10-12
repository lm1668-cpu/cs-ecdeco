/**
 * Cloudflare Worker — cs.ecdeco 報修 API
 * Secrets: GITHUB_TOKEN
 * Vars: ALLOW_ORIGIN, NOTIFY_EMAIL, GITHUB_OWNER, GITHUB_REPO
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

function escapeMdCell(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildIssueTitle(report) {
  const proj = String(report.project || report.projectName || "未指定項目").trim();
  const short = String(report.problem || "").trim().replace(/\s+/g, " ").slice(0, 40);
  const suffix = short
    ? ` — ${short}${String(report.problem || "").trim().length > 40 ? "…" : ""}`
    : "";
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
  if (!countParts.length && attachments.length) countParts.push(`共 ${attachments.length} 個檔案`);
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
    "_由售後 App 經 Cloudflare Worker 自動建立_",
  ].join("\n");
}

async function createGitHubIssue(report, env) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    const err = new Error("GITHUB_TOKEN is not configured");
    err.code = "NO_TOKEN";
    throw err;
  }
  const owner = env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = env.GITHUB_REPO || DEFAULT_REPO;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "cs-ecdeco-create-report",
    },
    body: JSON.stringify({ title: buildIssueTitle(report), body: buildIssueBody(report) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.message) || `GitHub API ${res.status}`);
    err.code = "GITHUB_API";
    err.status = res.status;
    throw err;
  }
  return { html_url: data.html_url, number: data.number, title: data.title };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathOk =
      url.pathname === "/" ||
      url.pathname === "/create-report" ||
      url.pathname.endsWith("/create-report");
    if (!pathOk) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env.ALLOW_ORIGIN || "https://cs.ecdeco.com.hk");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
      });
    }

    let report;
    try {
      report = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
      });
    }
    if (!report || typeof report !== "object") {
      return new Response(JSON.stringify({ ok: false, error: "Expected JSON object" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
      });
    }
    if (!String(report.problem || "").trim()) {
      return new Response(JSON.stringify({ ok: false, error: "problem is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
      });
    }

    try {
      const issue = await createGitHubIssue(report, env);
      const notifyEmail = env.NOTIFY_EMAIL || "info@ecdeco.com.hk";
      return new Response(
        JSON.stringify({
          ok: true,
          issue_url: issue.html_url,
          issue_number: issue.number,
          title: issue.title,
          notify_email: notifyEmail,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
        }
      );
    } catch (err) {
      if (err.code === "NO_TOKEN") {
        return new Response(
          JSON.stringify({ ok: false, error: "Server misconfigured: GITHUB_TOKEN missing" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
          }
        );
      }
      const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 502;
      return new Response(
        JSON.stringify({
          ok: false,
          error: err.message || "Failed to create issue",
          code: err.code || "UNKNOWN",
        }),
        {
          status,
          headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
        }
      );
    }
  },
};
