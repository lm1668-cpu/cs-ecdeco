/**
 * 迪高售後 — 本機 Admin Demo
 * PIN: 246810（見 README）
 * 資料寫入 localStorage key: ecdeco_cs_data_override
 * 客人端 app.js 會優先讀取此覆寫。
 */
(function () {
  const PIN = "246810";
  const AUTH_KEY = "ecdeco_cs_admin_auth";
  const OVERRIDE_KEY = "ecdeco_cs_data_override";
  const DETAIL_KEYS = [
    { value: "masonry", label: "泥水" },
    { value: "painting", label: "油漆" },
    { value: "carpentry", label: "木工／訂造傢俬" },
    { value: "mep", label: "水電" },
    { value: "electrical", label: "電氣" },
    { value: "other", label: "其他" },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const mainEl = $("#admin-main");
  const headerActions = $("#admin-header-actions");

  let store = null;
  let view = { tab: "projects", editingId: null };

  function toast(msg) {
    let el = $("#admin-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "admin-toast";
      el.className = "admin-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function cloneBase() {
    return JSON.parse(JSON.stringify(window.ECDECO_DATA));
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const base = cloneBase();
        store = {
          ...base,
          ...parsed,
          contact: { ...base.contact, ...(parsed.contact || {}) },
          about: { ...base.about, ...(parsed.about || {}) },
          customers: parsed.customers || base.customers,
          projects: parsed.projects || base.projects,
          warrantyDetails: {
            ...(base.warrantyDetails || {}),
            ...(parsed.warrantyDetails || {}),
          },
          supplierCatalog: parsed.supplierCatalog || base.supplierCatalog || [],
        };
        return;
      }
    } catch {
      /* fall through */
    }
    store = cloneBase();
    if (!store.supplierCatalog) store.supplierCatalog = [];
  }

  function saveStore() {
    const payload = {
      contact: store.contact,
      about: store.about,
      customers: store.customers,
      projects: store.projects,
      warrantyDetails: store.warrantyDetails,
      supplierCatalog: store.supplierCatalog,
      demoOtp: store.demoOtp,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(payload));
    toast("已儲存至本機 localStorage");
  }

  function isAuthed() {
    return sessionStorage.getItem(AUTH_KEY) === "1";
  }

  function setAuthed(on) {
    if (on) sessionStorage.setItem(AUTH_KEY, "1");
    else sessionStorage.removeItem(AUTH_KEY);
  }

  function phoneForProject(projectId) {
    const phones = [];
    Object.values(store.customers || {}).forEach((c) => {
      if ((c.projectIds || []).includes(projectId)) phones.push(c.phone);
    });
    return phones;
  }

  function linkCustomerPhone(projectId, phone8) {
    const phone = String(phone8 || "").replace(/\D/g, "").slice(0, 8);
    if (!/^\d{8}$/.test(phone)) return;
    Object.values(store.customers).forEach((c) => {
      c.projectIds = (c.projectIds || []).filter((id) => id !== projectId);
    });
    if (!store.customers[phone]) {
      store.customers[phone] = {
        id: uid("cust"),
        name: `客人 ${phone.slice(-4)}`,
        phone,
        projectIds: [projectId],
      };
    } else if (!store.customers[phone].projectIds.includes(projectId)) {
      store.customers[phone].projectIds.push(projectId);
    }
  }

  /* ---------- Login ---------- */

  function renderLogin() {
    headerActions.classList.add("hidden");
    mainEl.innerHTML = `
      <div class="admin-login">
        <img src="assets/logo.png" alt="" width="96" height="96" style="margin:0 auto 16px">
        <h1 class="serif" style="font-size:1.3rem;margin:0 0 8px">管理入口</h1>
        <p class="admin-hint">本機 Demo PIN（見 README）。唔會上傳到伺服器。</p>
        <div class="card">
          <label class="field-label" for="pin">PIN</label>
          <input class="pin-input" id="pin" type="password" inputmode="numeric" maxlength="8" placeholder="••••••" autocomplete="off">
          <p class="error-msg" id="pin-error" role="alert"></p>
          <div class="btn-row">
            <button type="button" class="btn btn-cta" id="btn-pin">進入</button>
          </div>
        </div>
      </div>
    `;
    const pinInput = $("#pin");
    pinInput.focus();
    const go = () => {
      if (pinInput.value.trim() !== PIN) {
        $("#pin-error").textContent = "PIN 不正確。";
        return;
      }
      setAuthed(true);
      renderApp();
    };
    $("#btn-pin").addEventListener("click", go);
    pinInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") go();
    });
  }

  /* ---------- Shell ---------- */

  function renderApp() {
    headerActions.classList.remove("hidden");
    if (view.editingId) {
      renderProjectEditor(view.editingId);
      return;
    }
    mainEl.innerHTML = `
      <div class="admin-tabs" role="tablist">
        <button type="button" class="admin-tab ${view.tab === "projects" ? "active" : ""}" data-tab="projects">項目</button>
        <button type="button" class="admin-tab ${view.tab === "suppliers" ? "active" : ""}" data-tab="suppliers">供應商清單</button>
        <button type="button" class="admin-tab ${view.tab === "customers" ? "active" : ""}" data-tab="customers">客人手機</button>
        <button type="button" class="admin-tab ${view.tab === "data" ? "active" : ""}" data-tab="data">匯出／匯入</button>
      </div>
      <div id="admin-panel"></div>
    `;
    mainEl.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        view.tab = btn.dataset.tab;
        renderApp();
      });
    });
    const panel = $("#admin-panel");
    if (view.tab === "projects") renderProjectsPanel(panel);
    else if (view.tab === "suppliers") renderSuppliersPanel(panel);
    else if (view.tab === "customers") renderCustomersPanel(panel);
    else renderDataPanel(panel);
  }

  function renderProjectsPanel(panel) {
    const projects = Object.values(store.projects || {});
    panel.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn btn-cta" id="btn-new-project">＋ 新增項目</button>
        <button type="button" class="btn btn-outline" id="btn-save-all">儲存到 localStorage</button>
      </div>
      <p class="admin-hint">編輯後請按「儲存」。客人端重新整理後會讀取覆寫資料（同一瀏覽器）。</p>
      <div class="admin-grid" id="project-list"></div>
    `;
    const list = $("#project-list", panel);
    if (!projects.length) {
      list.innerHTML = `<div class="empty"><p>未有項目。</p></div>`;
    } else {
      list.innerHTML = projects
        .map((p) => {
          const phones = phoneForProject(p.id).join("、") || "—";
          const wCount = (p.warrantyScopes || []).length;
          const nwCount = (p.nonWarranty || []).length;
          return `
          <article class="admin-card">
            <h3>${escapeHtml(p.name)} <span class="tag-warranty">${wCount} 保養</span> <span class="tag-non">${nwCount} 非保養</span></h3>
            <p class="admin-meta">${escapeHtml(p.code)} · ${escapeHtml(p.address || p.addressShort || "")}<br>
            完工：${escapeHtml(p.completedAt || "—")} · 客人手機：${escapeHtml(phones)}</p>
            <div class="admin-actions">
              <button type="button" class="btn-sm" data-edit="${escapeHtml(p.id)}">編輯</button>
              <button type="button" class="btn-danger" data-del="${escapeHtml(p.id)}">刪除</button>
            </div>
          </article>`;
        })
        .join("");
    }
    $("#btn-new-project", panel).addEventListener("click", () => {
      const id = uid("proj");
      store.projects[id] = {
        id,
        code: "EC Job ",
        name: "新項目",
        addressShort: "",
        address: "",
        completedAt: new Date().toISOString().slice(0, 10),
        status: "completed",
        statusLabel: "已完工",
        warrantyScopes: [],
        nonWarranty: [],
      };
      view.editingId = id;
      renderApp();
    });
    $("#btn-save-all", panel).addEventListener("click", saveStore);
    list.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        view.editingId = btn.dataset.edit;
        renderApp();
      });
    });
    list.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.del;
        if (!confirm("確定刪除此項目？")) return;
        delete store.projects[id];
        Object.values(store.customers).forEach((c) => {
          c.projectIds = (c.projectIds || []).filter((x) => x !== id);
        });
        saveStore();
        renderApp();
      });
    });
  }

  function renderProjectEditor(projectId) {
    const p = store.projects[projectId];
    if (!p) {
      view.editingId = null;
      renderApp();
      return;
    }
    if (!p.warrantyScopes) p.warrantyScopes = [];
    if (!p.nonWarranty) p.nonWarranty = [];
    const phones = phoneForProject(projectId);
    const detailOptions = DETAIL_KEYS.map(
      (d) => `<option value="${d.value}">${escapeHtml(d.label)}</option>`
    ).join("");

    headerActions.classList.remove("hidden");
    mainEl.innerHTML = `
      <button type="button" class="back-link" id="btn-back-list">‹ 返回項目列表</button>
      <h2 class="admin-section-title">編輯項目</h2>
      <form class="admin-form card" id="project-form">
        <div class="row-2">
          <div>
            <label for="f-code">EC Job #</label>
            <input id="f-code" value="${escapeHtml(p.code)}" required>
          </div>
          <div>
            <label for="f-completed">完工／交收日期</label>
            <input id="f-completed" type="date" value="${escapeHtml(p.completedAt || "")}">
          </div>
        </div>
        <label for="f-name">項目名稱</label>
        <input id="f-name" value="${escapeHtml(p.name)}" required>
        <label for="f-address">地址</label>
        <input id="f-address" value="${escapeHtml(p.address || "")}">
        <label for="f-address-short">列表短地址</label>
        <input id="f-address-short" value="${escapeHtml(p.addressShort || "")}">
        <label for="f-phone">客人手機（8 位，用作登入連結）</label>
        <input id="f-phone" inputmode="numeric" maxlength="8" value="${escapeHtml(phones[0] || "")}" placeholder="例如 91234567">
        <p class="admin-hint">儲存時會將此項目連結到該手機嘅客人戶口（示範用）。</p>

        <h3 style="margin:20px 0 8px;font-size:1rem">保養範圍 <span class="tag-warranty">warranty</span></h3>
        <div id="warranty-list"></div>
        <button type="button" class="btn-sm" id="btn-add-w" style="margin-top:8px">＋ 加保養項目</button>

        <h3 style="margin:20px 0 8px;font-size:1rem">非保養／供應商 <span class="tag-non">non-warranty</span></h3>
        <div id="nonwarranty-list"></div>
        <div class="admin-actions" style="margin-top:8px">
          <button type="button" class="btn-sm" id="btn-add-nw">＋ 加非保養項目</button>
          <select id="pick-supplier" style="width:auto;min-width:180px">
            <option value="">— 由供應商清單加入 —</option>
            ${(store.supplierCatalog || [])
              .map(
                (s) =>
                  `<option value="${escapeHtml(s.id)}">${escapeHtml(s.category)} · ${escapeHtml(s.brand)}</option>`
              )
              .join("")}
          </select>
          <button type="button" class="btn-sm" id="btn-pick-supplier">加入</button>
        </div>

        <div class="btn-row" style="margin-top:20px">
          <button type="submit" class="btn btn-cta">儲存項目</button>
        </div>
      </form>
    `;

    function paintWarranty() {
      const box = $("#warranty-list");
      box.innerHTML = p.warrantyScopes
        .map((w, i) => {
          const opts = DETAIL_KEYS.map(
            (d) =>
              `<option value="${d.value}" ${w.detailKey === d.value ? "selected" : ""}>${escapeHtml(d.label)}</option>`
          ).join("");
          return `
          <div class="item-block" data-wi="${i}">
            <h4>保養 #${i + 1}</h4>
            <label>名稱</label>
            <input data-f="title" value="${escapeHtml(w.title || "")}">
            <label>說明類型</label>
            <select data-f="detailKey">${opts}</select>
            <label>保養期文字</label>
            <input data-f="period" value="${escapeHtml(w.period || "")}">
            <label>短註</label>
            <input data-f="note" value="${escapeHtml(w.note || "")}">
            <div class="admin-actions" style="margin-top:8px">
              <button type="button" class="btn-danger" data-rm-w="${i}">移除</button>
            </div>
          </div>`;
        })
        .join("") || `<p class="admin-hint">未有保養項目。</p>`;
      box.querySelectorAll("[data-rm-w]").forEach((btn) => {
        btn.addEventListener("click", () => {
          p.warrantyScopes.splice(Number(btn.dataset.rmW), 1);
          paintWarranty();
        });
      });
    }

    function paintNonWarranty() {
      const box = $("#nonwarranty-list");
      box.innerHTML = p.nonWarranty
        .map(
          (s, i) => `
          <div class="item-block" data-nwi="${i}">
            <h4>非保養 #${i + 1}</h4>
            <div class="row-2">
              <div><label>類別</label><input data-f="category" value="${escapeHtml(s.category || "")}"></div>
              <div><label>品牌</label><input data-f="brand" value="${escapeHtml(s.brand || "")}"></div>
            </div>
            <label>型號</label>
            <input data-f="model" value="${escapeHtml(s.model || "")}">
            <div class="row-2">
              <div><label>電話</label><input data-f="phone" value="${escapeHtml(s.phone || "")}"></div>
              <div><label>電郵</label><input data-f="email" value="${escapeHtml(s.email || "")}"></div>
            </div>
            <label>網址</label>
            <input data-f="url" value="${escapeHtml(s.url || "")}">
            <label>備註</label>
            <input data-f="note" value="${escapeHtml(s.note || "")}">
            <div class="admin-actions" style="margin-top:8px">
              <button type="button" class="btn-danger" data-rm-nw="${i}">移除</button>
            </div>
          </div>`
        )
        .join("") || `<p class="admin-hint">未有非保養項目。</p>`;
      box.querySelectorAll("[data-rm-nw]").forEach((btn) => {
        btn.addEventListener("click", () => {
          p.nonWarranty.splice(Number(btn.dataset.rmNw), 1);
          paintNonWarranty();
        });
      });
    }

    paintWarranty();
    paintNonWarranty();

    $("#btn-back-list").addEventListener("click", () => {
      view.editingId = null;
      renderApp();
    });

    $("#btn-add-w").addEventListener("click", () => {
      p.warrantyScopes.push({
        id: uid("w"),
        title: "新保養範圍",
        detailKey: "other",
        period: "",
        note: "保養期內發現問題，可聯絡迪高安排跟進。",
      });
      paintWarranty();
    });

    $("#btn-add-nw").addEventListener("click", () => {
      p.nonWarranty.push({
        id: uid("nw"),
        category: "新項目",
        brand: "",
        model: "",
        phone: "",
        email: "",
        url: "",
        note: "非迪高保養範圍",
      });
      paintNonWarranty();
    });

    $("#btn-pick-supplier").addEventListener("click", () => {
      const sid = $("#pick-supplier").value;
      if (!sid) return;
      const src = (store.supplierCatalog || []).find((x) => x.id === sid);
      if (!src) return;
      p.nonWarranty.push({
        id: uid("nw"),
        category: src.category,
        brand: src.brand,
        model: src.model || "",
        phone: src.phone || "",
        email: src.email || "",
        url: src.url || "",
        note: src.note || "非迪高保養範圍",
      });
      paintNonWarranty();
      toast("已加入供應商");
    });

    $("#project-form").addEventListener("submit", (e) => {
      e.preventDefault();
      p.code = $("#f-code").value.trim();
      p.name = $("#f-name").value.trim();
      p.address = $("#f-address").value.trim();
      p.addressShort = $("#f-address-short").value.trim() || p.address;
      p.completedAt = $("#f-completed").value;
      p.status = "completed";
      p.statusLabel = "已完工";

      mainEl.querySelectorAll("[data-wi]").forEach((block) => {
        const i = Number(block.dataset.wi);
        const w = p.warrantyScopes[i];
        if (!w) return;
        w.title = $('[data-f="title"]', block).value.trim();
        w.detailKey = $('[data-f="detailKey"]', block).value;
        w.period = $('[data-f="period"]', block).value.trim();
        w.note = $('[data-f="note"]', block).value.trim();
      });
      mainEl.querySelectorAll("[data-nwi]").forEach((block) => {
        const i = Number(block.dataset.nwi);
        const s = p.nonWarranty[i];
        if (!s) return;
        ["category", "brand", "model", "phone", "email", "url", "note"].forEach(
          (f) => {
            const el = $(`[data-f="${f}"]`, block);
            if (el) s[f] = el.value.trim();
          }
        );
      });

      linkCustomerPhone(projectId, $("#f-phone").value);
      saveStore();
      view.editingId = null;
      renderApp();
    });
  }

  function renderSuppliersPanel(panel) {
    if (!store.supplierCatalog) store.supplierCatalog = [];
    panel.innerHTML = `
      <div class="admin-toolbar">
        <button type="button" class="btn btn-cta" id="btn-add-sup">＋ 新增供應商</button>
        <button type="button" class="btn btn-outline" id="btn-save-sup">儲存</button>
      </div>
      <p class="admin-hint">此清單方便喺項目編輯時快速加入「非保養」供應商。</p>
      <div id="sup-list"></div>
    `;
    const list = $("#sup-list", panel);

    function paint() {
      list.innerHTML = store.supplierCatalog
        .map(
          (s, i) => `
        <div class="item-block card" style="margin-bottom:10px" data-si="${i}">
          <div class="row-2">
            <div><label>類別</label><input data-f="category" value="${escapeHtml(s.category || "")}"></div>
            <div><label>品牌</label><input data-f="brand" value="${escapeHtml(s.brand || "")}"></div>
          </div>
          <label>型號</label><input data-f="model" value="${escapeHtml(s.model || "")}">
          <div class="row-2">
            <div><label>電話</label><input data-f="phone" value="${escapeHtml(s.phone || "")}"></div>
            <div><label>電郵</label><input data-f="email" value="${escapeHtml(s.email || "")}"></div>
          </div>
          <label>網址</label><input data-f="url" value="${escapeHtml(s.url || "")}">
          <label>備註</label><input data-f="note" value="${escapeHtml(s.note || "")}">
          <div class="admin-actions" style="margin-top:8px">
            <button type="button" class="btn-danger" data-rm="${i}">刪除</button>
          </div>
        </div>`
        )
        .join("") || `<p class="admin-hint">未有供應商。</p>`;
      list.querySelectorAll("[data-rm]").forEach((btn) => {
        btn.addEventListener("click", () => {
          store.supplierCatalog.splice(Number(btn.dataset.rm), 1);
          paint();
        });
      });
    }

    function harvest() {
      list.querySelectorAll("[data-si]").forEach((block) => {
        const i = Number(block.dataset.si);
        const s = store.supplierCatalog[i];
        if (!s) return;
        ["category", "brand", "model", "phone", "email", "url", "note"].forEach(
          (f) => {
            const el = $(`[data-f="${f}"]`, block);
            if (el) s[f] = el.value.trim();
          }
        );
      });
    }

    paint();
    $("#btn-add-sup", panel).addEventListener("click", () => {
      harvest();
      store.supplierCatalog.push({
        id: uid("sup"),
        category: "",
        brand: "",
        model: "",
        phone: "",
        email: "",
        url: "",
        note: "",
      });
      paint();
    });
    $("#btn-save-sup", panel).addEventListener("click", () => {
      harvest();
      saveStore();
    });
  }

  function renderCustomersPanel(panel) {
    const rows = Object.values(store.customers || {});
    panel.innerHTML = `
      <p class="admin-hint">客人手機用於示範登入。可喺項目編輯頁綁定手機，或喺呢度改名／加項目。</p>
      <div class="admin-toolbar">
        <button type="button" class="btn btn-cta" id="btn-add-cust">＋ 新增客人</button>
        <button type="button" class="btn btn-outline" id="btn-save-cust">儲存</button>
      </div>
      <div id="cust-list"></div>
    `;
    const list = $("#cust-list", panel);

    function paint() {
      const all = Object.values(store.customers || {});
      list.innerHTML = all
        .map((c) => {
          const pids = (c.projectIds || []).join(", ");
          return `
          <div class="item-block card" style="margin-bottom:10px" data-phone="${escapeHtml(c.phone)}">
            <div class="row-2">
              <div><label>手機（8 位）</label><input data-f="phone" value="${escapeHtml(c.phone)}" maxlength="8"></div>
              <div><label>顯示名稱</label><input data-f="name" value="${escapeHtml(c.name || "")}"></div>
            </div>
            <label>項目 IDs（逗號分隔）</label>
            <input data-f="projectIds" value="${escapeHtml(pids)}">
            <div class="admin-actions" style="margin-top:8px">
              <button type="button" class="btn-danger" data-rm-phone="${escapeHtml(c.phone)}">刪除</button>
            </div>
          </div>`;
        })
        .join("") || `<p class="admin-hint">未有客人。</p>`;
      list.querySelectorAll("[data-rm-phone]").forEach((btn) => {
        btn.addEventListener("click", () => {
          delete store.customers[btn.dataset.rmPhone];
          paint();
        });
      });
    }

    function harvest() {
      const next = {};
      list.querySelectorAll("[data-phone]").forEach((block) => {
        const phone = $('[data-f="phone"]', block)
          .value.replace(/\D/g, "")
          .slice(0, 8);
        if (!/^\d{8}$/.test(phone)) return;
        const name = $('[data-f="name"]', block).value.trim() || `客人 ${phone.slice(-4)}`;
        const projectIds = $('[data-f="projectIds"]', block)
          .value.split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const old = store.customers[block.dataset.phone];
        next[phone] = {
          id: (old && old.id) || uid("cust"),
          name,
          phone,
          projectIds,
        };
      });
      store.customers = next;
    }

    paint();
    $("#btn-add-cust", panel).addEventListener("click", () => {
      harvest();
      const phone = prompt("輸入 8 位手機號碼");
      if (!phone) return;
      const p = phone.replace(/\D/g, "").slice(0, 8);
      if (!/^\d{8}$/.test(p)) {
        alert("請輸入 8 位數字");
        return;
      }
      if (!store.customers[p]) {
        store.customers[p] = {
          id: uid("cust"),
          name: `客人 ${p.slice(-4)}`,
          phone: p,
          projectIds: [],
        };
      }
      paint();
    });
    $("#btn-save-cust", panel).addEventListener("click", () => {
      harvest();
      saveStore();
      paint();
    });
  }

  function renderDataPanel(panel) {
    const raw = localStorage.getItem(OVERRIDE_KEY) || "";
    let info = "尚未有覆寫（客人端會用 js/data.js 預設）。";
    try {
      if (raw) {
        const o = JSON.parse(raw);
        info = `已有覆寫 · savedAt: ${o.savedAt || "—"} · 項目數: ${Object.keys(o.projects || {}).length}`;
      }
    } catch {
      info = "覆寫資料損壞，建議清除或重新匯入。";
    }
    panel.innerHTML = `
      <p class="admin-hint">${escapeHtml(info)}</p>
      <div class="admin-toolbar">
        <button type="button" class="btn btn-cta" id="btn-export">匯出 JSON</button>
        <label class="btn btn-outline" style="width:auto;cursor:pointer;margin:0">
          匯入 JSON
          <input type="file" id="import-file" accept="application/json,.json" hidden>
        </label>
        <button type="button" class="btn-danger" id="btn-clear">清除覆寫（還原 data.js）</button>
      </div>
      <div class="card">
        <label for="json-preview">目前將會寫入嘅資料預覽</label>
        <textarea id="json-preview" style="min-height:220px;font-family:ui-monospace,monospace;font-size:0.75rem"></textarea>
        <div class="btn-row">
          <button type="button" class="btn btn-secondary" id="btn-apply-preview">由上方文字套用並儲存</button>
        </div>
      </div>
    `;
    const preview = $("#json-preview", panel);
    preview.value = JSON.stringify(
      {
        contact: store.contact,
        about: store.about,
        customers: store.customers,
        projects: store.projects,
        warrantyDetails: store.warrantyDetails,
        supplierCatalog: store.supplierCatalog,
        demoOtp: store.demoOtp,
      },
      null,
      2
    );

    $("#btn-export", panel).addEventListener("click", () => {
      const blob = new Blob([preview.value], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ecdeco-cs-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("已下載 JSON");
    });

    $("#import-file", panel).addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const base = cloneBase();
        store = {
          ...base,
          ...parsed,
          contact: { ...base.contact, ...(parsed.contact || {}) },
          about: { ...base.about, ...(parsed.about || {}) },
          customers: parsed.customers || base.customers,
          projects: parsed.projects || base.projects,
          warrantyDetails: {
            ...(base.warrantyDetails || {}),
            ...(parsed.warrantyDetails || {}),
          },
          supplierCatalog: parsed.supplierCatalog || base.supplierCatalog || [],
        };
        saveStore();
        renderApp();
      } catch (err) {
        alert("匯入失敗：" + err.message);
      }
    });

    $("#btn-clear", panel).addEventListener("click", () => {
      if (!confirm("清除 localStorage 覆寫？客人端會還原用 data.js。")) return;
      localStorage.removeItem(OVERRIDE_KEY);
      store = cloneBase();
      toast("已清除覆寫");
      renderApp();
    });

    $("#btn-apply-preview", panel).addEventListener("click", () => {
      try {
        const parsed = JSON.parse(preview.value);
        const base = cloneBase();
        store = {
          ...base,
          ...parsed,
          contact: { ...base.contact, ...(parsed.contact || {}) },
          about: { ...base.about, ...(parsed.about || {}) },
          customers: parsed.customers || base.customers,
          projects: parsed.projects || base.projects,
          warrantyDetails: {
            ...(base.warrantyDetails || {}),
            ...(parsed.warrantyDetails || {}),
          },
          supplierCatalog: parsed.supplierCatalog || base.supplierCatalog || [],
        };
        saveStore();
        renderApp();
      } catch (err) {
        alert("JSON 無效：" + err.message);
      }
    });
  }

  /* ---------- Boot ---------- */

  $("#btn-admin-logout").addEventListener("click", () => {
    setAuthed(false);
    renderLogin();
  });

  loadStore();
  if (isAuthed()) renderApp();
  else renderLogin();
})();
