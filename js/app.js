/**
 * 迪高售後服務 — SPA 路由與畫面
 * Hash routes:
 *   #/login
 *   #/projects
 *   #/project/:id
 *   #/warranty/:projectId/:scopeId
 *   #/supplier/:projectId/:supplierId
 *   #/contact?project=:id  (報修表單 → GitHub Issue API + 電郵通知；WhatsApp 可選)
 *   #/about
 */
(function () {
  const STORAGE_OVERRIDE_KEY = "ecdeco_cs_data_override";
  const SESSION_KEY = "ecdeco_cs_session";

  /** 合併 data.js 預設與 admin localStorage 覆寫 */
  function loadData() {
    const base = window.ECDECO_DATA || {};
    try {
      const raw = localStorage.getItem(STORAGE_OVERRIDE_KEY);
      if (!raw) return base;
      const override = JSON.parse(raw);
      if (!override || typeof override !== "object") return base;
      return {
        ...base,
        ...override,
        contact: { ...base.contact, ...(override.contact || {}) },
        about: { ...base.about, ...(override.about || {}) },
        customers: override.customers || base.customers,
        projects: override.projects || base.projects,
        warrantyDetails: {
          ...(base.warrantyDetails || {}),
          ...(override.warrantyDetails || {}),
        },
        supplierCatalog: override.supplierCatalog || base.supplierCatalog,
        demoOtp: override.demoOtp || base.demoOtp,
      };
    } catch {
      return base;
    }
  }

  let DATA = loadData();

  const TITLE_TO_DETAIL = [
    { re: /泥水/, key: "masonry" },
    { re: /油漆/, key: "painting" },
    { re: /木工|訂造|傢俬|間隔|櫃/, key: "carpentry" },
    { re: /水電/, key: "mep" },
    { re: /電氣|電工/, key: "electrical" },
  ];

  function resolveWarrantyDetail(scope) {
    if (!scope) return DATA.warrantyDetails.other;
    if (scope.detailKey && DATA.warrantyDetails[scope.detailKey]) {
      return DATA.warrantyDetails[scope.detailKey];
    }
    const title = scope.title || "";
    for (const row of TITLE_TO_DETAIL) {
      if (row.re.test(title) && DATA.warrantyDetails[row.key]) {
        return DATA.warrantyDetails[row.key];
      }
    }
    return DATA.warrantyDetails.other;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const appEl = $("#app");
  const mainEl = $("#main");
  const headerEl = $("#app-header");
  const navEl = $("#bottom-nav");

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(customer) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        customerId: customer.id,
        phone: customer.phone,
        name: customer.name,
        projectIds: customer.projectIds,
      })
    );
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function requireAuth() {
    const s = getSession();
    if (!s) {
      location.hash = "#/login";
      return null;
    }
    return s;
  }

  function parseHash() {
    const raw = (location.hash || "#/login").replace(/^#/, "") || "/login";
    const [pathPart, queryPart] = raw.split("?");
    const parts = pathPart.split("/").filter(Boolean);
    const query = {};
    if (queryPart) {
      queryPart.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        query[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    }
    return { parts, query, path: "/" + parts.join("/") };
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${y}年${Number(m)}月${Number(d)}日`;
  }

  function setChrome({ title, showNav, showLogout, authOnly }) {
    headerEl.classList.toggle("hidden", authOnly);
    navEl.classList.toggle("hidden", !showNav);
    mainEl.classList.toggle("auth-only", !!authOnly);
    if (!authOnly) {
      $("#header-title").textContent = title || "迪高售後";
      $("#btn-logout").classList.toggle("hidden", !showLogout);
    }
    if (showNav) {
      const active =
        title === "關於迪高"
          ? "about"
          : title === "聯絡迪高"
            ? "contact"
            : "projects";
      navEl.querySelectorAll("a").forEach((a) => {
        a.classList.toggle("active", a.dataset.nav === active);
      });
    }
  }

  /* ---------- Screens ---------- */

  function renderLogin() {
    setChrome({ authOnly: true, showNav: false });
    mainEl.innerHTML = `
      <div class="welcome">
        <img class="logo-welcome welcome-logo" src="assets/logo.png" alt="迪高室內設計" width="252" height="252">
        <h1 class="welcome-tag">你嘅項目 · 售後服務</h1>
        <div class="gold-line" aria-hidden="true"></div>
        <p class="welcome-sub">已合作客人專用入口</p>
        <div class="card" id="login-card">
          <label class="field-label" for="phone">香港手機號碼</label>
          <div class="input-row">
            <span class="input-prefix">+852</span>
            <input id="phone" type="tel" inputmode="numeric" maxlength="8" autocomplete="tel-national" placeholder="8 位手機號碼" aria-describedby="phone-hint">
          </div>
          <p class="field-hint" id="phone-hint">只限已登記熟客；唔設公開註冊。</p>
          <p class="error-msg" id="login-error" role="alert"></p>
          <div class="btn-row">
            <button type="button" class="btn btn-cta" id="btn-send-otp">傳送驗證碼</button>
          </div>
        </div>
        <div class="demo-banner">
          <strong>預覽示範</strong><br>
          手機：91234567 或 98765432<br>
          驗證碼：123456（固定）
        </div>
      </div>
    `;

    const phoneInput = $("#phone");
    phoneInput.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 8);
      $("#login-error").textContent = "";
    });

    $("#btn-send-otp").addEventListener("click", () => {
      const phone = phoneInput.value.trim();
      if (!/^\d{8}$/.test(phone)) {
        $("#login-error").textContent = "請輸入 8 位香港手機號碼。";
        return;
      }
      const customer = DATA.customers[phone];
      if (!customer) {
        $("#login-error").textContent =
          "呢個號碼未有登記項目。如有疑問請聯絡迪高。";
        return;
      }
      renderOtpStep(customer);
    });
  }

  function renderOtpStep(customer) {
    setChrome({ authOnly: true, showNav: false });
    mainEl.innerHTML = `
      <div class="welcome">
        <img class="logo-welcome welcome-logo" src="assets/logo.png" alt="迪高室內設計" width="252" height="252">
        <h1 class="welcome-tag">輸入驗證碼</h1>
        <div class="gold-line" aria-hidden="true"></div>
        <p class="welcome-sub">已傳送至 +852 ${escapeHtml(customer.phone)}（示範）</p>
        <div class="card">
          <label class="field-label" for="otp">6 位驗證碼</label>
          <input class="otp-input" id="otp" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••">
          <p class="error-msg" id="otp-error" role="alert"></p>
          <div class="btn-row">
            <button type="button" class="btn btn-cta" id="btn-verify">確認登入</button>
            <button type="button" class="btn-link" id="btn-back-phone">改用其他號碼</button>
          </div>
        </div>
        <div class="demo-banner">
          <strong>預覽示範</strong>：驗證碼固定為 <strong>123456</strong>
        </div>
      </div>
    `;

    const otpInput = $("#otp");
    otpInput.focus();
    otpInput.addEventListener("input", () => {
      otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);
      $("#otp-error").textContent = "";
    });

    $("#btn-verify").addEventListener("click", () => {
      const code = otpInput.value.trim();
      if (code !== DATA.demoOtp) {
        $("#otp-error").textContent = "驗證碼不正確。示範請輸入 123456。";
        return;
      }
      setSession(customer);
      location.hash = "#/projects";
    });

    $("#btn-back-phone").addEventListener("click", () => {
      location.hash = "#/login";
    });

    otpInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("#btn-verify").click();
    });
  }

  function renderProjects() {
    const session = requireAuth();
    if (!session) return;
    setChrome({ title: "我的項目", showNav: true, showLogout: true });

    const projects = session.projectIds
      .map((id) => DATA.projects[id])
      .filter(Boolean);

    if (!projects.length) {
      mainEl.innerHTML = `<div class="empty"><p>暫時未有項目資料。</p></div>`;
      return;
    }

    mainEl.innerHTML = `
      <div class="section-head">
        <p class="kicker">你好，${escapeHtml(session.name)}</p>
        <h1>我的項目</h1>
        <p>揀一個項目睇保養範圍同供應商聯絡。</p>
      </div>
      <div class="project-list">
        ${projects
          .map(
            (p) => `
          <a class="project-card" href="#/project/${encodeURIComponent(p.id)}">
            <div class="meta">
              <span class="badge badge-done">${escapeHtml(p.statusLabel)}</span>
              <span class="chevron" aria-hidden="true">›</span>
            </div>
            <h2>${escapeHtml(p.name)}</h2>
            <p class="addr">${escapeHtml(p.addressShort)}</p>
            <p class="date">${escapeHtml(p.code)} · 完工 ${formatDate(p.completedAt)}</p>
          </a>`
          )
          .join("")}
      </div>
    `;
  }

  function renderProjectDetail(projectId) {
    const session = requireAuth();
    if (!session) return;
    if (!session.projectIds.includes(projectId)) {
      mainEl.innerHTML = `<div class="empty"><p>未有權限睇呢個項目。</p><a href="#/projects">返回項目列表</a></div>`;
      setChrome({ title: "項目詳情", showNav: true, showLogout: true });
      return;
    }
    const p = DATA.projects[projectId];
    if (!p) {
      location.hash = "#/projects";
      return;
    }
    setChrome({ title: "項目詳情", showNav: true, showLogout: true });

    mainEl.innerHTML = `
      <button type="button" class="back-link" id="btn-back">‹ 返回項目列表</button>
      <div class="detail-hero card">
        <span class="badge badge-done">${escapeHtml(p.statusLabel)}</span>
        <h1>${escapeHtml(p.name)}</h1>
        <dl class="info-grid">
          <div class="info-row"><dt>項目編號</dt><dd>${escapeHtml(p.code)}</dd></div>
          <div class="info-row"><dt>地址</dt><dd>${escapeHtml(p.address)}</dd></div>
          <div class="info-row"><dt>完工／交收</dt><dd>${formatDate(p.completedAt)}</dd></div>
        </dl>
      </div>

      <div class="block-title">
        <span class="dot" aria-hidden="true"></span>
        <h2>有售後／保養嘅範圍</h2>
      </div>
      <p class="field-hint" style="margin:-4px 0 12px">撳範圍名稱可睇詳細說明。</p>
      <div class="scope-list">
        ${p.warrantyScopes
          .map(
            (w) => `
          <button type="button" class="scope-item scope-item-tap" data-scope="${escapeHtml(w.id)}">
            <div class="scope-item-head">
              <h3>${escapeHtml(w.title)}</h3>
              <span class="chevron" aria-hidden="true">›</span>
            </div>
            <p class="period">保養期：${escapeHtml(w.period)}</p>
            <p class="note">${escapeHtml(w.note)}</p>
          </button>`
          )
          .join("")}
      </div>
      <div class="btn-row" style="margin-top:12px">
        <a class="btn btn-cta" href="#/contact?project=${encodeURIComponent(p.id)}">聯絡迪高查售後／報修</a>
      </div>

      <div class="block-title">
        <span class="dot warn" aria-hidden="true"></span>
        <h2>非迪高保養範圍</h2>
      </div>
      <p class="field-hint" style="margin:-4px 0 12px">以下項目請直接聯絡供應商；迪高可協助提供資料，但唔屬於迪高保養。</p>
      <div class="supplier-list">
        ${p.nonWarranty
          .map(
            (s) => `
          <button type="button" class="supplier-card" data-supplier="${escapeHtml(s.id)}">
            <h3>${escapeHtml(s.category)}</h3>
            <p class="brand-line">${escapeHtml(s.brand)}${s.model ? " · " + escapeHtml(s.model) : ""}</p>
            <span class="label-non">非迪高保養範圍</span>
          </button>`
          )
          .join("")}
      </div>
    `;

    $("#btn-back").addEventListener("click", () => {
      location.hash = "#/projects";
    });
    mainEl.querySelectorAll("[data-scope]").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = `#/warranty/${encodeURIComponent(p.id)}/${encodeURIComponent(btn.dataset.scope)}`;
      });
    });
    mainEl.querySelectorAll("[data-supplier]").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = `#/supplier/${encodeURIComponent(p.id)}/${encodeURIComponent(btn.dataset.supplier)}`;
      });
    });
  }

  function renderWarrantyDetail(projectId, scopeId) {
    const session = requireAuth();
    if (!session) return;
    if (!session.projectIds.includes(projectId)) {
      location.hash = "#/projects";
      return;
    }
    const p = DATA.projects[projectId];
    const scope = p && p.warrantyScopes.find((x) => x.id === scopeId);
    if (!scope) {
      location.hash = `#/project/${projectId}`;
      return;
    }
    const detail = resolveWarrantyDetail(scope);
    setChrome({ title: "保養說明", showNav: true, showLogout: true });

    const coveredHtml = (detail.covered || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    const exclusionsHtml = (detail.exclusions || [])
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    mainEl.innerHTML = `
      <button type="button" class="back-link" id="btn-back">‹ 返回項目</button>
      <div class="card warranty-detail-card">
        <span class="badge badge-done">迪高保養範圍</span>
        <h1 class="serif" style="font-size:1.3rem;margin:12px 0 6px">${escapeHtml(scope.title)}</h1>
        <p class="period" style="margin:0 0 12px">保養期：${escapeHtml(scope.period)}</p>
        <p class="warranty-summary">${escapeHtml(detail.summary)}</p>
      </div>

      <div class="block-title">
        <span class="dot" aria-hidden="true"></span>
        <h2>一般涵蓋</h2>
      </div>
      <div class="card">
        <ul class="detail-list">${coveredHtml}</ul>
      </div>

      <div class="block-title">
        <span class="dot warn" aria-hidden="true"></span>
        <h2>常見不包括</h2>
      </div>
      <div class="card">
        <ul class="detail-list">${exclusionsHtml}</ul>
      </div>

      <div class="block-title">
        <span class="dot" aria-hidden="true"></span>
        <h2>如何報修</h2>
      </div>
      <div class="card">
        <p class="note" style="margin:0">${escapeHtml(detail.howToReport)}</p>
      </div>

      <div class="placeholder-note" style="margin-top:14px">
        ${escapeHtml(detail.contractNote)}
      </div>

      <div class="btn-row" style="margin-top:16px">
        <a class="btn btn-cta" href="#/contact?project=${encodeURIComponent(p.id)}">聯絡迪高查售後／報修</a>
      </div>
    `;

    $("#btn-back").addEventListener("click", () => {
      location.hash = `#/project/${encodeURIComponent(projectId)}`;
    });
  }

  function renderSupplier(projectId, supplierId) {
    const session = requireAuth();
    if (!session) return;
    if (!session.projectIds.includes(projectId)) {
      location.hash = "#/projects";
      return;
    }
    const p = DATA.projects[projectId];
    const s = p && p.nonWarranty.find((x) => x.id === supplierId);
    if (!s) {
      location.hash = `#/project/${projectId}`;
      return;
    }
    setChrome({ title: "供應商聯絡", showNav: true, showLogout: true });

    const phoneHtml = s.phone
      ? s.phone.replace(/\D/g, "").length >= 8
        ? `<a href="tel:${escapeHtml(s.phone.replace(/\s/g, ""))}">📞 ${escapeHtml(s.phone)}</a>`
        : `<span>📞 ${escapeHtml(s.phone)}</span>`
      : "";
    const emailHtml = s.email
      ? `<a href="mailto:${escapeHtml(s.email)}">✉️ ${escapeHtml(s.email)}</a>`
      : "";
    const urlHtml = s.url
      ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">🔗 供應商網站</a>`
      : "";

    mainEl.innerHTML = `
      <button type="button" class="back-link" id="btn-back">‹ 返回項目</button>
      <div class="card">
        <span class="label-non">非迪高保養範圍</span>
        <h1 class="serif" style="font-size:1.25rem;margin:12px 0 4px">${escapeHtml(s.category)}</h1>
        <p style="margin:0 0 8px;color:var(--muted)">${escapeHtml(s.brand)}${s.model ? " · " + escapeHtml(s.model) : ""}</p>
        <p class="note">${escapeHtml(s.note || "")}</p>
        <div class="contact-lines">
          ${phoneHtml}${emailHtml}${urlHtml}
        </div>
      </div>
      <p class="field-hint" style="margin-top:14px">保養同維修請直接聯絡供應商。如需要迪高協助查閱完工資料，可返回項目頁「聯絡迪高」。</p>
    `;
    $("#btn-back").addEventListener("click", () => {
      location.hash = `#/project/${encodeURIComponent(projectId)}`;
    });
  }

  const REPORTS_KEY = "ecdeco_cs_problem_reports";
  const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
  const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

  /** In-memory file picks for current contact form (not persisted as blobs). */
  let reportFiles = [];

  function getReportConfig() {
    const cfg = window.ECDECO_REPORT_CONFIG || {};
    return {
      REPORT_API_URL: (cfg.REPORT_API_URL || "").trim(),
      NOTIFY_EMAIL:
        (cfg.NOTIFY_EMAIL || "").trim() ||
        (DATA.contact && DATA.contact.email) ||
        "info@ecdeco.com.hk",
      OPEN_WHATSAPP: cfg.OPEN_WHATSAPP === true,
      WHATSAPP:
        (cfg.WHATSAPP || "").trim() ||
        (DATA.contact && DATA.contact.whatsapp) ||
        "85268262764",
      GITHUB_OWNER: cfg.GITHUB_OWNER || "lm1668-cpu",
      GITHUB_REPO: cfg.GITHUB_REPO || "cs-ecdeco",
    };
  }

  function buildWhatsAppUrl(text, whatsappNum) {
    const num =
      whatsappNum ||
      (DATA.contact && DATA.contact.whatsapp) ||
      "85268262764";
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  }

  function buildMailtoUrl(to, subject, body) {
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function formatReportDateTime(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function loadReports() {
    try {
      const raw = localStorage.getItem(REPORTS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveReportMeta(report) {
    const list = loadReports();
    list.unshift(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 100)));
  }

  function countMedia(files) {
    let photos = 0;
    let videos = 0;
    files.forEach((f) => {
      if (f.type.startsWith("video/")) videos += 1;
      else if (f.type.startsWith("image/")) photos += 1;
    });
    return { photos, videos };
  }

  function buildReportMessage({
    name,
    phone,
    projectName,
    when,
    problem,
    photos,
    videos,
    shareNote,
    issueUrl,
  }) {
    const attachParts = [];
    if (photos) attachParts.push(`相片 ${photos}張`);
    if (videos) attachParts.push(`短片 ${videos}段`);
    const attachLine = attachParts.length
      ? `附件：${attachParts.join("／")}（${shareNote}）`
      : "附件：無";
    const lines = [
      "【迪高售後報修】",
      `客人：${name || "—"}`,
      `電話：${phone || "—"}`,
      `項目：${projectName || "—"}`,
      `時間：${when}`,
      `問題：${problem}`,
      attachLine,
    ];
    if (issueUrl) {
      lines.push(`GitHub Issue：${issueUrl}`);
    }
    return lines.join("\n");
  }

  async function createReportIssue(apiUrl, payload) {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok || !data || !data.ok || !data.issue_url) {
      const msg =
        (data && data.error) || `報修 API 失敗（HTTP ${res.status}）`;
      const err = new Error(msg);
      err.api = data;
      throw err;
    }
    return data;
  }

  function downloadTextSummary(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function tryShareReport(files, text) {
    if (!navigator.share) return { shared: false, reason: "unsupported" };
    try {
      const payload = { title: "迪高售後報修", text };
      if (files.length && navigator.canShare) {
        const withFiles = { ...payload, files };
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          return { shared: true, withFiles: true };
        }
      }
      await navigator.share(payload);
      return { shared: true, withFiles: false };
    } catch (err) {
      if (err && err.name === "AbortError") {
        return { shared: false, reason: "abort" };
      }
      return { shared: false, reason: "error" };
    }
  }

  function revokePreviewUrls() {
    reportFiles.forEach((entry) => {
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
    });
  }

  function renderMediaPreviews(container) {
    if (!container) return;
    if (!reportFiles.length) {
      container.innerHTML = "";
      container.classList.add("hidden");
      return;
    }
    container.classList.remove("hidden");
    container.innerHTML = reportFiles
      .map((entry, idx) => {
        const isVideo = entry.file.type.startsWith("video/");
        const sizeMb = (entry.file.size / (1024 * 1024)).toFixed(1);
        const media = isVideo
          ? `<video src="${entry.previewUrl}" muted playsinline controls></video>`
          : `<img src="${entry.previewUrl}" alt="">`;
        return `
          <div class="media-preview-item" data-idx="${idx}">
            ${media}
            <div class="media-preview-meta">
              <span>${escapeHtml(entry.file.name)}</span>
              <span>${sizeMb} MB · ${isVideo ? "短片" : "相片"}</span>
            </div>
            <button type="button" class="media-preview-remove" data-remove="${idx}" aria-label="移除">×</button>
          </div>`;
      })
      .join("");
    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.remove);
        const removed = reportFiles.splice(i, 1)[0];
        if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        renderMediaPreviews(container);
      });
    });
  }

  function renderContact(query) {
    const session = requireAuth();
    if (!session) return;
    setChrome({ title: "聯絡迪高", showNav: true, showLogout: true });

    revokePreviewUrls();
    reportFiles = [];

    let projectName = "我的項目";
    let projectId = query.project || "";
    if (
      projectId &&
      session.projectIds.includes(projectId) &&
      DATA.projects[projectId]
    ) {
      projectName = DATA.projects[projectId].name;
    } else if (session.projectIds.length === 1) {
      projectId = session.projectIds[0];
      projectName = DATA.projects[projectId].name;
    }

    const projectOptions = session.projectIds
      .map((id) => DATA.projects[id])
      .filter(Boolean)
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}" ${p.id === projectId ? "selected" : ""}>${escapeHtml(p.name)}</option>`
      )
      .join("");

    const c = DATA.contact;
    const quickWaText = `${projectName || "我的項目"} —— 我想查售後／報修`;
    const waUrl = buildWhatsAppUrl(quickWaText);
    const telHref = `tel:${c.phoneTel}`;
    const mailSubject = encodeURIComponent(
      `${projectName} —— 我想查售後／報修`
    );
    const mailBody = encodeURIComponent(
      `你好，我想查售後／報修。\n\n項目：${projectName}\n聯絡人：${session.name}\n電話：+852 ${session.phone}\n\n（請補充問題描述）`
    );
    const mailHref = `mailto:${c.email}?subject=${mailSubject}&body=${mailBody}`;

    mainEl.innerHTML = `
      <div class="section-head">
        <p class="kicker">售後服務</p>
        <h1>聯絡迪高</h1>
        <p>填寫問題描述、可選上傳相片／短片。提交後會嘗試建立 GitHub Issue，並開啟電郵預填報修摘要（預設 info@ecdeco.com.hk）。</p>
      </div>

      <div class="card report-card">
        <h2 class="card-title">報修／問題回報</h2>
        <form id="problem-report-form" novalidate>
          <label class="field-label" for="contact-project">相關項目</label>
          <select id="contact-project" class="field-select" name="projectId">
            ${projectOptions || '<option value="">我的項目</option>'}
          </select>

          <label class="field-label" for="report-problem">問題描述 <span class="req">*</span></label>
          <textarea id="report-problem" name="problem" class="field-textarea" rows="5" required placeholder="請描述問題位置、現象、發現時間等"></textarea>
          <p class="error-msg" id="report-error" role="alert"></p>

          <label class="field-label" for="report-files">相片／短片（可選）</label>
          <input id="report-files" type="file" accept="image/*,video/*" multiple class="field-file">
          <p class="field-hint">相片建議每張 &lt;10MB；短片建議每段 &lt;50MB。媒體唔會上載到 GitHub；提交後請用電郵附件補傳，或稍後另行傳送。系統分享（如有）可作後備。</p>
          <div id="report-previews" class="media-previews hidden" aria-live="polite"></div>

          <div class="btn-row">
            <button type="submit" class="btn btn-cta" id="btn-submit-report">提交報修</button>
          </div>
        </form>
        <div id="report-result" class="report-result hidden" role="status"></div>
      </div>

      <div class="card">
        <h2 class="card-title">其他聯絡方式</h2>
        <p class="field-hint" style="margin-top:0">快速開啟 WhatsApp／電話／電郵（預填項目名稱）。</p>
        <div class="btn-row">
          <a class="btn btn-wa" id="btn-wa" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp 聯絡</a>
          <a class="btn btn-tel" href="${escapeHtml(telHref)}">致電 ${escapeHtml(c.phone)}</a>
          <a class="btn btn-mail" href="${escapeHtml(mailHref)}">電郵 ${escapeHtml(c.email)}</a>
        </div>
      </div>
    `;

    const select = $("#contact-project");
    const btnWa = $("#btn-wa");
    const fileInput = $("#report-files");
    const previewsEl = $("#report-previews");
    const form = $("#problem-report-form");
    const errorEl = $("#report-error");
    const resultEl = $("#report-result");

    function currentProjectName() {
      const id = select.value;
      return (DATA.projects[id] && DATA.projects[id].name) || "我的項目";
    }

    function refreshQuickLinks() {
      const name = currentProjectName();
      btnWa.href = buildWhatsAppUrl(`${name} —— 我想查售後／報修`);
    }
    select.addEventListener("change", refreshQuickLinks);

    fileInput.addEventListener("change", () => {
      errorEl.textContent = "";
      const picked = Array.from(fileInput.files || []);
      fileInput.value = "";
      picked.forEach((file) => {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) return;
        const max = isVideo ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES;
        if (file.size > max) {
          errorEl.textContent = isVideo
            ? `「${file.name}」超過 50MB，請壓縮後再試。`
            : `「${file.name}」超過 10MB，請壓縮後再試。`;
          return;
        }
        reportFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      });
      renderMediaPreviews(previewsEl);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.textContent = "";
      const problem = ($("#report-problem").value || "").trim();
      if (!problem) {
        errorEl.textContent = "請填寫問題描述。";
        $("#report-problem").focus();
        return;
      }

      const reportCfg = getReportConfig();
      const now = new Date();
      const when = formatReportDateTime(now);
      const projId = select.value || "";
      const projName = currentProjectName();
      const files = reportFiles.map((x) => x.file);
      const { photos, videos } = countMedia(files);
      const phoneDisplay = session.phone ? `+852 ${session.phone}` : "—";
      const fileNames = files.map((f) => f.name);
      const notifyEmail = reportCfg.NOTIFY_EMAIL;

      const submitBtn = $("#btn-submit-report");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "提交中…";
      }

      let issueUrl = "";
      let issueNumber = null;
      let apiError = "";
      let effectiveNotifyEmail = notifyEmail;

      if (reportCfg.REPORT_API_URL) {
        try {
          const apiResult = await createReportIssue(reportCfg.REPORT_API_URL, {
            guest: session.name || "",
            phone: phoneDisplay,
            project: projName,
            projectId: projId,
            time: when,
            problem,
            attachments: fileNames,
            fileNames,
            photoCount: photos,
            videoCount: videos,
            mediaNote:
              "媒體檔案未上載至 GitHub Issue；請經電郵附件補傳，或稍後另行傳送相片／短片。",
          });
          issueUrl = apiResult.issue_url || "";
          issueNumber = apiResult.issue_number || null;
          if (apiResult.notify_email) {
            effectiveNotifyEmail = String(apiResult.notify_email).trim() || effectiveNotifyEmail;
          }
        } catch (err) {
          apiError = (err && err.message) || "無法建立 GitHub Issue";
        }
      }

      const reportMeta = {
        id: `rpt-${Date.now().toString(36)}`,
        createdAt: now.toISOString(),
        whenLabel: when,
        customerName: session.name || "",
        phone: session.phone || "",
        projectId: projId,
        projectName: projName,
        problem,
        photoCount: photos,
        videoCount: videos,
        fileNames,
        issueUrl: issueUrl || "",
        issueNumber,
        apiError: apiError || "",
      };
      saveReportMeta(reportMeta);

      let shareNote = files.length
        ? "請經電郵附件補傳或稍後另行傳送"
        : "無附件";
      const draftMessage = buildReportMessage({
        name: session.name || "—",
        phone: phoneDisplay,
        projectName: projName,
        when,
        problem,
        photos,
        videos,
        shareNote,
        issueUrl: issueUrl || "",
      });

      // Primary notify: email (Kelvin 11/10). Open in same gesture turn.
      const mailSubject = `【迪高售後報修】${projName}${
        issueNumber ? ` #${issueNumber}` : ""
      }`;
      const mailHrefPrimary = buildMailtoUrl(
        effectiveNotifyEmail,
        mailSubject,
        draftMessage
      );
      const mailWin = window.open(mailHrefPrimary, "_blank");

      let waWin = null;
      if (reportCfg.OPEN_WHATSAPP) {
        waWin = window.open(
          buildWhatsAppUrl(draftMessage, reportCfg.WHATSAPP),
          "_blank",
          "noopener,noreferrer"
        );
      }

      const shareResult = await tryShareReport(files, draftMessage);
      if (shareResult.shared && shareResult.withFiles) {
        shareNote = "已用系統分享送出（含附件）";
      } else if (shareResult.shared) {
        shareNote = "已用系統分享送出文字；請經電郵補傳附件";
      }

      const finalMessage = buildReportMessage({
        name: session.name || "—",
        phone: phoneDisplay,
        projectName: projName,
        when,
        problem,
        photos,
        videos,
        shareNote,
        issueUrl: issueUrl || "",
      });

      try {
        const list = loadReports();
        if (list[0] && list[0].id === reportMeta.id) {
          list[0].shareNote = shareNote;
          list[0].message = finalMessage;
          list[0].issueUrl = issueUrl || "";
          list[0].issueNumber = issueNumber;
          localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
        }
      } catch {
        /* ignore */
      }

      const mailHref = buildMailtoUrl(effectiveNotifyEmail, mailSubject, finalMessage);
      const waHref = buildWhatsAppUrl(finalMessage, reportCfg.WHATSAPP);
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

      const issueLine = issueUrl
        ? `已建立 GitHub Issue：<a href="${escapeHtml(issueUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(issueUrl)}</a>。`
        : reportCfg.REPORT_API_URL
          ? `未能建立 GitHub Issue${apiError ? `（${escapeHtml(apiError)}）` : ""}；仍已儲存本機記錄並預填電郵。`
          : "未設定報修 API（REPORT_API_URL 空白），未建立 GitHub Issue；已儲存本機記錄。";

      const mailPopupHint = mailWin
        ? ""
        : "（如未自動開啟郵件程式，請撳下面「開啟電郵通知」。）";
      const attachHint = files.length
        ? "請喺電郵加上所選相片／短片作附件（或稍後另行傳送）。"
        : "";
      const waExtra = reportCfg.OPEN_WHATSAPP
        ? waWin
          ? " 已額外開啟 WhatsApp 預填訊息。"
          : " （WhatsApp 未自動開啟，可撳下面按鈕。）"
        : "";

      const waBtnHtml = reportCfg.OPEN_WHATSAPP
        ? `<a class="btn btn-wa" href="${escapeHtml(waHref)}" target="_blank" rel="noopener noreferrer" id="btn-wa-report">開啟 WhatsApp</a>`
        : "";

      resultEl.classList.remove("hidden");
      resultEl.innerHTML = `
        <p class="report-result-title">報修已提交</p>
        <p>${issueLine}</p>
        <p>已盡量開啟電郵至 <strong>${escapeHtml(effectiveNotifyEmail)}</strong>（預填摘要）${mailPopupHint}${attachHint}${waExtra}</p>
        <div class="btn-row">
          <a class="btn btn-mail" href="${escapeHtml(mailHref)}" id="btn-mail-report">開啟電郵通知</a>
          ${waBtnHtml}
          <button type="button" class="btn btn-outline" id="btn-dl-summary">下載文字摘要</button>
          ${
            issueUrl
              ? `<a class="btn btn-outline" href="${escapeHtml(issueUrl)}" target="_blank" rel="noopener noreferrer">查看 Issue</a>`
              : ""
          }
        </div>
      `;
      $("#btn-dl-summary", resultEl).addEventListener("click", () => {
        downloadTextSummary(`迪高售後報修-${stamp}.txt`, finalMessage);
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "提交報修";
      }

      form.reset();
      revokePreviewUrls();
      reportFiles = [];
      renderMediaPreviews(previewsEl);
      if (projId) select.value = projId;
      refreshQuickLinks();
    });
  }

  function renderAbout() {
    const session = getSession();
    setChrome({
      title: "關於迪高",
      showNav: !!session,
      showLogout: !!session,
      authOnly: false,
    });
    if (!session) {
      location.hash = "#/login";
      return;
    }
    const a = DATA.about;
    const paras = (a.paragraphs || [a.oneLiner])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
    mainEl.innerHTML = `
      <div class="card about-card">
        <img class="logo-about" src="assets/logo.png" alt="迪高室內設計" width="240" height="240">
        <div class="gold-line"></div>
        <h2 class="about-headline serif">${escapeHtml(a.headline || "關於迪高")}</h2>
        <div class="about-body">
          ${paras}
          ${a.invite ? `<p>${escapeHtml(a.invite)}</p>` : ""}
        </div>
        <a class="btn btn-outline" href="${escapeHtml(a.website)}" target="_blank" rel="noopener noreferrer">前往官網 ecdeco.com.hk</a>
      </div>
    `;
  }

  /* ---------- Router ---------- */

  function route() {
    DATA = loadData();
    const { parts, query } = parseHash();
    const page = parts[0] || "login";

    switch (page) {
      case "login":
        if (getSession()) {
          location.hash = "#/projects";
          return;
        }
        renderLogin();
        break;
      case "projects":
        renderProjects();
        break;
      case "project":
        renderProjectDetail(parts[1]);
        break;
      case "warranty":
        renderWarrantyDetail(parts[1], parts[2]);
        break;
      case "supplier":
        renderSupplier(parts[1], parts[2]);
        break;
      case "contact":
        renderContact(query);
        break;
      case "about":
        renderAbout();
        break;
      default:
        location.hash = getSession() ? "#/projects" : "#/login";
    }
    window.scrollTo(0, 0);
  }

  $("#btn-logout").addEventListener("click", () => {
    clearSession();
    location.hash = "#/login";
  });

  window.addEventListener("hashchange", route);
  if (!location.hash) location.hash = "#/login";
  else route();
})();
