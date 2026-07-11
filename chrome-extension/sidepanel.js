// SecHeaders Pro - Offensive Cybersecurity & Pentest Analyzer Logic

const SECURITY_HEADERS_AUDIT = [
  {
    key: "strict-transport-security",
    name: "Strict-Transport-Security (HSTS)",
    category: "security",
    severity: "CRITICAL",
    desc: "Enforces secure HTTPS connections and prevents MITM downgrade / SSL stripping attacks.",
    rec: "Strict-Transport-Security: max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "content-security-policy",
    name: "Content-Security-Policy (CSP)",
    category: "security",
    severity: "CRITICAL",
    desc: "Mitigates Cross-Site Scripting (XSS), clickjacking, and unauthorized data exfiltration.",
    rec: "Content-Security-Policy: default-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;"
  },
  {
    key: "x-frame-options",
    name: "X-Frame-Options (XFO)",
    category: "security",
    severity: "HIGH",
    desc: "Defends against Clickjacking UI redress attacks by controlling iframe embedding.",
    rec: "X-Frame-Options: DENY"
  },
  {
    key: "x-content-type-options",
    name: "X-Content-Type-Options",
    category: "security",
    severity: "HIGH",
    desc: "Prevents MIME-sniffing vulnerabilities where browsers execute non-executable assets as scripts.",
    rec: "X-Content-Type-Options: nosniff"
  },
  {
    key: "referrer-policy",
    name: "Referrer-Policy",
    category: "security",
    severity: "MEDIUM",
    desc: "Controls information leakage in the Referer header when navigating cross-origin.",
    rec: "Referrer-Policy: strict-origin-when-cross-origin"
  },
  {
    key: "permissions-policy",
    name: "Permissions-Policy",
    category: "security",
    severity: "MEDIUM",
    desc: "Restricts browser API access (camera, microphone, geolocation, USB) for sensitive contexts.",
    rec: "Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()"
  },
  {
    key: "cross-origin-opener-policy",
    name: "Cross-Origin-Opener-Policy (COOP)",
    category: "security",
    severity: "LOW",
    desc: "Isolates browsing context to protect against cross-origin window leaks and Spectre timing attacks.",
    rec: "Cross-Origin-Opener-Policy: same-origin"
  },
  {
    key: "cross-origin-embedder-policy",
    name: "Cross-Origin-Embedder-Policy (COEP)",
    category: "security",
    severity: "LOW",
    desc: "Prevents document from loading cross-origin resources that don't explicitly grant permission.",
    rec: "Cross-Origin-Embedder-Policy: require-corp"
  },
  {
    key: "cross-origin-resource-policy",
    name: "Cross-Origin-Resource-Policy (CORP)",
    category: "security",
    severity: "LOW",
    desc: "Protects resources from being embedded by cross-origin attackers.",
    rec: "Cross-Origin-Resource-Policy: same-site"
  }
];

const INFO_DISCLOSURE_HEADERS = [
  { key: "server", name: "Server Banner", desc: "Reveals exact web server technology and version (e.g. Apache, nginx, IIS)." },
  { key: "x-powered-by", name: "X-Powered-By", desc: "Leaks underlying application framework and runtime (e.g. PHP/8.1, Express, ASP.NET)." },
  { key: "x-aspnet-version", name: "X-AspNet-Version", desc: "Exposes exact ASP.NET framework version to potential attackers." },
  { key: "x-aspnetmvc-version", name: "X-AspNetMvc-Version", desc: "Exposes exact ASP.NET MVC version." },
  { key: "x-generator", name: "X-Generator", desc: "Leaks CMS or static site generator version (e.g. Drupal, WordPress)." }
];

let currentFindings = [];
let currentFilter = "all";
let currentSearch = "";
let isScreenshotMode = false;
let currentTabMeta = { url: "", statusCode: 0 };

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  analyzeCurrentTab();
  setupLiveAutoScanListeners();
});

function initUI() {
  document.getElementById("refreshBtn").addEventListener("click", () => {
    analyzeCurrentTab();
  });

  document.getElementById("toggleScreenshotMode").addEventListener("click", () => {
    isScreenshotMode = !isScreenshotMode;
    document.body.classList.toggle("screenshot-mode", isScreenshotMode);
    const btnSpan = document.querySelector("#toggleScreenshotMode span");
    btnSpan.textContent = isScreenshotMode ? "Exit Screenshot Mode" : "Screenshot Mode";
  });

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderFindings();
    });
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderFindings();
  });

  document.getElementById("copyMarkdownBtn").addEventListener("click", copyMarkdownReport);
  document.getElementById("copyJsonBtn").addEventListener("click", copyJsonReport);
}

