/**
 * SecHeaders Pro - Standalone Slide-In Sidebar Bookmarklet
 * Offensive Cybersecurity & Pentest Header Audit Tool
 * 
 * To use as a bookmarklet:
 * Copy the minified/encoded javascript: URL from the installer dashboard (index.html)
 * or run this script in any browser console.
 */

(function() {
  const SIDEBAR_ID = "secheaders-pro-sidebar-host";
  
  // Toggle/remove if already injected
  const existing = document.getElementById(SIDEBAR_ID);
  if (existing) {
    existing.remove();
    return;
  }

  // Create Shadow DOM host so page CSS doesn't break our cyber UI
  const host = document.createElement("div");
  host.id = SIDEBAR_ID;
  host.style.cssText = "position: fixed; top: 0; right: 0; width: 0; height: 0; z-index: 2147483647;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const SECURITY_HEADERS_AUDIT = [
    {
      key: "strict-transport-security",
      name: "Strict-Transport-Security (HSTS)",
      severity: "CRITICAL",
      desc: "Enforces secure HTTPS connections and prevents MITM downgrade / SSL stripping attacks.",
      rec: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
    },
    {
      key: "content-security-policy",
      name: "Content-Security-Policy (CSP)",
      severity: "CRITICAL",
      desc: "Mitigates Cross-Site Scripting (XSS), clickjacking, and unauthorized data exfiltration.",
      rec: "Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
    },
    {
      key: "x-frame-options",
      name: "X-Frame-Options (XFO)",
      severity: "HIGH",
      desc: "Defends against Clickjacking UI redress attacks by controlling iframe embedding.",
      rec: "X-Frame-Options: DENY"
    },
    {
      key: "x-content-type-options",
      name: "X-Content-Type-Options",
      severity: "HIGH",
      desc: "Prevents MIME-sniffing vulnerabilities where browsers execute non-executable assets as scripts.",
      rec: "X-Content-Type-Options: nosniff"
    },
    {
      key: "referrer-policy",
      name: "Referrer-Policy",
      severity: "MEDIUM",
      desc: "Controls information leakage in the Referer header when navigating cross-origin.",
      rec: "Referrer-Policy: strict-origin-when-cross-origin"
    },
    {
      key: "permissions-policy",
      name: "Permissions-Policy",
      severity: "MEDIUM",
      desc: "Restricts browser API access (camera, microphone, geolocation, USB) for sensitive contexts.",
      rec: "Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()"
    },
    {
      key: "cross-origin-opener-policy",
      name: "Cross-Origin-Opener-Policy (COOP)",
      severity: "LOW",
      desc: "Isolates browsing context to protect against cross-origin window leaks and Spectre timing attacks.",
      rec: "Cross-Origin-Opener-Policy: same-origin"
    },
    {
      key: "cross-origin-embedder-policy",
      name: "Cross-Origin-Embedder-Policy (COEP)",
      severity: "LOW",
      desc: "Prevents document from loading cross-origin resources that don't explicitly grant permission.",
      rec: "Cross-Origin-Embedder-Policy: require-corp"
    },
    {
      key: "cross-origin-resource-policy",
      name: "Cross-Origin-Resource-Policy (CORP)",
      severity: "LOW",
      desc: "Protects resources from being embedded by cross-origin attackers.",
      rec: "Cross-Origin-Resource-Policy: same-site"
    }
  ];

  const INFO_DISCLOSURE_HEADERS = [
    { key: "server", name: "Server Banner", desc: "Reveals exact web server technology and version." },
    { key: "x-powered-by", name: "X-Powered-By", desc: "Leaks underlying application framework and runtime." },
    { key: "x-aspnet-version", name: "X-AspNet-Version", desc: "Exposes exact ASP.NET framework version." },
    { key: "x-aspnetmvc-version", name: "X-AspNetMvc-Version", desc: "Exposes exact ASP.NET MVC version." },
    { key: "x-generator", name: "X-Generator", desc: "Leaks CMS or static site generator version." }
  ];

  // Build sleek cybersecurity styles inside shadow DOM
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    .sidebar-overlay {
      position: fixed;
      top: 0;
      right: -480px;
      width: 440px;
      max-width: 92vw;
      height: 100vh;
      background: #0b1120;
      color: #f8fafc;
      box-shadow: -10px 0 35px rgba(0, 0, 0, 0.8), 0 0 15px rgba(6, 182, 212, 0.2);
      border-left: 1px solid #334155;
      display: flex;
      flex-direction: column;
      transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 2147483647;
      overflow: hidden;
      font-size: 13px;
    }
    
    .sidebar-overlay.open { right: 0; }
    
    .sidebar-overlay.screenshot-mode {
      width: 540px;
      border-left: 4px solid #ef4444;
    }

    .header-nav {
      background: #0f172a;
      padding: 14px 16px;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .logo-shield {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #10b981, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      color: #0b1120; font-weight: 900;
    }

    .brand-title { font-size: 15px; font-weight: 700; color: #fff; }
    .brand-sub { font-size: 9px; color: #06b6d4; font-weight: 700; letter-spacing: 0.08em; }

    .actions { display: flex; gap: 6px; }

    .btn {
      background: #1e293b; color: #f8fafc; border: 1px solid #334155;
      padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 5px; transition: all 0.2s;
    }
    .btn:hover { background: #334155; border-color: #06b6d4; color: #06b6d4; }
    .btn-close { padding: 6px 10px; font-size: 16px; line-height: 1; color: #94a3b8; }
    .btn-close:hover { color: #ef4444; border-color: #ef4444; }

    .content-area {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 14px;
    }

    .target-banner {
      background: #1e293b; border: 1px solid #334155; border-left: 4px solid #06b6d4;
      padding: 10px 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;
    }
    .target-url { font-family: monospace; font-size: 12px; font-weight: 600; color: #fff; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .target-badge { font-size: 10px; background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #10b981; font-family: monospace; border: 1px solid #334155; }

    .screenshot-header {
      display: none; background: #1e293b; border: 1px solid #ef4444; border-left: 5px solid #ef4444;
      padding: 12px; border-radius: 6px; font-size: 11px;
    }
    .sidebar-overlay.screenshot-mode .screenshot-header { display: block; }
    .sidebar-overlay.screenshot-mode .toolbar-tabs,
    .sidebar-overlay.screenshot-mode .btn-close { display: none !important; }

    .grade-box {
      background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 14px;
      display: flex; align-items: center; gap: 14px;
    }
    .grade-circle {
      width: 58px; height: 58px; border-radius: 50%; background: #0f172a; border: 3px solid #10b981;
      display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
    }
    .grade-letter { font-size: 22px; font-weight: 800; color: #10b981; line-height: 1; }
    .grade-label { font-size: 8px; font-weight: 700; color: #94a3b8; }

    .grade-text h3 { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px; }
    .grade-text p { font-size: 11px; color: #94a3b8; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px; text-align: center; }
    .stat-val { font-size: 18px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
    .stat-card.missing .stat-val { color: #ef4444; }
    .stat-card.present .stat-val { color: #10b981; }
    .stat-card.warning .stat-val { color: #f59e0b; }
    .stat-title { font-size: 10px; font-weight: 600; color: #94a3b8; }

    .toolbar-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab-btn { background: #0f172a; border: 1px solid #334155; color: #94a3b8; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .tab-btn.active { background: #1e293b; color: #fff; border-color: #06b6d4; }

    .cards-list { display: flex; flex-direction: column; gap: 10px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
    .card.missing { border-left: 4px solid #ef4444; }
    .card.present { border-left: 4px solid #10b981; }
    .card.warning { border-left: 4px solid #f59e0b; }

    .card-top { background: rgba(15, 23, 42, 0.5); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
    .card-title { font-size: 13px; font-weight: 700; color: #fff; }
    .badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .badge.missing { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
    .badge.present { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
    .badge.warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }

    .card-body { padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
    .card-desc { font-size: 11px; color: #94a3b8; }
    .val-box { background: #0b1120; border: 1px solid #334155; border-radius: 4px; padding: 6px 8px; font-family: monospace; font-size: 11px; color: #06b6d4; word-break: break-all; }
    .val-box.missing { color: #ef4444; font-style: italic; }
    
    .rec-box { background: rgba(6, 182, 212, 0.08); border: 1px dashed #06b6d4; border-radius: 4px; padding: 6px 8px; font-size: 10px; }
    .rec-code { font-family: monospace; color: #fff; display: block; margin-top: 3px; font-weight: 600; }

    .footer { padding: 10px 16px; background: #0f172a; border-top: 1px solid #334155; text-align: center; font-size: 10px; color: #64748b; }
    
    .spinner { width: 24px; height: 24px; border: 3px solid #334155; border-top-color: #06b6d4; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  shadow.appendChild(styleEl);

  const container = document.createElement("div");
  container.className = "sidebar-overlay";
  container.innerHTML = `
    <div class="header-nav">
      <div class="brand">
        <div class="logo-shield">🛡️</div>
        <div>
          <div class="brand-title">SecHeaders Pro Scanner</div>
          <div class="brand-sub">OFFENSIVE HACKER SCANNER | VIJAY UBA™</div>
        </div>
      </div>
      <div class="actions">
        <button class="btn" id="screenshotBtn" title="Prepare UI for client report screenshot">📸 Screenshot Mode</button>
        <button class="btn btn-close" id="closeBtn" title="Close Sidebar">&times;</button>
      </div>
    </div>

    <div class="content-area">
      <div class="target-banner">
        <span class="target-url" id="targetUrl">${window.location.hostname || "Local File"}</span>
        <span class="target-badge" id="statusBadge">Checking...</span>
      </div>

      <div class="screenshot-header">
        <div style="color: #ef4444; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 4px;">CONFIDENTIAL // PENTEST ASSESSMENT FINDINGS</div>
        <div><strong>Host:</strong> ${window.location.hostname || "localhost"}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <div><strong>Architect & Trademark:</strong> Vijay Uba™</div>
      </div>

      <div class="grade-box">
        <div class="grade-circle" id="gradeCircle">
          <span class="grade-letter" id="gradeLetter">--</span>
          <span class="grade-label">RISK GRADE</span>
        </div>
        <div class="grade-text">
          <h3 id="gradeTitle">Inspecting Headers...</h3>
          <p id="gradeDesc">Performing live request verification on current origin.</p>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card missing"><div class="stat-val" id="statMissing">0</div><div class="stat-title">Missing</div></div>
        <div class="stat-card present"><div class="stat-val" id="statPresent">0</div><div class="stat-title">Secure</div></div>
        <div class="stat-card warning"><div class="stat-val" id="statWarning">0</div><div class="stat-title">Warnings</div></div>
      </div>

      <div class="toolbar-tabs">
        <button class="tab-btn active" data-tab="all">All (<span id="countAll">0</span>)</button>
        <button class="tab-btn" data-tab="missing">Missing</button>
        <button class="tab-btn" data-tab="present">Secure</button>
        <button class="tab-btn" data-tab="warning">Disclosure</button>
      </div>

      <div class="cards-list" id="cardsList">
        <div class="spinner"></div>
      </div>
    </div>

    <div class="footer">
      SecHeaders Pro Suite &bull; Offensive Hacker Scanner &bull; Trademark &copy; Vijay Uba™
    </div>
  `;
  shadow.appendChild(container);

  // Trigger slide-in animation after append
  setTimeout(() => container.classList.add("open"), 30);

  // Close logic
  shadow.getElementById("closeBtn").addEventListener("click", () => {
    container.classList.remove("open");
    setTimeout(() => host.remove(), 350);
  });

  // Screenshot Mode logic
  let screenshotMode = false;
  shadow.getElementById("screenshotBtn").addEventListener("click", () => {
    screenshotMode = !screenshotMode;
    container.classList.toggle("screenshot-mode", screenshotMode);
    shadow.getElementById("screenshotBtn").textContent = screenshotMode ? "❌ Exit Screenshot" : "📸 Screenshot Mode";
  });

  // Filter tab logic
  let currentTab = "all";
  shadow.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      shadow.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderCards();
    });
  });

  let findings = [];

  // Execute live check
  function performAudit() {
    const targetHref = window.location.href;
    if (targetHref.startsWith("file://") || targetHref.startsWith("about:") || targetHref.startsWith("chrome://")) {
      renderError("Can only check live HTTP/HTTPS URLs. Navigate to a web application target to run security audit.");
      return;
    }

    fetch(targetHref, { method: "HEAD", cache: "no-store" })
      .then((res) => {
        shadow.getElementById("statusBadge").textContent = `${res.status} HTTP`;
        const headersObj = {};
        res.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });
        processHeaders(headersObj);
      })
      .catch((err) => {
        // If fetch fails due to CORS or network when running via bookmarklet on cross-origin/special,
        // fall back to inspecting DOM meta tags and document cookies / CSP
        console.warn("Fetch HEAD error or CORS restriction. Falling back to DOM security inspection.", err);
        shadow.getElementById("statusBadge").textContent = "DOM + Meta Audit";
        const fallbackHeaders = inspectDomMetaHeaders();
        processHeaders(fallbackHeaders);
      });
  }

  function inspectDomMetaHeaders() {
    const headers = {};
    // Check meta http-equiv in DOM
    document.querySelectorAll("meta[http-equiv]").forEach((m) => {
      const name = m.getAttribute("http-equiv").toLowerCase();
      const val = m.getAttribute("content") || "";
      headers[name] = val;
    });
    // Check if secure cookie exists
    if (document.cookie && document.cookie.includes("Secure")) {
      headers["set-cookie"] = "Secure flags detected in document.cookie";
    }
    return headers;
  }

  function processHeaders(headersMap) {
    findings = [];
    let score = 100;
    let missingCount = 0;
    let presentCount = 0;
    let warningCount = 0;

    SECURITY_HEADERS_AUDIT.forEach((audit) => {
      const val = headersMap[audit.key];
      if (val) {
        presentCount++;
        findings.push({ name: audit.name, status: "present", badge: "PRESENT", val: val, desc: audit.desc });
      } else {
        missingCount++;
        if (audit.severity === "CRITICAL") score -= 25;
        else if (audit.severity === "HIGH") score -= 15;
        else if (audit.severity === "MEDIUM") score -= 10;
        else score -= 5;

        findings.push({
          name: audit.name, status: "missing", badge: `MISSING (${audit.severity})`,
          val: "Header not sent in response.", desc: audit.desc, rec: audit.rec
        });
      }
    });

    INFO_DISCLOSURE_HEADERS.forEach((info) => {
      const val = headersMap[info.key];
      if (val) {
        warningCount++;
        score -= 5;
        findings.push({ name: info.name, status: "warning", badge: "INFO DISCLOSURE", val: val, desc: info.desc });
      }
    });

    score = Math.max(0, Math.min(100, score));

    // Update grade badge
    const gradeCircle = shadow.getElementById("gradeCircle");
    const gradeLetter = shadow.getElementById("gradeLetter");
    const gradeTitle = shadow.getElementById("gradeTitle");
    const gradeDesc = shadow.getElementById("gradeDesc");

    let letter = "F"; let color = "#ef4444"; let title = "Vulnerable Target"; let desc = "Critical security headers absent.";
    if (score >= 95 && missingCount === 0) { letter = "A+"; color = "#10b981"; title = "Exceptional Defenses"; desc = "All critical headers hardened."; }
    else if (score >= 80) { letter = "A"; color = "#10b981"; title = "Strong Security Profile"; desc = "Core defenses implemented."; }
    else if (score >= 65) { letter = "B"; color = "#84cc16"; title = "Moderate Defenses"; desc = "Some headers missing."; }
    else if (score >= 45) { letter = "C"; color = "#f59e0b"; title = "Substandard Security"; desc = "Multiple high-severity gaps."; }
    else if (score >= 25) { letter = "D"; color = "#ef4444"; title = "High Risk / Unhardened"; desc = "Most security headers missing."; }

    gradeCircle.style.borderColor = color;
    gradeCircle.style.boxShadow = `0 0 15px ${color}33`;
    gradeLetter.style.color = color;
    gradeLetter.textContent = letter;
    gradeTitle.textContent = `${title} (${score}/100)`;
    gradeDesc.textContent = desc;

    shadow.getElementById("statMissing").textContent = missingCount;
    shadow.getElementById("statPresent").textContent = presentCount;
    shadow.getElementById("statWarning").textContent = warningCount;
    shadow.getElementById("countAll").textContent = findings.length;

    renderCards();
  }

  function renderCards() {
    const listEl = shadow.getElementById("cardsList");
    listEl.innerHTML = "";

    const filtered = findings.filter((f) => {
      if (currentTab !== "all" && f.status !== currentTab) return false;
      return true;
    });

    if (filtered.length === 0) {
      listEl.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 20px;">No headers matching selected tab.</div>`;
      return;
    }

    filtered.sort((a, b) => {
      const order = { missing: 1, warning: 2, present: 3 };
      return order[a.status] - order[b.status];
    });

    filtered.forEach((f) => {
      const card = document.createElement("div");
      card.className = `card ${f.status}`;
      
      const recHtml = f.rec ? `
        <div class="rec-box">
          <div style="color: #06b6d4; font-weight: 700;">Fix Recommendation:</div>
          <code class="rec-code">${f.rec}</code>
        </div>
      ` : "";

      card.innerHTML = `
        <div class="card-top">
          <span class="card-title">${f.name}</span>
          <span class="badge ${f.status}">${f.badge}</span>
        </div>
        <div class="card-body">
          <div class="card-desc">${f.desc}</div>
          <div class="val-box ${f.status === "missing" ? "missing" : ""}">${f.val}</div>
          ${recHtml}
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  function renderError(msg) {
    shadow.getElementById("cardsList").innerHTML = `
      <div class="card missing" style="padding: 16px; text-align: center;">
        <div style="color: #ef4444; font-weight: 700; margin-bottom: 6px;">Audit Restriction</div>
        <div style="color: #94a3b8; font-size: 11px;">${msg}</div>
      </div>
    `;
  }

  // Auto-update audit if user navigates within an SPA without full reload
  window.addEventListener("popstate", performAudit);
  window.addEventListener("hashchange", performAudit);
  let lastHref = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastHref) {
      lastHref = window.location.href;
      performAudit();
    }
  }, 1000);

  performAudit();
})();
