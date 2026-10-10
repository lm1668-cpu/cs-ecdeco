/**
 * 迪高售後服務 — SPA 路由與畫面
 * Hash routes:
 *   #/login
 *   #/projects
 *   #/project/:id
 *   #/supplier/:projectId/:supplierId
 *   #/contact?project=:id
 *   #/about
 */
(function () {
  const DATA = window.ECDECO_DATA;
  const SESSION_KEY = "ecdeco_cs_session";

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

  function iconSvg(name) {
    const icons = {
      projects:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16"/></svg>',
      contact:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L7.1 9.4a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2z"/></svg>',
      about:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>',
    };
    return icons[name] || "";
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
      const active = title === "關於迪高" ? "about" : title === "聯絡迪高" ? "contact" : "projects";
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
        <img class="welcome-logo" src="assets/logo.png" alt="迪高室內設計" width="148" height="148">
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
        $("#login-error").textContent = "呢個號碼未有登記項目。如有疑問請聯絡迪高。";
        return;
      }
      renderOtpStep(customer);
    });
  }

  function renderOtpStep(customer) {
    setChrome({ authOnly: true, showNav: false });
    mainEl.innerHTML = `
      <div class="welcome">
        <img class="welcome-logo" src="assets/logo.png" alt="迪高室內設計" width="148" height="148">
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
      <div class="scope-list">
        ${p.warrantyScopes
          .map(
            (w) => `
          <article class="scope-item">
            <h3>${escapeHtml(w.title)}</h3>
            <p class="period">保養期：${escapeHtml(w.period)}</p>
            <p class="note">${escapeHtml(w.note)}</p>
          </article>`
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
    mainEl.querySelectorAll("[data-supplier]").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = `#/supplier/${encodeURIComponent(p.id)}/${encodeURIComponent(btn.dataset.supplier)}`;
      });
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

  function buildWhatsAppUrl(projectName) {
    // PLACEHOLDER: Kelvin 必須把 DATA.contact.whatsapp 換成真實迪高號碼（唔好用大本營 6179 1102）
    const num = DATA.contact.whatsapp;
    const text = `${projectName || "我的項目"} —— 我想查售後／報修`;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  }

  function renderContact(query) {
    const session = requireAuth();
    if (!session) return;
    setChrome({ title: "聯絡迪高", showNav: true, showLogout: true });

    let projectName = "我的項目";
    let projectId = query.project || "";
    if (projectId && session.projectIds.includes(projectId) && DATA.projects[projectId]) {
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
    const waUrl = buildWhatsAppUrl(projectName);
    const telHref = `tel:${c.phoneTel}`;
    const mailSubject = encodeURIComponent(`${projectName} —— 我想查售後／報修`);
    const mailBody = encodeURIComponent(
      `你好，我想查售後／報修。\n\n項目：${projectName}\n聯絡人：${session.name}\n電話：+852 ${session.phone}\n\n（請補充問題描述）`
    );
    const mailHref = `mailto:${c.email}?subject=${mailSubject}&body=${mailBody}`;

    mainEl.innerHTML = `
      <div class="section-head">
        <p class="kicker">售後服務</p>
        <h1>聯絡迪高</h1>
        <p>一鍵 WhatsApp／電話／電郵；預填項目名稱同「我想查售後／報修」。</p>
      </div>
      <div class="card">
        <label class="field-label" for="contact-project">相關項目</label>
        <select id="contact-project" style="width:100%;padding:12px;border-radius:12px;border:1px solid var(--border);background:var(--bg);margin-bottom:8px">
          ${projectOptions || "<option>我的項目</option>"}
        </select>
        <p class="field-hint">訊息會預填：「項目名稱 —— 我想查售後／報修」</p>
        <div class="btn-row">
          <a class="btn btn-wa" id="btn-wa" href="${escapeHtml(waUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp 聯絡</a>
          <a class="btn btn-tel" href="${escapeHtml(telHref)}">致電 ${escapeHtml(c.phone)}</a>
          <a class="btn btn-mail" href="${escapeHtml(mailHref)}">電郵 ${escapeHtml(c.email)}</a>
        </div>
      </div>
      <div class="placeholder-note">
        <strong>Kelvin 請注意：</strong> WhatsApp／電話現為 placeholder（852XXXXXXXX）。
        上線前必須填入真實<strong>迪高</strong>對外聯絡號碼。
        <em>切勿使用大本營 6179 1102。</em>
        請改 <code>js/data.js</code> 內 <code>contact</code> 欄位。
      </div>
    `;

    const select = $("#contact-project");
    const btnWa = $("#btn-wa");
    function refreshWa() {
      const id = select.value;
      const name = (DATA.projects[id] && DATA.projects[id].name) || "我的項目";
      btnWa.href = buildWhatsAppUrl(name);
    }
    select.addEventListener("change", refreshWa);
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
      // allow about only when logged in for MVP consistency; redirect
      location.hash = "#/login";
      return;
    }
    const a = DATA.about;
    mainEl.innerHTML = `
      <div class="card about-card">
        <img class="logo" src="assets/logo.png" alt="迪高室內設計" width="120" height="120">
        <div class="gold-line"></div>
        <p>${escapeHtml(a.oneLiner)}</p>
        <a class="btn btn-outline" href="${escapeHtml(a.website)}" target="_blank" rel="noopener noreferrer">前往官網 ecdeco.com.hk</a>
      </div>
    `;
  }

  /* ---------- Router ---------- */

  function route() {
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
