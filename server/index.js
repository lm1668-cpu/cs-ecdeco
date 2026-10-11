"use strict";
const http = require("http");
const path = require("path");
const { handleCreateReport } = require("../functions/create-report.js");

const PORT = Number(process.env.PORT || 8787);
const env = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GITHUB_OWNER: process.env.GITHUB_OWNER || "lm1668-cpu",
  GITHUB_REPO: process.env.GITHUB_REPO || "cs-ecdeco",
  ALLOW_ORIGIN: process.env.ALLOW_ORIGIN || "*",
  NOTIFY_EMAIL: process.env.NOTIFY_EMAIL || "info@ecdeco.com.hk",
};

const server = http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    body,
    path: req.url,
  };
  try {
    const result = await handleCreateReport(event, env);
    res.writeHead(result.statusCode || 200, result.headers || {});
    res.end(result.body || "");
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: String(e && e.message) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("create-report listening on", PORT);
});