function setupLiveAutoScanListeners() {
  // 1. Listen for background service worker broadcasts when headers update or active tab changes
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "headersUpdated" || request.action === "tabChanged") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id === request.tabId && request.data) {
          processHeadersData(tabs[0], request.data);
        } else if (request.action === "tabChanged" && tabs[0]) {
          analyzeCurrentTab();
        }
      });
    }
  });

  // 2. Listen directly for browser tab switching inside the side panel / popup
  chrome.tabs.onActivated.addListener((activeInfo) => {
    analyzeCurrentTab();
  });

  // 3. Listen directly for URL updates / page navigations
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" || changeInfo.url) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id === tabId) {
          analyzeCurrentTab();
        }
      });
    }
  });
}

function analyzeCurrentTab() {
  const listEl = document.getElementById("findingsList");
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      showError("No active tab found.");
      return;
    }

    const tab = tabs[0];
    if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
      showError("System or browser restricted page. Navigate to a web application target (HTTP/HTTPS) to view live security headers.");
      return;
    }

    currentTabMeta.url = tab.url;

    // Check with background service worker (passes tab.url for instant background fetch if not already cached)
    chrome.runtime.sendMessage({ action: "getTabHeaders", tabId: tab.id, url: tab.url }, (response) => {
      if (chrome.runtime.lastError || !response || response.status !== "success" || !response.data) {
        fallbackInspectTab(tab);
      } else {
        processHeadersData(tab, response.data);
      }
    });
  });
}

function fallbackInspectTab(tab) {
  fetch(tab.url, { method: "HEAD", cache: "no-store" })
    .then((res) => {
      const headerObj = {};
      res.headers.forEach((value, key) => {
        headerObj[key.toLowerCase()] = value;
      });
      processHeadersData(tab, {
        url: tab.url,
        statusCode: res.status,
        statusLine: res.statusText,
        headers: headerObj,
        rawHeaders: Array.from(res.headers.entries()).map(([k, v]) => ({ name: k, value: v }))
      });
    })
    .catch((err) => {
      showError("Capturing headers... If target blocks HEAD requests, refresh the tab once to register background interception.");
    });
}

function processHeadersData(tab, data) {
  const headersMap = data.headers || {};
  currentTabMeta.statusCode = data.statusCode || 200;
  
  // Update Target Banner
  document.getElementById("targetUrl").textContent = data.url || tab.url;
  const statusEl = document.getElementById("httpStatus");
  statusEl.textContent = `${data.statusCode || 200} HTTP`;
  statusEl.className = `http-status status-${Math.floor((data.statusCode || 200) / 100)}xx`;
  
  document.getElementById("scanTime").textContent = new Date().toLocaleTimeString();

  // Populate report header for screenshot
  try {
    const urlObj = new URL(data.url || tab.url);
    document.getElementById("reportHost").textContent = urlObj.hostname;
  } catch(e) {
    document.getElementById("reportHost").textContent = data.url || tab.url;
  }
  document.getElementById("reportDate").textContent = new Date().toLocaleDateString("en-US", {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Populate raw headers
  const rawCountEl = document.getElementById("rawHeaderCount");
  const rawPreEl = document.getElementById("rawHeadersOutput");
  if (data.rawHeaders && data.rawHeaders.length > 0) {
    rawCountEl.textContent = data.rawHeaders.length;
    rawPreEl.textContent = data.rawHeaders.map(h => `${h.name}: ${h.value || h.binaryValue || ""}`).join("\n");
  } else {
    rawCountEl.textContent = Object.keys(headersMap).length;
    rawPreEl.textContent = Object.entries(headersMap).map(([k, v]) => `${k}: ${v}`).join("\n");
  }

  // Build findings
  currentFindings = [];
  let scorePoints = 100;
  let missingCount = 0;
  let presentCount = 0;
  let warningCount = 0;

  // 1. Check Security Defenses
  SECURITY_HEADERS_AUDIT.forEach((audit) => {
    const val = headersMap[audit.key];
    if (val !== undefined && val !== null && val !== "") {
      presentCount++;
      currentFindings.push({
        id: audit.key,
        name: audit.name,
        status: "present",
        badgeText: "PRESENT",
        value: val,
        desc: audit.desc,
        category: "present"
      });
    } else {
      missingCount++;
      if (audit.severity === "CRITICAL") scorePoints -= 25;
      else if (audit.severity === "HIGH") scorePoints -= 15;
      else if (audit.severity === "MEDIUM") scorePoints -= 10;
      else scorePoints -= 5;

      currentFindings.push({
        id: audit.key,
        name: audit.name,
        status: "missing",
        badgeText: `MISSING (${audit.severity})`,
        value: "Header not returned by server.",
        desc: audit.desc,
        rec: audit.rec,
        category: "missing"
      });
    }
  });

  // 2. Check Information Disclosure Warnings
  INFO_DISCLOSURE_HEADERS.forEach((info) => {
    const val = headersMap[info.key];
    if (val !== undefined && val !== null && val !== "") {
      warningCount++;
      scorePoints -= 5;
      currentFindings.push({
        id: info.key,
        name: info.name,
        status: "warning",
        badgeText: "INFO DISCLOSURE",
        value: val,
        desc: info.desc,
        category: "warning"
      });
    }
  });

  scorePoints = Math.max(0, Math.min(100, scorePoints));
  updateGradeUI(scorePoints, missingCount, presentCount, warningCount);
  renderFindings();
}

function updateGradeUI(score, missing, present, warning) {
  const gradeCircle = document.getElementById("gradeCircle");
  const gradeLetter = document.getElementById("gradeLetter");
  const gradeTitle = document.getElementById("gradeTitle");
  const gradeDesc = document.getElementById("gradeDesc");

  let grade = "F";
  let gradeClass = "grade-F";
  let title = "Vulnerable Profile";
  let desc = "Critical security headers missing. High risk of XSS/MITM/Clickjacking.";

  if (score >= 95 && missing === 0) {
    grade = "A+"; gradeClass = "grade-A-plus"; title = "Exceptional Defenses";
    desc = "All critical OWASP security headers properly implemented.";
  } else if (score >= 80) {
    grade = "A"; gradeClass = "grade-A"; title = "Strong Security Profile";
    desc = "Most core security headers are present and hardened.";
  } else if (score >= 65) {
    grade = "B"; gradeClass = "grade-B"; title = "Moderate Defenses";
    desc = "Some important security headers missing. Hardening recommended.";
  } else if (score >= 45) {
    grade = "C"; gradeClass = "grade-C"; title = "Substandard Security";
    desc = "Multiple high-severity headers absent. Exposure to common web attacks.";
  } else if (score >= 25) {
    grade = "D"; gradeClass = "grade-D"; title = "High Risk / Unhardened";
    desc = "Most defensive headers are missing. Urgent audit advised.";
  }

  gradeCircle.className = `grade-circle ${gradeClass}`;
  gradeLetter.textContent = grade;
  gradeTitle.textContent = `${title} (${score}/100)`;
  gradeDesc.textContent = desc;

  document.getElementById("statMissing").textContent = missing;
  document.getElementById("statPresent").textContent = present;
  document.getElementById("statWarning").textContent = warning;

  document.getElementById("countAll").textContent = currentFindings.length;
  document.getElementById("countMissing").textContent = missing;
  document.getElementById("countPresent").textContent = present;
  document.getElementById("countWarning").textContent = warning;
}

function renderFindings() {
  const listEl = document.getElementById("findingsList");
  listEl.innerHTML = "";

  const filtered = currentFindings.filter((item) => {
    if (currentFilter !== "all" && item.category !== currentFilter) {
      return false;
    }
    if (currentSearch) {
      const matchName = item.name.toLowerCase().includes(currentSearch);
      const matchDesc = item.desc.toLowerCase().includes(currentSearch);
      const matchVal = item.value.toLowerCase().includes(currentSearch);
      return matchName || matchDesc || matchVal;
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="loading-state"><p>No headers matching filter criteria.</p></div>`;
    return;
  }

  filtered.sort((a, b) => {
    const order = { missing: 1, warning: 2, present: 3 };
    return order[a.status] - order[b.status];
  });

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = `header-card status-${item.status}`;

    const valueClass = item.status === "missing" ? "missing-box" : "";
    const recHtml = item.rec ? `
      <div class="recommendation-box">
        <div class="rec-title">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Remediation Recommendation</span>
        </div>
        <code class="rec-code">${escapeHtml(item.rec)}</code>
      </div>
    ` : "";

    card.innerHTML = `
      <div class="card-top">
        <div class="header-title">
          <span class="header-name">${escapeHtml(item.name)}</span>
        </div>
        <span class="badge ${item.status}">${escapeHtml(item.badgeText)}</span>
      </div>
      <div class="card-body">
        <div class="header-desc">${escapeHtml(item.desc)}</div>
        <div class="header-value-box ${valueClass}">
          <div class="header-value-text">${escapeHtml(item.value)}</div>
          <button class="copy-snippet-btn" data-copy="${escapeHtml(item.value === "Header not returned by server." ? (item.rec || item.name) : item.value)}">Copy</button>
        </div>
        ${recHtml}
      </div>
    `;

    listEl.appendChild(card);
  });

  document.querySelectorAll(".copy-snippet-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const text = btn.getAttribute("data-copy");
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = "Copied!";
        btn.style.borderColor = "#10b981";
        btn.style.color = "#10b981";
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.borderColor = "";
          btn.style.color = "";
        }, 1500);
      });
    });
  });
}

function showError(msg) {
  const listEl = document.getElementById("findingsList");
  listEl.innerHTML = `
    <div class="header-card status-missing" style="padding: 20px; text-align: center;">
      <h3 style="color: #ef4444; margin-bottom: 8px;">Analysis Notice</h3>
      <p style="color: #94a3b8; margin-bottom: 12px;">${escapeHtml(msg)}</p>
      <button id="retryBtn" class="btn-secondary" style="margin: 0 auto;">Retry Live Scan</button>
    </div>
  `;
  const retry = document.getElementById("retryBtn");
  if (retry) {
    retry.addEventListener("click", () => {
      analyzeCurrentTab();
    });
  }
}

function copyMarkdownReport() {
  const target = document.getElementById("targetUrl").textContent;
  const grade = document.getElementById("gradeLetter").textContent;
  const score = document.getElementById("gradeTitle").textContent;
  const dateStr = new Date().toISOString().split("T")[0];

  let md = `# Pentest Assessment: HTTP Security Header Audit\n\n`;
  md += `- **Target URL:** \`${target}\`\n`;
  md += `- **Audit Date:** ${dateStr}\n`;
  md += `- **Overall Risk Rating:** **Grade ${grade}** (${score})\n`;
  md += `- **Architect & Trademark:** Vijay Uba™\n\n`;

  md += `## Executive Summary\n`;
  md += `During the web application security assessment, HTTP response headers were analyzed for defensive controls and information leakage.\n\n`;

  const missing = currentFindings.filter(f => f.status === "missing");
  const warnings = currentFindings.filter(f => f.status === "warning");
  const present = currentFindings.filter(f => f.status === "present");

  if (missing.length > 0) {
    md += `### ❌ Missing Security Controls (${missing.length})\n\n`;
    missing.forEach(m => {
      md += `#### ${m.name}\n`;
      md += `- **Finding:** Header is missing from HTTP responses.\n`;
      md += `- **Risk / Vulnerability:** ${m.desc}\n`;
      if (m.rec) md += `- **Recommended Remediation:** \`${m.rec}\`\n`;
      md += `\n`;
    });
  }

  if (warnings.length > 0) {
    md += `### ⚠️ Information Disclosure & Fingerprinting (${warnings.length})\n\n`;
    warnings.forEach(w => {
      md += `#### ${w.name}\n`;
      md += `- **Value Leaked:** \`${w.value}\`\n`;
      md += `- **Impact:** ${w.desc}\n\n`;
    });
  }

  if (present.length > 0) {
    md += `### ✅ Present & Verified Security Headers (${present.length})\n\n`;
    present.forEach(p => {
      md += `- **${p.name}:** \`${p.value}\`\n`;
    });
  }

  navigator.clipboard.writeText(md).then(() => {
    const btn = document.getElementById("copyMarkdownBtn");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Copied Markdown to Clipboard!</span>`;
    btn.style.borderColor = "#10b981";
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.style.borderColor = "";
    }, 2000);
  });
}

function copyJsonReport() {
  const exportObj = {
    target: document.getElementById("targetUrl").textContent,
    timestamp: new Date().toISOString(),
    grade: document.getElementById("gradeLetter").textContent,
    findings: currentFindings
  };
  navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2)).then(() => {
    const btn = document.getElementById("copyJsonBtn");
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<span>Copied JSON!</span>`;
    btn.style.borderColor = "#10b981";
    setTimeout(() => {
      btn.innerHTML = origHtml;
      btn.style.borderColor = "";
    }, 2000);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
